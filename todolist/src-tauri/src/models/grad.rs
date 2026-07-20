use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GradMilestone {
    pub id: String,
    pub title: String,
    pub date: String,
    pub milestone_type: String,  // auto/manual
    pub category: String,
    pub description: String,
    pub is_key: bool,
    pub semester: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateMilestoneParams {
    pub title: String,
    pub date: String,
    #[serde(default = "default_milestone_type")]
    pub milestone_type: String,
    #[serde(default = "default_milestone_cat")]
    pub category: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub is_key: bool,
    #[serde(default)]
    pub semester: String,
}

fn default_milestone_type() -> String { "manual".into() }
fn default_milestone_cat() -> String { "other".into() }

#[derive(Debug, Deserialize)]
pub struct UpdateMilestoneParams {
    pub title: Option<String>,
    pub date: Option<String>,
    pub milestone_type: Option<String>,
    pub category: Option<String>,
    pub description: Option<String>,
    pub is_key: Option<bool>,
    pub semester: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemesterReview {
    pub id: String,
    pub semester: String,
    pub period_start: Option<String>,
    pub period_end: Option<String>,
    pub courses_count: i32,
    pub experiments_count: i32,
    pub papers_read: i32,
    pub advisor_meetings: i32,
    pub task_completion_rate: f64,
    pub summary: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct GenerateReviewParams {
    pub semester: String,
    pub period_start: String,
    pub period_end: String,
}
