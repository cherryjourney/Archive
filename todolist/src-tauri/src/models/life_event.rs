use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LifeEvent {
    pub id: String,
    pub title: String,
    pub description: String,
    pub start_date: String,
    pub end_date: Option<String>,
    pub category: String,
    pub color: Option<String>,
    pub start_precision: String,
    pub end_precision: String,
    pub is_highlighted: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateLifeEventParams {
    pub title: String,
    #[serde(default)]
    pub description: Option<String>,
    pub start_date: String,
    pub end_date: Option<String>,
    #[serde(default = "default_category")]
    pub category: String,
    pub color: Option<String>,
    #[serde(default = "default_precision")]
    pub start_precision: String,
    #[serde(default = "default_precision")]
    pub end_precision: String,
    #[serde(default)]
    pub is_highlighted: bool,
}

fn default_precision() -> String { "month".into() }
fn default_category() -> String { "other".into() }

#[derive(Debug, Deserialize)]
pub struct UpdateLifeEventParams {
    pub title: Option<String>,
    pub description: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub category: Option<String>,
    pub color: Option<String>,
    pub start_precision: Option<String>,
    pub end_precision: Option<String>,
    pub is_highlighted: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LifeEventLink {
    pub id: String,
    pub life_event_id: String,
    pub entity_type: String,
    pub entity_id: String,
    pub label: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateLifeEventLinkParams {
    pub life_event_id: String,
    pub entity_type: String,
    pub entity_id: String,
    #[serde(default)]
    pub label: Option<String>,
}

/// Auto-statistics result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LifeEventStats {
    pub task_count: i64,
    pub paper_count: i64,
    pub experiment_count: i64,
}
