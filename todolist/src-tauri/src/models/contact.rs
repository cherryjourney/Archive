use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Contact {
    pub id: String,
    pub name: String,
    pub contact_info: String,
    pub relationship_type: String,
    pub custom_tags: String,       // JSON array
    pub met_date: Option<String>,
    pub important_dates: String,   // JSON array
    pub common_experiences: String,
    pub notes: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateContactParams {
    pub name: String,
    #[serde(default)]
    pub contact_info: String,
    #[serde(default = "default_rel_type")]
    pub relationship_type: String,
    #[serde(default)]
    pub custom_tags: String,
    pub met_date: Option<String>,
    #[serde(default)]
    pub important_dates: String,
    #[serde(default)]
    pub common_experiences: String,
    #[serde(default)]
    pub notes: String,
}

fn default_rel_type() -> String { "友情".into() }

#[derive(Debug, Deserialize)]
pub struct UpdateContactParams {
    pub name: Option<String>,
    pub contact_info: Option<String>,
    pub relationship_type: Option<String>,
    pub custom_tags: Option<String>,
    pub met_date: Option<String>,
    pub important_dates: Option<String>,
    pub common_experiences: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContactLink {
    pub id: String,
    pub contact_id: String,
    pub entity_type: String,
    pub entity_id: String,
    pub label: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateContactLinkParams {
    pub contact_id: String,
    pub entity_type: String,
    pub entity_id: String,
    #[serde(default)]
    pub label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContactGraphData {
    pub nodes: Vec<GraphNode>,
    pub edges: Vec<GraphEdge>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphNode {
    pub id: String,
    pub name: String,
    pub relationship_type: String,
    pub custom_tags: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphEdge {
    pub source: String,
    pub target: String,
    pub label: String,
    #[serde(default)]
    pub edge_type: String, // "default" | "direct" | "shared"
}

#[derive(Debug, Deserialize)]
pub struct CreateContactRelationParams {
    pub source_id: String,
    pub target_id: String,
    #[serde(default)]
    pub label: String,
}

#[derive(Debug, Deserialize)]
pub struct DeleteContactRelationParams {
    pub source_id: String,
    pub target_id: String,
}
