use serde::{Deserialize, Serialize};

/// Full knowledge graph built from Obsidian vault wikilinks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeGraphData {
    pub nodes: Vec<GraphNodeData>,
    pub edges: Vec<GraphEdgeData>,
}

/// A note node in the knowledge graph
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphNodeData {
    /// Relative path from vault root
    pub path: String,
    /// Note title (from frontmatter or filename)
    pub title: String,
    /// Tags from frontmatter
    pub tags: Vec<String>,
    /// Total connections (in + out)
    pub degree: usize,
    /// Number of incoming links
    pub inlink_count: usize,
    /// Number of outgoing links
    pub outlink_count: usize,
}

/// A directed link between two notes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphEdgeData {
    pub source: String,
    pub target: String,
    /// Number of times the link appears
    pub weight: usize,
    /// Display text of the link (alias or filename)
    pub link_text: String,
}

/// Combined context for a task: tag-matched notes + graph neighbors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeContext {
    pub task_id: String,
    /// Directly tag-matched notes from vault
    pub direct_notes: Vec<crate::models::vault::VaultNote>,
    /// Notes 1-2 hops away via wikilinks
    pub graph_neighbors: Vec<GraphNodeData>,
    /// Suggested reading: neighbors sorted by degree
    pub suggested_reading: Vec<String>,
}
