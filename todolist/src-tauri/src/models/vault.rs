use serde::{Deserialize, Serialize};

/// Represents a single Obsidian note with frontmatter metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultNote {
    /// Relative path from vault root (e.g. "wiki/concepts/影响力最大化.md")
    pub path: String,
    /// Note title from frontmatter or filename
    pub title: String,
    /// Tags from frontmatter
    pub tags: Vec<String>,
    /// Last updated date from frontmatter or file mtime
    pub last_updated: String,
}

/// Parsed YAML frontmatter from an Obsidian note
#[derive(Debug, Clone, Default)]
pub struct Frontmatter {
    pub title: Option<String>,
    pub tags: Vec<String>,
    pub last_updated: Option<String>,
}

/// Configuration for vault integration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultConfig {
    pub vault_path: String,
    pub is_configured: bool,
}

/// Result of a tag sync operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncResult {
    pub synced_count: usize,
    pub total_tags: usize,
    pub tags: Vec<String>,
}
