use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Badge {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub category: String,
    pub criteria_type: String,
    pub criteria_value: i32,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserBadge {
    pub id: String,
    pub badge_id: String,
    pub progress: f64,
    pub unlocked: bool,
    pub unlocked_at: Option<String>,
    pub notified: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BadgeWithStatus {
    pub badge: Badge,
    pub user_badge: Option<UserBadge>,
}
