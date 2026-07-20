use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackingList {
    pub id: String,
    pub title: String,
    pub destination: String,
    pub departure_date: Option<String>,
    pub return_date: Option<String>,
    pub notes: String,
    pub is_template: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePackingListParams {
    pub title: String,
    #[serde(default)]
    pub destination: String,
    pub departure_date: Option<String>,
    pub return_date: Option<String>,
    #[serde(default)]
    pub notes: String,
    #[serde(default)]
    pub is_template: bool,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePackingListParams {
    pub title: Option<String>,
    pub destination: Option<String>,
    pub departure_date: Option<String>,
    pub return_date: Option<String>,
    pub notes: Option<String>,
    pub is_template: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackingItem {
    pub id: String,
    pub list_id: String,
    pub name: String,
    pub category: String,
    pub quantity: i32,
    pub is_packed: bool,
    pub sort_order: i32,
    pub notes: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePackingItemParams {
    pub list_id: String,
    pub name: String,
    #[serde(default = "default_category")]
    pub category: String,
    #[serde(default = "default_quantity")]
    pub quantity: i32,
    #[serde(default)]
    pub notes: String,
}

fn default_category() -> String {
    "other".into()
}
fn default_quantity() -> i32 {
    1
}

#[derive(Debug, Deserialize)]
pub struct UpdatePackingItemParams {
    pub name: Option<String>,
    pub category: Option<String>,
    pub quantity: Option<i32>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ReorderItemsParams {
    pub items: Vec<ItemOrderEntry>,
}

#[derive(Debug, Deserialize)]
pub struct ItemOrderEntry {
    pub id: String,
    pub sort_order: i32,
}

/// 清单详情 = 清单信息 + 物品列表（按分类分组排序）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackingListDetail {
    pub list: PackingList,
    pub items: Vec<PackingItem>,
}
