use serde::{Deserialize, Serialize};

use super::task::Task;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyPlan {
    pub id: String,
    pub date: String,
    pub morning_plan_md: String,
    pub evening_review_md: String,
    pub efficiency_rating: Option<i32>,
    pub mood_rating: Option<i32>,
    pub notes: String,
    pub created_at: String,
    pub updated_at: String,
    pub tasks: Vec<PlanTask>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanTask {
    pub task_id: String,
    pub sort_order: i32,
    pub is_mit: bool,
    pub start_time: Option<String>,  // HH:MM
    pub end_time: Option<String>,    // HH:MM
    pub added_at: String,
    pub task: Task,
}

#[derive(Debug, Deserialize)]
pub struct EveningReviewParams {
    pub efficiency_rating: Option<i32>,
    pub mood_rating: Option<i32>,
    pub evening_review_md: Option<String>,
    pub notes: Option<String>,
}
