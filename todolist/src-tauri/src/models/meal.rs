use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyMeal {
    pub date: String,
    pub breakfast: String,
    pub lunch: String,
    pub dinner: String,
    pub drinks: String,
    pub breakfast_cost: f64,
    pub breakfast_account_id: String,
    pub breakfast_txn_id: String,
    pub lunch_cost: f64,
    pub lunch_account_id: String,
    pub lunch_txn_id: String,
    pub dinner_cost: f64,
    pub dinner_account_id: String,
    pub dinner_txn_id: String,
    pub drinks_cost: f64,
    pub drinks_account_id: String,
    pub drinks_txn_id: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct MealPaymentInput {
    #[serde(default)]
    pub cost: f64,
    #[serde(default)]
    pub account_id: String,
}

#[derive(Debug, Deserialize)]
pub struct SaveMealParams {
    pub date: String,
    pub breakfast: String,
    pub lunch: String,
    pub dinner: String,
    pub drinks: String,
    #[serde(default)]
    pub breakfast_payment: Option<MealPaymentInput>,
    #[serde(default)]
    pub lunch_payment: Option<MealPaymentInput>,
    #[serde(default)]
    pub dinner_payment: Option<MealPaymentInput>,
    #[serde(default)]
    pub drinks_payment: Option<MealPaymentInput>,
}
