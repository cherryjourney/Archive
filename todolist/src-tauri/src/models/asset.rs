use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Asset {
    pub id: String,
    pub name: String,
    pub category: String,
    pub purchase_date: String,
    pub price: f64,
    pub currency: String,
    pub quantity: i32,
    pub brand: String,
    pub model: String,
    pub warranty_expiry: Option<String>,
    pub status: String,
    pub condition: String,
    pub notes: String,
    pub is_sentimental: bool,
    pub origin: String,
    pub related_people: String,
    pub related_stories: String,
    pub retired_at: Option<String>,
    pub farewell_message: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateAssetParams {
    pub name: String,
    #[serde(default = "default_category")]
    pub category: String,
    pub purchase_date: String,
    #[serde(default)]
    pub price: f64,
    #[serde(default = "default_currency")]
    pub currency: String,
    #[serde(default = "default_quantity")]
    pub quantity: i32,
    #[serde(default)]
    pub brand: String,
    #[serde(default)]
    pub model: String,
    pub warranty_expiry: Option<String>,
    #[serde(default = "default_status")]
    pub status: String,
    #[serde(default = "default_condition")]
    pub condition: String,
    #[serde(default)]
    pub notes: String,
    #[serde(default)]
    pub is_sentimental: bool,
    #[serde(default)]
    pub origin: String,
    #[serde(default)]
    pub related_people: String,
    #[serde(default)]
    pub related_stories: String,
    pub retired_at: Option<String>,
    #[serde(default)]
    pub farewell_message: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAssetParams {
    pub name: Option<String>,
    pub category: Option<String>,
    pub purchase_date: Option<String>,
    pub price: Option<f64>,
    pub currency: Option<String>,
    pub quantity: Option<i32>,
    pub brand: Option<String>,
    pub model: Option<String>,
    pub warranty_expiry: Option<String>,
    pub status: Option<String>,
    pub condition: Option<String>,
    pub notes: Option<String>,
    pub is_sentimental: Option<bool>,
    pub origin: Option<String>,
    pub related_people: Option<String>,
    pub related_stories: Option<String>,
    pub retired_at: Option<String>,
    pub farewell_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetStats {
    pub total_value: f64,
    pub total_count: i64,
}

fn default_category() -> String {
    "other".into()
}
fn default_currency() -> String {
    "CNY".into()
}
fn default_quantity() -> i32 {
    1
}
fn default_status() -> String {
    "in_use".into()
}
fn default_condition() -> String {
    "good".into()
}
