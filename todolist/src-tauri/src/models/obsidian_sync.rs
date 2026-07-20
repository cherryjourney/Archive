use serde::{Deserialize, Serialize};

/// Parsed task status from an Obsidian daily note
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ObsidianTaskStatus {
    pub task_id: String,
    pub is_checked: bool,
    pub note_date: String,
    pub line_number: usize,
    pub raw_text: String,
}

/// A task status change event from bidirectional sync
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskStatusChange {
    pub task_id: String,
    pub direction: String,  // 'to_obsidian' | 'from_obsidian'
    pub old_status: String,
    pub new_is_checked: bool,
    pub conflict: bool,
}

/// Generated daily note markdown (frontmatter + body)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyNoteMd {
    pub frontmatter: String,
    pub body: String,
    pub full_markdown: String,
}

/// A TODO item captured from an Obsidian vault markdown file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapturedTodo {
    pub text: String,
    pub source_note_path: String,
    pub line_number: usize,
    pub context: String,
    pub todo_type: String,          // 'checklist' | 'blockquote_todo'
    pub is_already_imported: bool,
}

/// Result of a full bidirectional sync operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchSyncResult {
    pub synced_to_obsidian: usize,
    pub synced_from_obsidian: usize,
    pub conflicts: usize,
    pub errors: Vec<String>,
}
