use crate::db::Database;
use crate::models::obsidian_sync::{BatchSyncResult, DailyNoteMd, ObsidianTaskStatus, TaskStatusChange};
use crate::models::vault::*;
use crate::utils::{date, id};
use regex_lite::Regex;
use rusqlite::params;
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::time::Duration;
use tauri::Emitter;
use walkdir::WalkDir;

/// Parse YAML frontmatter from markdown content
pub fn parse_frontmatter(content: &str) -> Option<Frontmatter> {
    // Check for opening ---
    let after_open = if content.starts_with("---\n") {
        &content[4..]
    } else if content.starts_with("---\r\n") {
        &content[5..]
    } else {
        return None;
    };

    // Find closing ---
    let end = after_open.find("\n---")?;
    let fm_text = &after_open[..end];

    let mut fm = Frontmatter::default();

    // Parse title
    for line in fm_text.lines() {
        if line.starts_with("title:") {
            fm.title = Some(
                line.trim_start_matches("title:")
                    .trim()
                    .trim_matches('"')
                    .to_string(),
            );
        }
        if line.starts_with("last_updated:") {
            fm.last_updated = Some(
                line.trim_start_matches("last_updated:")
                    .trim()
                    .to_string(),
            );
        }
    }

    // Parse tags list
    let mut in_tags = false;
    for line in fm_text.lines() {
        if line.starts_with("tags:") {
            in_tags = true;
            continue;
        }
        if in_tags {
            let trimmed = line.trim();
            if trimmed.starts_with("- ") {
                let tag = trimmed[2..].trim().to_string();
                if !tag.is_empty() {
                    fm.tags.push(tag);
                }
            } else if !trimmed.is_empty()
                && !trimmed.starts_with("- ")
                && !line.starts_with(' ')
                && !line.starts_with('\t')
            {
                // Non-indented, non-list line — end of tags
                break;
            }
        }
    }

    Some(fm)
}

/// Scan .md files in vault's wiki/concepts/ directory and extract frontmatter.
/// Only reads concept notes — ignores the rest of the vault.
pub fn scan_vault_notes(vault_path: &str) -> Result<Vec<VaultNote>, String> {
    let vault = Path::new(vault_path);
    if !vault.exists() {
        return Err(format!("Vault 目录不存在: {}", vault_path));
    }

    // Only scan wiki/concepts/ — the tag source of truth
    let concepts_dir = vault.join("wiki").join("concepts");
    if !concepts_dir.exists() {
        return Ok(Vec::new());
    }

    let mut notes = Vec::new();

    for entry in WalkDir::new(&concepts_dir)
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

            match fs::read_to_string(path) {
                Ok(content) => {
                    let fm = parse_frontmatter(&content).unwrap_or_default();
                    let title = fm
                        .title
                        .unwrap_or_else(|| path.file_stem()
                            .map(|s| s.to_string_lossy().to_string())
                            .unwrap_or_default());

                    let last_updated = fm.last_updated.unwrap_or_else(|| {
                        fs::metadata(path)
                            .ok()
                            .and_then(|m| m.modified().ok())
                            .map(|t| {
                                let dur = t
                                    .duration_since(std::time::UNIX_EPOCH)
                                    .unwrap_or_default();
                                let secs = dur.as_secs();
                                let days = secs / 86400;
                                let mut y = 1970i64;
                                let mut remaining = days as i64;
                                loop {
                                    let days_in_year =
                                        if is_leap(y) { 366 } else { 365 };
                                    if remaining < days_in_year {
                                        break;
                                    }
                                    remaining -= days_in_year;
                                    y += 1;
                                }
                                let month_days = if is_leap(y) {
                                    [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
                                } else {
                                    [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
                                };
                                let mut m = 0;
                                while m < 12 && remaining >= month_days[m] {
                                    remaining -= month_days[m];
                                    m += 1;
                                }
                                format!("{:04}-{:02}-{:02}", y, m + 1, remaining + 1)
                            })
                            .unwrap_or_else(|| date::today_str())
                    });

                    notes.push(VaultNote {
                        path: rel_path,
                        title,
                        tags: fm.tags,
                        last_updated,
                    });
                }
                Err(_) => continue,
            }
        }
    }

    Ok(notes)
}

fn is_leap(y: i64) -> bool {
    (y % 4 == 0 && y % 100 != 0) || (y % 400 == 0)
}

/// Sync tags from Obsidian vault into Archive · 存迹 tags table.
/// - New tags → INSERT with source='obsidian', random color
/// - Existing obsidian tags → keep as-is (don't overwrite user color changes)
/// - Manual tags → untouched
/// - Never deletes tags (user can delete manually)
pub fn sync_tags_from_vault(db: &Database, vault_path: &str) -> Result<SyncResult, String> {
    let notes = scan_vault_notes(vault_path)?;

    // Aggregate all unique tags from vault
    let mut vault_tags: Vec<String> = notes
        .iter()
        .flat_map(|n| n.tags.clone())
        .collect();
    vault_tags.sort();
    vault_tags.dedup();

    // Get existing tags from DB
    let mut stmt = db
        .conn()
        .prepare("SELECT name, source FROM tags")
        .map_err(|e| e.to_string())?;
    let existing: Vec<(String, String)> = stmt
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let existing_names: Vec<String> = existing.iter().map(|(n, _)| n.clone()).collect();
    let _existing_sources: std::collections::HashMap<String, String> =
        existing.into_iter().collect();

    // Colors for new tags
    let colors = [
        "#4C6EF5", "#7950F2", "#F76707", "#E03131", "#12B886", "#868E96",
        "#F59F00", "#EC4899", "#8B5CF6", "#06B6D4", "#F97316", "#84CC16",
        "#14B8A6", "#6366F1", "#E11D48",
    ];

    let mut synced = 0;
    for (i, tag_name) in vault_tags.iter().enumerate() {
        if !existing_names.contains(tag_name) {
            let tag_id = id::generate_id();
            let now = date::now_str();
            let color = colors[i % colors.len()];
            db.conn()
                .execute(
                    "INSERT OR IGNORE INTO tags (id, name, color, source, vault_path, created_at) VALUES (?1, ?2, ?3, 'obsidian', ?4, ?5)",
                    params![tag_id, tag_name, color, vault_path, now],
                )
                .map_err(|e| e.to_string())?;
            synced += 1;
        }
        // If tag exists with source='obsidian', leave it alone
        // If tag exists with source='manual', don't touch it
    }

    let total = db
        .conn()
        .query_row("SELECT COUNT(*) FROM tags", [], |r| r.get(0))
        .unwrap_or(0);

    Ok(SyncResult {
        synced_count: synced,
        total_tags: total,
        tags: vault_tags,
    })
}

/// Find Obsidian notes related to given tags (for backlink panel).
/// Returns notes sorted by number of matching tags (descending).
pub fn find_related_notes(vault_path: &str, task_tags: &[String]) -> Result<Vec<VaultNote>, String> {
    if task_tags.is_empty() {
        return Ok(Vec::new());
    }

    let notes = scan_vault_notes(vault_path)?;

    let mut scored: Vec<(usize, VaultNote)> = notes
        .into_iter()
        .map(|note| {
            let score = note
                .tags
                .iter()
                .filter(|t| task_tags.contains(t))
                .count();
            (score, note)
        })
        .filter(|(score, _)| *score > 0)
        .collect();

    scored.sort_by(|a, b| b.0.cmp(&a.0));

    Ok(scored.into_iter().map(|(_, note)| note).collect())
}

/// Read the content of a specific note (for preview)
pub fn read_note_content(vault_path: &str, note_path: &str) -> Result<String, String> {
    let full_path = Path::new(vault_path).join(note_path);
    fs::read_to_string(&full_path)
        .map_err(|e| format!("无法读取笔记 {}: {}", note_path, e))
}

/// Collect modification timestamps for .md files in wiki/concepts/ only
fn collect_mtimes(vault_path: &str) -> HashMap<String, u64> {
    let mut mtimes = HashMap::new();
    let concepts_dir = Path::new(vault_path).join("wiki").join("concepts");
    collect_mtimes_recursive(&concepts_dir, &mut mtimes);
    mtimes
}

fn collect_mtimes_recursive(dir: &Path, mtimes: &mut HashMap<String, u64>) {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            let path_str = path.to_string_lossy().to_string();

            if path.is_dir() {
                collect_mtimes_recursive(&path, mtimes);
            } else if path.extension().map(|e| e == "md").unwrap_or(false) {
                if let Ok(meta) = fs::metadata(&path) {
                    if let Ok(modified) = meta.modified() {
                        if let Ok(dur) = modified.duration_since(std::time::UNIX_EPOCH) {
                            mtimes.insert(path_str, dur.as_secs());
                        }
                    }
                }
            }
        }
    }
}

/// Start a polling-based file watcher on the vault directory.
/// Checks for .md file changes every 3 seconds and re-syncs tags.
pub fn start_vault_watcher(
    vault_path: String,
    db_path: String,
    app_handle: tauri::AppHandle,
) {
    std::thread::spawn(move || {
        let mut last_mtimes = collect_mtimes(&vault_path);

        loop {
            std::thread::sleep(Duration::from_secs(3));

            let current_mtimes = collect_mtimes(&vault_path);

            // Compare: check if any mtime changed or new files appeared
            let changed = current_mtimes != last_mtimes;

            if changed {
                // Debounce: wait a bit more in case of rapid saves
                std::thread::sleep(Duration::from_millis(500));

                match Database::new(&db_path) {
                    Ok(db) => {
                        match sync_tags_from_vault(&db, &vault_path) {
                            Ok(result) => {
                                let _ = app_handle.emit("vault-tags-changed", &result);
                            }
                            Err(e) => {
                                eprintln!("[vault-watcher] Sync error: {}", e);
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("[vault-watcher] DB open error: {}", e);
                    }
                }
            }

            last_mtimes = current_mtimes;
        }
    });
}

// ══════════════════════════════════════════════════════════════════
// Feature 1: Daily Plan → Obsidian Daily Note
// ══════════════════════════════════════════════════════════════════

/// Read Obsidian daily notes plugin config (.obsidian/daily-notes.json)
/// Returns (folder, date_format). Defaults: folder="" (vault root), format="YYYY-MM-DD"
pub fn read_daily_note_config(vault_path: &str) -> Result<(String, String), String> {
    let config_path = Path::new(vault_path).join(".obsidian").join("daily-notes.json");
    if !config_path.exists() {
        return Ok((String::new(), "YYYY-MM-DD".to_string()));
    }

    let content = fs::read_to_string(&config_path)
        .map_err(|e| format!("无法读取 daily-notes.json: {}", e))?;

    // Simple JSON parsing without serde_json (the file is small and predictable)
    let folder = extract_json_string(&content, "folder").unwrap_or_default();
    let format_str = extract_json_string(&content, "format").unwrap_or_else(|| "YYYY-MM-DD".to_string());

    Ok((folder, format_str))
}

/// Extract a string value for a key from simple JSON. Handles "key": "value" and "key": value
fn extract_json_string(json: &str, key: &str) -> Option<String> {
    let search = format!("\"{}\"", key);
    let pos = json.find(&search)?;
    let after_key = &json[pos + search.len()..];
    // Skip colon and whitespace
    let after_colon = after_key.trim_start().strip_prefix(':')?.trim_start();
    if after_colon.starts_with('"') {
        // Quoted string
        let end = after_colon[1..].find('"')?;
        Some(after_colon[1..=end].to_string())
    } else {
        // Unquoted value (unlikely but handle)
        let end = after_colon.find(|c: char| c == ',' || c == '}' || c.is_whitespace())?;
        Some(after_colon[..end].to_string())
    }
}

/// Get Chinese weekday name
fn weekday_cn(date_str: &str) -> &'static str {
    if let Some(d) = date::parse_date(date_str) {
        use chrono::Datelike;
        match d.weekday().num_days_from_monday() {
            0 => "星期一",
            1 => "星期二",
            2 => "星期三",
            3 => "星期四",
            4 => "星期五",
            5 => "星期六",
            6 => "星期日",
            _ => "",
        }
    } else {
        ""
    }
}

/// Format date in Obsidian daily note format (supports YYYY, MM, DD, dddd tokens)
fn format_daily_note_date(date_str: &str, format_str: &str) -> String {
    let d = match date::parse_date(date_str) {
        Some(d) => d,
        None => return date_str.to_string(),
    };

    use chrono::Datelike;
    let mut result = format_str.to_string();
    result = result.replace("YYYY", &format!("{:04}", d.year()));
    result = result.replace("MM", &format!("{:02}", d.month()));
    result = result.replace("DD", &format!("{:02}", d.day()));
    result = result.replace("dddd", weekday_cn(date_str));
    result
}

/// Build complete Obsidian daily note markdown from plan data
pub fn build_daily_note_markdown(
    db: &Database,
    date: &str,
) -> Result<DailyNoteMd, String> {
    // Get the plan
    let plan = crate::services::plan_svc::get_or_create_daily_plan(db, date)?;

    let total = plan.tasks.len();
    let completed = plan.tasks.iter()
        .filter(|pt| pt.task.status == "completed")
        .count();
    let completion_rate = if total > 0 {
        completed as f64 / total as f64
    } else {
        0.0
    };

    let weekday = weekday_cn(date);
    let date_display = if let Some(d) = date::parse_date(date) {
        use chrono::Datelike;
        format!("{}年{}月{}日", d.year(), d.month(), d.day())
    } else {
        date.to_string()
    };

    // Frontmatter
    let frontmatter = format!(
        "---\ndate: {}\nplan_id: {}\ncompletion_rate: {:.3}\ntotal_tasks: {}\ncompleted_tasks: {}\ntags:\n  - daily-plan\n---",
        date, plan.id, completion_rate, total, completed
    );

    // Sort tasks by start_time
    let mut sorted_tasks = plan.tasks.clone();
    sorted_tasks.sort_by(|a, b| {
        a.start_time.as_deref().unwrap_or("99:99")
            .cmp(b.start_time.as_deref().unwrap_or("99:99"))
    });

    // Split morning / afternoon / unscheduled
    let morning: Vec<_> = sorted_tasks.iter()
        .filter(|pt| pt.start_time.as_ref().map(|t| t.as_str() < "12:00").unwrap_or(false))
        .collect();
    let afternoon: Vec<_> = sorted_tasks.iter()
        .filter(|pt| pt.start_time.as_ref().map(|t| t.as_str() >= "12:00").unwrap_or(false))
        .collect();
    let unscheduled: Vec<_> = sorted_tasks.iter()
        .filter(|pt| pt.start_time.is_none())
        .collect();

    // Build body
    let mut body = String::new();

    body.push_str(&format!("# 📅 {} {}\n\n", date_display, weekday));
    body.push_str(&format!("> 完成率: {:.0}% · 共 {} 项 · 已完成 {} 项\n\n", completion_rate * 100.0, total, completed));

    // Morning section
    body.push_str("## ☀️ 上午\n\n");
    if morning.is_empty() {
        body.push_str("*暂无安排*\n\n");
    } else {
        for pt in &morning {
            body.push_str(&format_task_line(pt));
        }
        body.push('\n');
    }

    // Afternoon section
    body.push_str("## 🌤️ 下午\n\n");
    if afternoon.is_empty() {
        body.push_str("*暂无安排*\n\n");
    } else {
        for pt in &afternoon {
            body.push_str(&format_task_line(pt));
        }
        body.push('\n');
    }

    // Unscheduled section
    body.push_str("## 📥 待安排\n\n");
    if unscheduled.is_empty() {
        body.push_str("*全部已安排*\n\n");
    } else {
        for pt in &unscheduled {
            body.push_str(&format_unscheduled_line(pt));
        }
        body.push('\n');
    }

    // Meals section
    body.push_str("## 🍽️ 一日三餐\n\n");
    let meals = db.conn().query_row(
        "SELECT breakfast, lunch, dinner, drinks FROM daily_meals WHERE date = ?1",
        params![date],
        |row| {
            Ok((
                row.get::<_, String>(0).unwrap_or_default(),
                row.get::<_, String>(1).unwrap_or_default(),
                row.get::<_, String>(2).unwrap_or_default(),
                row.get::<_, String>(3).unwrap_or_default(),
            ))
        },
    );
    match meals {
        Ok((bf, lu, di, dr)) => {
            let bf_text = if bf.is_empty() { "未记录" } else { &bf };
            let lu_text = if lu.is_empty() { "未记录" } else { &lu };
            let di_text = if di.is_empty() { "未记录" } else { &di };
            let dr_text = if dr.is_empty() { "未记录" } else { &dr };
            body.push_str(&format!("- 🌅 早餐: {}\n", bf_text));
            body.push_str(&format!("- ☀️ 午餐: {}\n", lu_text));
            body.push_str(&format!("- 🌙 晚餐: {}\n", di_text));
            body.push_str(&format!("- 🥤 饮料: {}\n", dr_text));
        }
        Err(_) => {
            body.push_str("*暂无记录*\n");
        }
    }
    body.push('\n');

    // Memories section
    body.push_str("## 📝 今日记忆\n\n");
    let memories: Vec<String> = db
        .conn()
        .prepare("SELECT content FROM memories WHERE date = ?1 ORDER BY created_at ASC")
        .map_err(|e| e.to_string())
        .and_then(|mut stmt| {
            stmt.query_map(params![date], |row| row.get::<_, String>(0))
                .map_err(|e| e.to_string())
                .map(|rows| rows.filter_map(|r| r.ok()).collect())
        })
        .unwrap_or_default();

    if memories.is_empty() {
        body.push_str("*今日暂无记忆*\n\n");
    } else {
        for mem in &memories {
            body.push_str(&format!("- {}\n", mem));
        }
        body.push('\n');
    }

    // Footer
    body.push_str("\n<!-- Generated by Archive·存迹 -->\n");

    let full_markdown = format!("{}\n\n{}", frontmatter, body);

    Ok(DailyNoteMd {
        frontmatter,
        body,
        full_markdown,
    })
}

/// Format a scheduled task as a checklist line with time range and task ID comment
fn format_task_line(pt: &crate::models::daily_plan::PlanTask) -> String {
    let checked = if pt.task.status == "completed" { "x" } else { " " };
    let mit_star = if pt.is_mit { "⭐ " } else { "" };
    let time_range = match (&pt.start_time, &pt.end_time) {
        (Some(s), Some(e)) => format!("{} - {} ", s, e),
        (Some(s), None) => format!("{} ", s),
        _ => String::new(),
    };
    let mit_flag = if pt.is_mit { " mit" } else { "" };
    format!(
        "- [{}] {}{}{} <!-- task:{}{} -->\n",
        checked, time_range, mit_star, pt.task.title, pt.task_id, mit_flag
    )
}

/// Format an unscheduled task line
fn format_unscheduled_line(pt: &crate::models::daily_plan::PlanTask) -> String {
    let checked = if pt.task.status == "completed" { "x" } else { " " };
    format!(
        "- [{}] {} <!-- task:{} -->\n",
        checked, pt.task.title, pt.task_id
    )
}

/// Write daily note to vault. If file already exists, smart-merge:
/// preserve user content between section headers, only replace task checklist blocks.
pub fn write_daily_note(
    vault_path: &str,
    daily_dir: &str,
    date: &str,
    format_str: &str,
    markdown: &str,
) -> Result<String, String> {
    let dir = if daily_dir.is_empty() {
        Path::new(vault_path).to_path_buf()
    } else {
        Path::new(vault_path).join(daily_dir)
    };

    fs::create_dir_all(&dir)
        .map_err(|e| format!("无法创建 daily notes 目录: {}", e))?;

    let filename = if format_str == "YYYY-MM-DD" {
        format!("{}.md", date)
    } else {
        format!("{}.md", format_daily_note_date(date, format_str))
    };
    let file_path = dir.join(&filename);

    // If file exists, attempt smart merge
    if file_path.exists() {
        let existing = fs::read_to_string(&file_path).unwrap_or_default();
        // Only replace if this file was generated by Archive (has the footer comment)
        if existing.contains("<!-- Generated by Archive") {
            // Merge: preserve user-added content outside task sections
            // For V1, we do a full replace of the generated sections
            // Future: implement section-level diff
            fs::write(&file_path, markdown)
                .map_err(|e| format!("无法写入 daily note: {}", e))?;
        } else {
            // File exists but was NOT generated by Archive — append a section
            let append_block = format!(
                "\n\n---\n\n## 📋 Archive 今日计划\n\n{}\n\n<!-- Generated by Archive·存迹 -->\n",
                &markdown[markdown.find("## ☀️").unwrap_or(0)..]
                    .trim_end_matches("\n<!-- Generated by Archive·存迹 -->\n")
            );
            let merged = format!("{}{}", existing, append_block);
            fs::write(&file_path, merged)
                .map_err(|e| format!("无法写入 daily note: {}", e))?;
        }
    } else {
        fs::write(&file_path, markdown)
            .map_err(|e| format!("无法写入 daily note: {}", e))?;
    }

    let rel_path = if daily_dir.is_empty() {
        filename
    } else {
        format!("{}/{}", daily_dir, filename)
    };

    Ok(rel_path)
}

/// Orchestrator: build and write a daily note from plan data
pub fn generate_and_write_daily_note(
    db: &Database,
    vault_path: &str,
    date: &str,
) -> Result<String, String> {
    let (daily_dir, format_str) = read_daily_note_config(vault_path)?;
    let md = build_daily_note_markdown(db, date)?;
    let note_path = write_daily_note(vault_path, &daily_dir, date, &format_str, &md.full_markdown)?;

    // Record in vault_daily_notes
    let now = date::now_str();
    db.conn()
        .execute(
            "INSERT OR REPLACE INTO vault_daily_notes (plan_date, note_path, exported_at) VALUES (?1, ?2, ?3)",
            params![date, note_path, now],
        )
        .map_err(|e| e.to_string())?;

    Ok(note_path)
}

// ══════════════════════════════════════════════════════════════════
// Feature 4: Think → Act → Settle Pipeline (Capture + Settle)
// ══════════════════════════════════════════════════════════════════

/// Scan all .md files in the vault for unchecked checklist items and `> TODO` blockquotes.
/// Deduplicates against `obsidian_todo_capture_log`.
pub fn capture_todos_from_vault(
    vault_path: &str,
    db: &Database,
) -> Result<Vec<crate::models::obsidian_sync::CapturedTodo>, String> {
    let vault = Path::new(vault_path);
    if !vault.exists() {
        return Err(format!("Vault 目录不存在: {}", vault_path));
    }

    // Load previously captured (path, line) pairs for dedup
    let mut captured_set: HashMap<(String, usize), ()> = HashMap::new();
    if let Ok(mut stmt) = db.conn()
        .prepare("SELECT note_path, line_number FROM obsidian_todo_capture_log")
    {
        if let Ok(rows) = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, usize>(1)?))
        }) {
            for r in rows.flatten() {
                captured_set.insert(r, ());
            }
        }
    }

    let mut todos = Vec::new();

    for entry in WalkDir::new(vault)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.extension().map(|e| e == "md").unwrap_or(false) {
            // Skip .obsidian directory
            if path.to_string_lossy().contains(".obsidian") {
                continue;
            }

            let rel_path = path
                .strip_prefix(vault_path)
                .map(|p| p.to_string_lossy().replace('\\', "/"))
                .unwrap_or_else(|_| path.to_string_lossy().to_string());

            let content = match fs::read_to_string(path) {
                Ok(c) => c,
                Err(_) => continue,
            };

            let lines: Vec<&str> = content.lines().collect();

            for (i, line) in lines.iter().enumerate() {
                let trimmed = line.trim();
                let line_num = i + 1;

                // Check if already imported
                if captured_set.contains_key(&(rel_path.clone(), line_num)) {
                    continue;
                }

                let (text, todo_type) = if trimmed.starts_with("- [ ] ") {
                    (trimmed[6..].to_string(), "checklist".to_string())
                } else if trimmed.starts_with("> TODO") || trimmed.starts_with("> **TODO**") {
                    let text = trimmed.trim_start_matches('>').trim();
                    let text = text.trim_start_matches("**TODO**").trim();
                    (text.to_string(), "blockquote_todo".to_string())
                } else {
                    continue;
                };

                if text.is_empty() {
                    continue;
                }

                // Get surrounding context (3 lines before and after)
                let ctx_start = if i >= 3 { i - 3 } else { 0 };
                let ctx_end = std::cmp::min(i + 4, lines.len());
                let context = lines[ctx_start..ctx_end].join("\n");

                todos.push(crate::models::obsidian_sync::CapturedTodo {
                    text,
                    source_note_path: rel_path.clone(),
                    line_number: line_num,
                    context,
                    todo_type,
                    is_already_imported: false,
                });
            }
        }
    }

    Ok(todos)
}

/// Import selected captured TODOs as Archive tasks.
/// Creates tasks and records in `obsidian_todo_capture_log`.
pub fn import_captured_todos(
    db: &Database,
    _vault_path: &str,
    indices: &[usize],
    todos: &[crate::models::obsidian_sync::CapturedTodo],
) -> Result<usize, String> {
    let now = date::now_str();
    let mut imported = 0;

    for &idx in indices {
        if idx >= todos.len() {
            continue;
        }
        let todo = &todos[idx];

        let task_id = id::generate_id();
        db.conn()
            .execute(
                "INSERT INTO tasks (id, title, description, status, priority, created_at, updated_at)
                 VALUES (?1, ?2, '', 'pending', 2, ?3, ?3)",
                params![task_id, todo.text, now],
            )
            .map_err(|e| e.to_string())?;

        // Write task_obsidian_meta with source info (for later settle)
        db.conn()
            .execute(
                "INSERT OR IGNORE INTO task_obsidian_meta (task_id, obsidian_source_path, obsidian_source_line)
                 VALUES (?1, ?2, ?3)",
                params![task_id, todo.source_note_path, todo.line_number as i32],
            )
            .map_err(|e| e.to_string())?;

        // Write capture log for dedup
        let log_id = id::generate_id();
        db.conn()
            .execute(
                "INSERT OR IGNORE INTO obsidian_todo_capture_log (id, task_id, note_path, line_number, captured_at)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![log_id, task_id, todo.source_note_path, todo.line_number as i32, now],
            )
            .map_err(|e| e.to_string())?;

        imported += 1;
    }

    Ok(imported)
}

/// After a task is completed in Archive, append a completion record to its source Obsidian note.
/// The completion record is a blockquote: `> ✅ YYYY-MM-DD 完成任务"title"，实际 Xh`
pub fn settle_task_to_note(
    db: &Database,
    vault_path: &str,
    task_id: &str,
) -> Result<(), String> {
    // Get task info with source path from task_obsidian_meta
    let meta: Option<(String, i32)> = db
        .conn()
        .query_row(
            "SELECT obsidian_source_path, obsidian_source_line FROM task_obsidian_meta WHERE task_id=?1",
            params![task_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .ok();

    let (source_path, _line) = match meta {
        Some(m) => m,
        None => return Err("该任务没有关联的 Obsidian 笔记（非从 Vault 捕获）".into()),
    };

    if source_path.is_empty() {
        return Err("该任务没有关联的 Obsidian 笔记".into());
    }

    // Get task title and completion info
    let task_info: Result<(String, Option<String>, Option<i32>), _> = db
        .conn()
        .query_row(
            "SELECT title, completion_note, actual_minutes FROM tasks WHERE id=?1",
            params![task_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        );

    let (title, completion_note, actual_minutes) = match task_info {
        Ok(t) => t,
        Err(_) => return Err("任务不存在".into()),
    };

    // Build the completion record line
    let today = date::today_str();
    let time_str = actual_minutes
        .map(|m| format!("，实际 {}h{}min", m / 60, m % 60))
        .unwrap_or_default();
    let note_str = completion_note
        .filter(|n| !n.is_empty())
        .map(|n| format!("，备注：{}", n))
        .unwrap_or_default();

    let completion_line = format!(
        "> ✅ {} 完成任务「{}」{}{}\n",
        today, title, time_str, note_str
    );

    // Append to the source note
    let full_path = Path::new(vault_path).join(&source_path);
    let mut content = fs::read_to_string(&full_path)
        .map_err(|e| format!("无法读取笔记 {}: {}", source_path, e))?;

    // Check if a completion section already exists
    if !content.contains("## ✅ 完成记录") {
        content.push_str("\n\n## ✅ 完成记录\n\n");
    }

    content.push_str(&completion_line);

    fs::write(&full_path, content)
        .map_err(|e| format!("无法写回笔记 {}: {}", source_path, e))?;

    // Update sync metadata
    let now = date::now_str();
    db.conn()
        .execute(
            "UPDATE task_obsidian_meta SET obsidian_synced_at=?1 WHERE task_id=?2",
            params![now, task_id],
        )
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ══════════════════════════════════════════════════════════════════
// Feature 2: Bidirectional Task Status Sync
// ══════════════════════════════════════════════════════════════════

/// Parse task statuses from a daily note's markdown content.
/// Extracts `<!-- task:{id}[ mit] -->` comments with associated checkbox state.
pub fn parse_daily_note_tasks(
    content: &str,
    note_date: &str,
) -> Vec<ObsidianTaskStatus> {
    let mut results = Vec::new();
    let re = Regex::new(r"- \[( |x)\] .+<!-- task:([a-f0-9-]+)(?: mit)? -->").unwrap();

    for (line_num, line) in content.lines().enumerate() {
        if let Some(caps) = re.captures(line) {
            let is_checked = caps.get(1).map(|m| m.as_str() == "x").unwrap_or(false);
            let task_id = caps.get(2).map(|m| m.as_str().to_string()).unwrap_or_default();
            if !task_id.is_empty() {
                results.push(ObsidianTaskStatus {
                    task_id,
                    is_checked,
                    note_date: note_date.to_string(),
                    line_number: line_num + 1,
                    raw_text: line.to_string(),
                });
            }
        }
    }

    results
}

/// Scan the daily notes directory for files modified since the given timestamp.
/// Returns all parsed task statuses from modified notes.
pub fn scan_daily_notes_for_changes(
    vault_path: &str,
    daily_dir: &str,
    since: Option<&str>,
) -> Result<Vec<ObsidianTaskStatus>, String> {
    let dir = if daily_dir.is_empty() {
        Path::new(vault_path).to_path_buf()
    } else {
        Path::new(vault_path).join(daily_dir)
    };

    if !dir.exists() {
        return Ok(Vec::new());
    }

    let mut results = Vec::new();

    for entry in std::fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.extension().map(|e| e == "md").unwrap_or(false) {
            // Check mtime if since is provided
            if let Some(ref since_str) = since {
                if let Ok(meta) = std::fs::metadata(&path) {
                    if let Ok(modified) = meta.modified() {
                        if let Ok(dur) = modified.duration_since(std::time::UNIX_EPOCH) {
                            let mtime_str = format!("{}", dur.as_secs());
                            if mtime_str.as_str() <= *since_str {
                                continue; // Not modified since last check
                            }
                        }
                    }
                }
            }

            let content = match fs::read_to_string(&path) {
                Ok(c) => c,
                Err(_) => continue,
            };

            // Extract date from filename: "2026-06-26.md" → "2026-06-26"
            let note_date = path
                .file_stem()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_default();

            let statuses = parse_daily_note_tasks(&content, &note_date);
            results.extend(statuses);
        }
    }

    Ok(results)
}

/// Apply Obsidian-side changes to Archive tasks.
/// For each Obsidian task status, compare with Archive task status and resolve.
pub fn apply_obsidian_changes(
    db: &Database,
    changes: &[ObsidianTaskStatus],
) -> Result<Vec<TaskStatusChange>, String> {
    let now = date::now_str();
    let mut results = Vec::new();

    for change in changes {
        // Get Archive task status
        let task_info: Option<(String, Option<String>)> = db
            .conn()
            .query_row(
                "SELECT status, completed_at FROM tasks WHERE id=?1",
                params![change.task_id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .ok();

        let (archive_status, archive_completed_at) = match task_info {
            Some((s, c)) => (s, c),
            None => continue, // Task doesn't exist in Archive — skip
        };

        // Get previous obsidian sync info
        let obsidian_meta: Option<(String,)> = db
            .conn()
            .query_row(
                "SELECT obsidian_checked_at FROM task_obsidian_meta WHERE task_id=?1",
                params![change.task_id],
                |row| Ok((row.get(0)?,)),
            )
            .ok();

        let archive_is_completed = archive_status == "completed";
        let mut conflict = false;
        let mut direction = "from_obsidian";

        // If both sides agree, nothing to do
        if archive_is_completed == change.is_checked {
            continue;
        }

        // Conflict resolution: timestamp-based arbitration
        if archive_is_completed && !change.is_checked {
            // Archive says completed, Obsidian says unchecked
            if let Some(ref archive_at) = archive_completed_at {
                if let Some((ref obs_checked_at,)) = obsidian_meta {
                    // Compare timestamps
                    if archive_at.as_str() > obs_checked_at.as_str() {
                        // Archive was completed more recently — Archive wins
                        direction = "to_obsidian";
                    } else if obs_checked_at.as_str() > archive_at.as_str() {
                        // Obsidian change was more recent — Obsidian wins
                        // → update Archive (uncomplete the task)
                    } else {
                        // Within 3 seconds — Archive wins by default
                        direction = "to_obsidian";
                        conflict = true;
                    }
                } else {
                    // No Obsidian timestamp — Archive wins
                    direction = "to_obsidian";
                }
            }
        } else if !archive_is_completed && change.is_checked {
            // Archive not completed, Obsidian checked — Obsidian wins
            // Update Archive
        }

        if direction == "from_obsidian" {
            // Apply Obsidian change to Archive
            if change.is_checked {
                db.conn()
                    .execute(
                        "UPDATE tasks SET status='completed', completed_at=?1, updated_at=?1 WHERE id=?2",
                        params![now, change.task_id],
                    )
                    .map_err(|e| e.to_string())?;
            } else {
                db.conn()
                    .execute(
                        "UPDATE tasks SET status='pending', completed_at=NULL, updated_at=?1 WHERE id=?2",
                        params![now, change.task_id],
                    )
                    .map_err(|e| e.to_string())?;
            }

            // Update obsidian meta
            db.conn()
                .execute(
                    "INSERT OR REPLACE INTO task_obsidian_meta (task_id, obsidian_checked_at, obsidian_synced_at)
                     VALUES (?1, ?2, ?3)",
                    params![change.task_id, now, now],
                )
                .map_err(|e| e.to_string())?;

            // Log sync
            let log_id = id::generate_id();
            let action = if change.is_checked { "check" } else { "uncheck" };
            db.conn()
                .execute(
                    "INSERT INTO obsidian_sync_log (id, task_id, direction, action, synced_at, status)
                     VALUES (?1, ?2, 'from_obsidian', ?3, ?4, 'success')",
                    params![log_id, change.task_id, action, now],
                )
                .map_err(|e| e.to_string())?;
        }

        results.push(TaskStatusChange {
            task_id: change.task_id.clone(),
            direction: direction.to_string(),
            old_status: archive_status,
            new_is_checked: change.is_checked,
            conflict,
        });
    }

    Ok(results)
}

/// Update checkboxes in a daily note file based on Archive task statuses.
pub fn update_daily_note_checkboxes(
    vault_path: &str,
    daily_dir: &str,
    date: &str,
    statuses: &[(String, bool)],  // (task_id, is_checked)
) -> Result<(), String> {
    let dir = if daily_dir.is_empty() {
        Path::new(vault_path).to_path_buf()
    } else {
        Path::new(vault_path).join(daily_dir)
    };

    let file_path = dir.join(format!("{}.md", date));
    if !file_path.exists() {
        return Ok(()); // No daily note to update
    }

    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("无法读取 daily note: {}", e))?;

    let mut lines: Vec<String> = content.lines().map(|l| l.to_string()).collect();
    let re = Regex::new(r"- \[( |x)\] (.+)<!-- task:([a-f0-9-]+)").unwrap();

    for (task_id, is_checked) in statuses {
        for line in lines.iter_mut() {
            if let Some(caps) = re.captures(line) {
                if let Some(id_match) = caps.get(3) {
                    if id_match.as_str() == task_id.as_str() {
                        let new_check = if *is_checked { 'x' } else { ' ' };
                        *line = line.replacen(
                            &format!("- [{}] ", caps.get(1).unwrap().as_str()),
                            &format!("- [{}] ", new_check),
                            1,
                        );
                        break;
                    }
                }
            }
        }
    }

    fs::write(&file_path, lines.join("\n"))
        .map_err(|e| format!("无法写入 daily note: {}", e))?;

    Ok(())
}

/// Full bidirectional sync orchestration.
/// 1. Push Archive → Obsidian: update daily note checkboxes for changed tasks
/// 2. Pull Obsidian → Archive: apply changes from daily notes
pub fn full_bidirectional_sync(
    db: &Database,
    vault_path: &str,
    date: &str,
) -> Result<BatchSyncResult, String> {
    let (daily_dir, _format) = read_daily_note_config(vault_path)?;
    let now = date::now_str();

    let mut result = BatchSyncResult {
        synced_to_obsidian: 0,
        synced_from_obsidian: 0,
        conflicts: 0,
        errors: Vec::new(),
    };

    // ── Push: Archive → Obsidian ──
    // Get plan tasks for the given date
    if let Ok(plan) = crate::services::plan_svc::get_or_create_daily_plan(db, date) {
        let mut push_statuses: Vec<(String, bool)> = Vec::new();
        for pt in &plan.tasks {
            let is_completed = pt.task.status == "completed";
            push_statuses.push((pt.task_id.clone(), is_completed));
        }

        if !push_statuses.is_empty() {
            match update_daily_note_checkboxes(vault_path, &daily_dir, date, &push_statuses) {
                Ok(()) => {
                    result.synced_to_obsidian = push_statuses.len();
                    // Update sync timestamps
                    for (task_id, _) in &push_statuses {
                        let _ = db.conn().execute(
                            "INSERT OR REPLACE INTO task_obsidian_meta (task_id, obsidian_synced_at)
                             VALUES (?1, ?2)",
                            params![task_id, now],
                        );
                    }
                }
                Err(e) => result.errors.push(format!("Push failed: {}", e)),
            }
        }
    }

    // ── Pull: Obsidian → Archive ──
    match scan_daily_notes_for_changes(vault_path, &daily_dir, None) {
        Ok(changes) => {
            if !changes.is_empty() {
                match apply_obsidian_changes(db, &changes) {
                    Ok(applied) => {
                        result.synced_from_obsidian = applied.len();
                        result.conflicts = applied.iter().filter(|c| c.conflict).count();
                    }
                    Err(e) => result.errors.push(format!("Pull apply failed: {}", e)),
                }
            }
        }
        Err(e) => result.errors.push(format!("Pull scan failed: {}", e)),
    }

    // Update last sync time on vault_daily_notes
    let _ = db.conn().execute(
        "INSERT OR REPLACE INTO vault_daily_notes (plan_date, note_path, exported_at, last_synced_at)
         VALUES (?1, ?2, ?3, ?3)",
        params![date, format!("{}/{}.md", daily_dir, date), now],
    );

    Ok(result)
}

/// Sync a single task's status to its Obsidian daily note.
/// Called after completing/uncompleting a task in Archive.
pub fn sync_task_to_obsidian_note(
    db: &Database,
    vault_path: &str,
    task_id: &str,
) -> Result<(), String> {
    // Get task info
    let task_info: Option<(String, Option<String>)> = db
        .conn()
        .query_row(
            "SELECT status, scheduled_date FROM tasks WHERE id=?1",
            params![task_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .ok();

    let (_status, scheduled_date) = match task_info {
        Some(t) => t,
        None => return Err("任务不存在".into()),
    };

    let date = scheduled_date.unwrap_or_else(|| date::today_str());
    let (daily_dir, _format) = read_daily_note_config(vault_path)?;

    let is_completed = _status == "completed";
    let statuses = vec![(task_id.to_string(), is_completed)];

    update_daily_note_checkboxes(vault_path, &daily_dir, &date, &statuses)
}

/// Start a watcher thread for the daily notes directory.
/// Polls every 10 seconds for changes and triggers sync.
pub fn start_sync_watcher(
    vault_path: String,
    db_path: String,
    app_handle: tauri::AppHandle,
) {
    std::thread::spawn(move || {
        let (daily_dir, _) = read_daily_note_config(&vault_path).unwrap_or_default();

        loop {
            std::thread::sleep(Duration::from_secs(10));

            let changes = scan_daily_notes_for_changes(&vault_path, &daily_dir, None)
                .unwrap_or_default();

            if changes.is_empty() {
                continue;
            }

            match Database::new(&db_path) {
                Ok(db) => {
                    match apply_obsidian_changes(&db, &changes) {
                        Ok(applied) => {
                            if !applied.is_empty() {
                                let _ = app_handle.emit("vault-sync-changed", &applied);
                            }
                        }
                        Err(e) => {
                            eprintln!("[sync-watcher] Apply error: {}", e);
                        }
                    }
                }
                Err(e) => {
                    eprintln!("[sync-watcher] DB open error: {}", e);
                }
            }
        }
    });
}

// ══════════════════════════════════════════════════════════════════
// Feature 5: Calendar Skin — 批量生成/更新 Daily Notes
// ══════════════════════════════════════════════════════════════════

/// Generate a daily note for a single date (delegates to existing orchestrator).
pub fn generate_calendar_note(
    db: &Database,
    vault_path: &str,
    date: &str,
) -> Result<String, String> {
    generate_and_write_daily_note(db, vault_path, date)
}

/// Iterate all plans in `daily_plans` and generate daily notes for each.
/// Returns the count of notes successfully written.
pub fn sync_all_plans_to_calendar(
    db: &Database,
    vault_path: &str,
) -> Result<usize, String> {
    let vault = Path::new(vault_path);
    if !vault.exists() {
        return Err(format!("Vault 目录不存在: {}", vault_path));
    }

    // Collect all plan dates
    let dates: Vec<String> = db
        .conn()
        .prepare("SELECT DISTINCT date FROM daily_plans ORDER BY date")
        .and_then(|mut stmt| {
            Ok(stmt
                .query_map([], |row| row.get(0))?
                .filter_map(|r| r.ok())
                .collect())
        })
        .map_err(|e| e.to_string())?;

    if dates.is_empty() {
        return Ok(0);
    }

    let mut count: usize = 0;
    for date in &dates {
        match generate_and_write_daily_note(db, vault_path, date) {
            Ok(path) => {
                println!("[calendar-sync] {} → {}", date, path);
                count += 1;
            }
            Err(e) => {
                eprintln!("[calendar-sync] {} error: {}", date, e);
            }
        }
    }

    Ok(count)
}

/// Update a single date's daily note stats (completion rate, checkboxes).
/// Called as fire-and-forget after task completion/review changes.
pub fn update_calendar_note_stats(
    vault_path: &str,
    db_path: &str,
    date: &str,
) {
    let Ok(database) = Database::new(db_path) else { return };
    let Ok(exists) = Path::new(vault_path).try_exists() else { return };
    if !exists { return; }

    // Rebuild the note — generate_and_write_daily_note handles
    // reading current plan state and smart-merging
    if let Err(e) = generate_and_write_daily_note(&database, vault_path, date) {
        eprintln!("[calendar-stats] {} update failed: {}", date, e);
    }
}
