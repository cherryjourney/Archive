use std::collections::{HashMap, HashSet, VecDeque};
use std::path::Path;

use crate::db::Database;
use crate::models::knowledge_graph::*;

/// Parse Obsidian wikilinks from markdown content.
/// Handles: [[Page]], [[Page|alias]], [[Page#heading]], [[Page#heading|alias]]
pub fn parse_wikilinks(content: &str) -> Vec<(String, String)> {
    let re = regex_lite::Regex::new(r"\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]")
        .expect("Invalid wikilink regex");
    re.captures_iter(content)
        .map(|cap| {
            let target = cap.get(1).map(|m| m.as_str().trim().to_string()).unwrap_or_default();
            let alias = cap.get(2).map(|m| m.as_str().trim().to_string()).unwrap_or_else(|| target.clone());
            (target, alias)
        })
        .collect()
}

/// Scan all vault .md files, extract wikilinks, and build a full knowledge graph.
pub fn build_knowledge_graph(_db: &Database, vault_path: &str) -> Result<KnowledgeGraphData, String> {
    let vault = Path::new(vault_path);
    if !vault.exists() {
        return Err(format!("Vault 目录不存在: {}", vault_path));
    }

    // In-degree & out-degree tracking
    let mut outlinks: HashMap<String, Vec<(String, String)>> = HashMap::new();
    let mut inlink_count: HashMap<String, usize> = HashMap::new();
    let mut node_info: HashMap<String, (String, Vec<String>)> = HashMap::new();

    for entry in walkdir::WalkDir::new(vault)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.extension().map(|e| e == "md").unwrap_or(false) {
            let rel_path = path
                .strip_prefix(vault_path)
                .map(|p| p.to_string_lossy().replace('\\', "/"))
                .unwrap_or_else(|_| path.to_string_lossy().to_string());

            // Skip hidden dirs and .obsidian
            if rel_path.starts_with('.') || rel_path.starts_with('_') {
                continue;
            }

            let Ok(content) = std::fs::read_to_string(path) else { continue };

            // Parse frontmatter for title and tags
            let (title, tags) = parse_frontmatter_brief(&content, &rel_path);
            let links = parse_wikilinks(&content);

            // Count in-degrees for targets
            for (target, _) in &links {
                *inlink_count.entry(target.clone()).or_insert(0) += 1;
            }

            outlinks.insert(rel_path.clone(), links);
            node_info.insert(rel_path.clone(), (title, tags));

            // Ensure every linked target has a node entry (even if file doesn't exist)
            for (target, _) in &outlinks.get(&rel_path).cloned().unwrap_or_default() {
                node_info.entry(target.clone()).or_insert_with(|| {
                    (target.clone(), Vec::new())
                });
            }
        }
    }

    // Build nodes
    let mut nodes: Vec<GraphNodeData> = Vec::new();
    for (path, (title, tags)) in &node_info {
        let out_count = outlinks.get(path).map(|v| v.len()).unwrap_or(0);
        let in_count = inlink_count.get(path).copied().unwrap_or(0);
        nodes.push(GraphNodeData {
            path: path.clone(),
            title: title.clone(),
            tags: tags.clone(),
            degree: in_count + out_count,
            inlink_count: in_count,
            outlink_count: out_count,
        });
    }

    // Build edges
    let mut edge_map: HashMap<(String, String), (usize, String)> = HashMap::new();
    for (source, targets) in &outlinks {
        for (target, alias) in targets {
            let key = (source.clone(), target.clone());
            let entry = edge_map.entry(key).or_insert((0, alias.clone()));
            entry.0 += 1;
        }
    }

    let edges: Vec<GraphEdgeData> = edge_map
        .into_iter()
        .map(|((source, target), (weight, link_text))| GraphEdgeData {
            source,
            target,
            weight,
            link_text,
        })
        .collect();

    Ok(KnowledgeGraphData { nodes, edges })
}

/// Get combined knowledge context for a task: tag-matched notes + 2-layer graph neighbors.
pub fn get_task_knowledge_context(
    db: &Database,
    vault_path: &str,
    task_id: &str,
) -> Result<KnowledgeContext, String> {
    // 1. Get task's tags
    let tags: Vec<String> = db
        .conn()
        .prepare(
            "SELECT t.name FROM tags t
             JOIN entity_tags et ON et.tag_id = t.id
             WHERE et.entity_type = 'task' AND et.entity_id = ?1",
        )
        .and_then(|mut stmt| {
            Ok(stmt
                .query_map(rusqlite::params![task_id], |row| row.get(0))?
                .filter_map(|r| r.ok())
                .collect::<Vec<String>>())
        })
        .map_err(|e| e.to_string())?;

    if tags.is_empty() {
        return Ok(KnowledgeContext {
            task_id: task_id.to_string(),
            direct_notes: Vec::new(),
            graph_neighbors: Vec::new(),
            suggested_reading: Vec::new(),
        });
    }

    // 2. Find direct notes via tag matching (existing scan)
    let direct_notes = crate::services::vault_svc::find_related_notes(vault_path, &tags)?;

    // 3. Build mini-graph from direct notes via BFS (2 layers)
    let graph = build_knowledge_graph(db, vault_path)?;

    // Index nodes by path
    let node_map: HashMap<&str, &GraphNodeData> = graph
        .nodes
        .iter()
        .map(|n| (n.path.as_str(), n))
        .collect();

    // BFS starting from direct note paths
    let mut visited: HashSet<String> = HashSet::new();
    let mut queue: VecDeque<(String, usize)> = VecDeque::new();

    for note in &direct_notes {
        if !visited.contains(&note.path) {
            visited.insert(note.path.clone());
            queue.push_back((note.path.clone(), 0));
        }
    }

    let mut neighbor_paths: Vec<String> = Vec::new();

    while let Some((current, depth)) = queue.pop_front() {
        if depth >= 2 {
            continue;
        }
        for edge in &graph.edges {
            let next = if edge.source == current && !visited.contains(&edge.target) {
                Some(edge.target.clone())
            } else if edge.target == current && !visited.contains(&edge.source) {
                Some(edge.source.clone())
            } else {
                None
            };
            if let Some(next_path) = next {
                visited.insert(next_path.clone());
                neighbor_paths.push(next_path.clone());
                if depth + 1 < 2 {
                    queue.push_back((next_path, depth + 1));
                }
            }
        }
    }

    // Collect neighbor nodes
    let graph_neighbors: Vec<GraphNodeData> = neighbor_paths
        .iter()
        .filter_map(|p| node_map.get(p.as_str()))
        .map(|n| (*n).clone())
        .collect();

    // Suggested reading: top 5 neighbors by degree, excluding direct notes
    let direct_paths: HashSet<&str> = direct_notes.iter().map(|n| n.path.as_str()).collect();
    let mut candidates: Vec<&GraphNodeData> = graph_neighbors
        .iter()
        .filter(|n| !direct_paths.contains(n.path.as_str()))
        .collect();
    candidates.sort_by_key(|n| -(n.degree as isize));
    let suggested_reading: Vec<String> = candidates
        .iter()
        .take(5)
        .map(|n| n.path.clone())
        .collect();

    Ok(KnowledgeContext {
        task_id: task_id.to_string(),
        direct_notes,
        graph_neighbors,
        suggested_reading,
    })
}

/// Lightweight frontmatter parser — extracts only title and tags
fn parse_frontmatter_brief(content: &str, fallback_path: &str) -> (String, Vec<String>) {
    let mut title = String::new();
    let mut tags = Vec::new();

    let filename_title = Path::new(fallback_path)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or(fallback_path)
        .to_string();

    let lines: Vec<&str> = content.lines().collect();
    if lines.is_empty() {
        return (filename_title, tags);
    }

    if lines[0].trim() != "---" {
        return (filename_title, tags);
    }

    let mut in_frontmatter = false;
    for line in &lines[1..] {
        let trimmed = line.trim();
        if trimmed == "---" {
            if in_frontmatter {
                break;
            }
            in_frontmatter = true;
            continue;
        }
        in_frontmatter = true;

        if let Some(value) = trimmed.strip_prefix("title:") {
            title = value.trim().trim_matches('"').trim_matches('\'').to_string();
        } else if let Some(rest) = trimmed.strip_prefix("tags:") {
            if rest.trim().starts_with('[') {
                let inner = rest.trim().trim_start_matches('[').trim_end_matches(']');
                tags = inner.split(',').map(|t| t.trim().trim_matches('"').trim_matches('\'').to_string()).collect();
            }
        } else if in_frontmatter && trimmed.starts_with('-') && !tags.is_empty() {
            let tag = trimmed.trim_start_matches('-').trim();
            tags.push(tag.to_string());
        }
    }

    if title.is_empty() {
        title = filename_title;
    }

    (title, tags)
}
