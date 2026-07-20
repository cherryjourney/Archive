use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub parent_tag_id: Option<String>,
    pub color: String,
    pub created_at: String,
    pub children: Option<Vec<Tag>>,
}
