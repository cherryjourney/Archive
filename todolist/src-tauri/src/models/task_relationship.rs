use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskRelationship {
    pub id: String,
    pub source_task_id: String,
    pub target_task_id: String,
    pub relationship_type: String,
    pub is_blocking: bool,
    pub label: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateTaskRelationshipParams {
    pub source_task_id: String,
    pub target_task_id: String,
    #[serde(default = "default_rel_type")]
    pub relationship_type: String,
    #[serde(default)]
    pub is_blocking: bool,
    #[serde(default)]
    pub label: String,
}

fn default_rel_type() -> String {
    "depends_on".into()
}
