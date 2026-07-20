use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Paper {
    pub id: String,
    pub title: String,
    pub authors: String,
    pub year: Option<i32>,
    pub venue: String,
    pub doi: String,
    pub arxiv_id: String,
    pub status: String,
    pub contribution: String,
    pub notes: String,
    pub rating: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePaperParams {
    pub title: String,
    #[serde(default)]
    pub authors: String,
    pub year: Option<i32>,
    #[serde(default)]
    pub venue: String,
    #[serde(default)]
    pub doi: String,
    #[serde(default)]
    pub arxiv_id: String,
    #[serde(default = "default_status")]
    pub status: String,
}

fn default_status() -> String { "to_read".into() }

#[derive(Debug, Deserialize)]
pub struct UpdatePaperParams {
    pub title: Option<String>,
    pub authors: Option<String>,
    pub year: Option<i32>,
    pub venue: Option<String>,
    pub doi: Option<String>,
    pub arxiv_id: Option<String>,
    pub status: Option<String>,
    pub contribution: Option<String>,
    pub notes: Option<String>,
    pub rating: Option<i32>,
}
