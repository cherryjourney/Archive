use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Memory {
    pub id: String,
    pub date: String,
    pub content: String,
    pub context: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateMemoryParams {
    pub date: String,
    pub content: String,
    pub context: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMemoryParams {
    pub content: Option<String>,
    pub context: Option<String>,
}
