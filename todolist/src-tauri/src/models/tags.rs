use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub color: String,
    pub created_at: String,
    #[serde(default = "default_source")]
    pub source: String,
    #[serde(default)]
    pub vault_path: String,
}

fn default_source() -> String {
    "manual".into()
}

#[derive(Debug, Deserialize)]
pub struct CreateTagParams {
    pub name: String,
    #[serde(default = "default_color")]
    pub color: String,
}

fn default_color() -> String {
    "#4C6EF5".into()
}

// ── Entity Link (backlinks) ─────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntityLink {
    pub id: String,
    pub source_type: String,
    pub source_id: String,
    pub target_type: String,
    pub target_id: String,
    pub link_text: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateEntityLinkParams {
    pub source_type: String,
    pub source_id: String,
    pub target_type: String,
    pub target_id: String,
    #[serde(default)]
    pub link_text: String,
}

// ── Link targets (for listing backlinks) ─────────

#[derive(Debug, Clone, Serialize)]
pub struct LinkTarget {
    pub entity_type: String,
    pub entity_id: String,
    pub title: String,
    pub link_text: String,
    pub created_at: String,
}
