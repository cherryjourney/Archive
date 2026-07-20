use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewConfig {
    pub enabled: bool,
    pub review_time: String,
    pub position: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyReviewData {
    pub date: String,
    pub tasks_completed: i32,
    pub tasks_total: i32,
    pub pomodoro_minutes: i32,
    pub experiments_updated: i32,
    pub papers_read_today: i32,
    pub finance_spent: f64,
    pub quote: String,
    pub tomorrow_hint: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateReviewConfigParams {
    pub enabled: Option<bool>,
    pub review_time: Option<String>,
    pub position: Option<String>,
}
