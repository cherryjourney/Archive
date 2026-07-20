use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionCategory {
    pub id: i32,
    pub name: String,
    pub icon: String,
    pub color: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Account {
    pub id: String,
    pub name: String,
    pub balance: f64,
    pub is_savings: bool,
    pub color: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateAccountParams {
    pub name: String,
    #[serde(default)]
    pub balance: f64,
    #[serde(default)]
    pub is_savings: bool,
    pub color: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAccountParams {
    pub name: Option<String>,
    pub balance: Option<f64>,
    pub is_savings: Option<bool>,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub id: String,
    #[serde(rename = "type")]
    pub type_: String,
    pub amount: f64,
    pub category_id: i32,
    pub account_id: String,
    pub target_account_id: Option<String>,
    pub transfer_id: Option<String>,
    pub date: String,
    pub note: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateTransactionParams {
    #[serde(rename = "type")]
    pub type_: String,
    pub amount: f64,
    pub category_id: i32,
    pub account_id: String,
    pub target_account_id: Option<String>,
    pub date: String,
    #[serde(default)]
    pub note: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTransactionParams {
    #[serde(rename = "type")]
    pub type_: Option<String>,
    pub amount: Option<f64>,
    pub category_id: Option<i32>,
    pub account_id: Option<String>,
    pub date: Option<String>,
    pub note: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct TransactionFilter {
    pub year: Option<i32>,
    pub month: Option<i32>,
    pub category_id: Option<i32>,
    pub account_id: Option<String>,
    #[serde(rename = "type")]
    pub type_: Option<String>,
    pub keyword: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FinanceStats {
    pub monthly_expense: f64,
    pub monthly_income: f64,
    pub savings_total: f64,
    pub net_worth: f64,
    pub expense_count: i64,
    pub income_count: i64,
    pub savings_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonthlyChartData {
    pub month: String,
    pub expense: f64,
    pub income: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryStat {
    pub category_id: i32,
    pub category_name: String,
    pub category_color: String,
    pub total: f64,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyHeatmapCell {
    pub date: String,
    pub expense: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetWorthPoint {
    pub month: String,
    pub net_worth: f64,
}
