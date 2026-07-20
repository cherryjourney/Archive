use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: String,
    pub status: String,
    pub priority: i32,
    pub estimated_minutes: Option<i32>,
    pub actual_minutes: Option<i32>,
    pub due_date: Option<String>,
    pub scheduled_date: Option<String>,
    pub is_recurring: bool,
    pub recurring_rule: Option<String>,
    pub parent_task_id: Option<String>,
    pub sort_order: i32,
    pub is_mit: bool,
    pub completion_note: String,
    pub created_at: String,
    pub updated_at: String,
    pub completed_at: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub progress: i32,
    pub color: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTaskParams {
    pub title: String,
    #[serde(default)]
    pub description: String,
    #[serde(default = "default_priority")]
    pub priority: i32,
    pub estimated_minutes: Option<i32>,
    pub due_date: Option<String>,
    pub scheduled_date: Option<String>,
    pub parent_task_id: Option<String>,
    pub category_id: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    #[serde(default)]
    pub progress: i32,
    #[serde(default)]
    pub color: Option<String>,
}

fn default_priority() -> i32 {
    2
}

#[derive(Debug, Deserialize)]
pub struct UpdateTaskParams {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<i32>,
    pub estimated_minutes: Option<i32>,
    pub actual_minutes: Option<i32>,
    pub due_date: Option<String>,
    pub scheduled_date: Option<String>,
    pub is_recurring: Option<bool>,
    pub recurring_rule: Option<String>,
    pub parent_task_id: Option<String>,
    pub sort_order: Option<i32>,
    pub is_mit: Option<bool>,
    pub category_id: Option<String>,
    pub completion_note: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub progress: Option<i32>,
    pub color: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct TaskFilter {
    pub status: Option<String>,
    pub category_id: Option<String>,
    pub search: Option<String>,
    pub scheduled_date: Option<String>,
    #[serde(default = "default_page")]
    pub page: i32,
    #[serde(default = "default_page_size")]
    pub page_size: i32,
}

fn default_page() -> i32 {
    1
}
fn default_page_size() -> i32 {
    50
}

#[derive(Debug, Serialize)]
pub struct TaskPage {
    pub tasks: Vec<Task>,
    pub total: i32,
    pub page: i32,
    pub page_size: i32,
}
