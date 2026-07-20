use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmotionEntry {
    pub id: String,
    pub date: String,
    pub emoji_1: String,
    pub emoji_2: String,
    pub emoji_3: String,
    pub emoji_4: String,
    pub emoji_5: String,
    pub control_score: i32,
    pub notes: String,
    pub weather: String,
    pub task_completed_count: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct SaveEmotionParams {
    pub date: String,
    pub emoji_1: String,
    pub emoji_2: String,
    pub emoji_3: String,
    pub emoji_4: String,
    pub emoji_5: String,
    pub control_score: i32,
    pub notes: String,
    pub weather: String,
    pub task_completed_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmotionHeatmapCell {
    pub date: String,
    pub control_score: i32,
    pub emoji_1: String,
}
