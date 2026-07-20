use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VisitedCity {
    pub id: String,
    pub city_name: String,
    pub country: String,
    pub province: String,
    pub lat: f64,
    pub lng: f64,
    pub visit_date: Option<String>,
    pub rating: i32,
    pub is_highlighted: bool,
    pub color: String,
    pub notes: String,
    pub travel_guide: String,
    pub photos: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateVisitedCityParams {
    pub city_name: String,
    #[serde(default = "default_country")]
    pub country: String,
    #[serde(default)]
    pub province: String,
    pub lat: f64,
    pub lng: f64,
    pub visit_date: Option<String>,
    #[serde(default)]
    pub rating: i32,
    #[serde(default)]
    pub is_highlighted: bool,
    #[serde(default = "default_city_color")]
    pub color: String,
    #[serde(default)]
    pub notes: String,
    #[serde(default)]
    pub travel_guide: String,
    #[serde(default = "default_photos")]
    pub photos: String,
}

fn default_country() -> String {
    "中国".into()
}
fn default_city_color() -> String {
    "#3B82F6".into()
}
fn default_photos() -> String {
    "[]".into()
}

#[derive(Debug, Deserialize)]
pub struct UpdateVisitedCityParams {
    pub city_name: Option<String>,
    pub country: Option<String>,
    pub province: Option<String>,
    pub lat: Option<f64>,
    pub lng: Option<f64>,
    pub visit_date: Option<String>,
    pub rating: Option<i32>,
    pub is_highlighted: Option<bool>,
    pub color: Option<String>,
    pub notes: Option<String>,
    pub travel_guide: Option<String>,
    pub photos: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CityNote {
    pub id: String,
    pub city_id: String,
    pub title: String,
    pub content: String,
    pub note_date: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateCityNoteParams {
    pub city_id: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub content: String,
    pub note_date: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCityNoteParams {
    pub title: Option<String>,
    pub content: Option<String>,
    pub note_date: Option<String>,
}

/// 城市详情 = 城市信息 + 关联旅记列表
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CityDetail {
    pub city: VisitedCity,
    pub notes: Vec<CityNote>,
}

// ── Travel Wishlist ──

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WishlistItem {
    pub id: String,
    pub city_name: String,
    pub country: String,
    pub province: String,
    pub lat: Option<f64>,
    pub lng: Option<f64>,
    pub reason: String,
    pub best_season: String,
    pub budget: f64,
    pub companions: String,
    pub is_visited: bool,
    pub visited_date: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateWishlistParams {
    pub city_name: String,
    #[serde(default = "default_country")]
    pub country: String,
    #[serde(default)]
    pub province: String,
    pub lat: Option<f64>,
    pub lng: Option<f64>,
    #[serde(default)]
    pub reason: String,
    #[serde(default)]
    pub best_season: String,
    #[serde(default)]
    pub budget: f64,
    #[serde(default)]
    pub companions: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateWishlistParams {
    pub city_name: Option<String>,
    pub country: Option<String>,
    pub province: Option<String>,
    pub lat: Option<f64>,
    pub lng: Option<f64>,
    pub reason: Option<String>,
    pub best_season: Option<String>,
    pub budget: Option<f64>,
    pub companions: Option<String>,
}
