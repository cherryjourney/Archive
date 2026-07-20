use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Experiment {
    pub id: String,
    pub title: String,
    pub model: String,
    pub dataset: String,
    pub hyperparams: String,   // JSON
    pub metrics: String,       // JSON
    pub notes: String,
    pub is_baseline: bool,
    pub project_id: Option<String>,
    pub paper_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateExperimentParams {
    pub title: String,
    #[serde(default)]
    pub model: String,
    #[serde(default)]
    pub dataset: String,
    #[serde(default = "default_json")]
    pub hyperparams: String,
    #[serde(default = "default_json")]
    pub metrics: String,
    #[serde(default)]
    pub notes: String,
    #[serde(default)]
    pub is_baseline: bool,
    pub project_id: Option<String>,
    pub paper_id: Option<String>,
}

fn default_json() -> String { "{}".into() }

#[derive(Debug, Deserialize)]
pub struct UpdateExperimentParams {
    pub title: Option<String>,
    pub model: Option<String>,
    pub dataset: Option<String>,
    pub hyperparams: Option<String>,
    pub metrics: Option<String>,
    pub notes: Option<String>,
    pub is_baseline: Option<bool>,
    pub project_id: Option<String>,
    pub paper_id: Option<String>,
}
