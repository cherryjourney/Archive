use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdvisorMeeting {
    pub id: String,
    pub date: String,
    pub summary: String,
    pub feedback: String,
    pub action_items: String,      // JSON array
    pub next_goals: String,
    pub related_task_ids: String,  // JSON array
    pub related_experiment_ids: String, // JSON array
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateMeetingParams {
    pub date: String,
    #[serde(default)]
    pub summary: String,
    #[serde(default)]
    pub feedback: String,
    #[serde(default)]
    pub action_items: String,
    #[serde(default)]
    pub next_goals: String,
    #[serde(default)]
    pub related_task_ids: String,
    #[serde(default)]
    pub related_experiment_ids: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMeetingParams {
    pub date: Option<String>,
    pub summary: Option<String>,
    pub feedback: Option<String>,
    pub action_items: Option<String>,
    pub next_goals: Option<String>,
    pub related_task_ids: Option<String>,
    pub related_experiment_ids: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdvisorConfig {
    pub meeting_pattern: String,
    pub meeting_day_of_week: i32,
    pub last_meeting_date: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAdvisorConfigParams {
    pub meeting_pattern: Option<String>,
    pub meeting_day_of_week: Option<i32>,
    pub last_meeting_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NextMeetingInfo {
    pub days_until: i32,
    pub expected_date: String,
    pub pattern_label: String,
}
