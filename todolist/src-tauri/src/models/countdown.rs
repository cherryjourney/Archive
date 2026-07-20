use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CountdownEvent {
    pub id: String,
    pub title: String,
    pub target_date: String,
    pub category: String,
    pub repeat_yearly: bool,
    pub show_on_dashboard: bool,
    pub color: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateCountdownParams {
    pub title: String,
    pub target_date: String,
    #[serde(default = "default_category")]
    pub category: String,
    #[serde(default)]
    pub repeat_yearly: bool,
    #[serde(default = "default_show")]
    pub show_on_dashboard: bool,
    pub color: Option<String>,
    #[serde(default)]
    pub notes: Option<String>,
}

fn default_category() -> String { "其他".into() }
fn default_show() -> bool { true }

#[derive(Debug, Deserialize)]
pub struct UpdateCountdownParams {
    pub title: Option<String>,
    pub target_date: Option<String>,
    pub category: Option<String>,
    pub repeat_yearly: Option<bool>,
    pub show_on_dashboard: Option<bool>,
    pub color: Option<String>,
    pub notes: Option<String>,
}
