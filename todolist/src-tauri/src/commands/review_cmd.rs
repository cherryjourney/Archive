use crate::models::review::{DailyReviewData, ReviewConfig, UpdateReviewConfigParams};
use crate::services::review_svc;
use crate::AppState;

#[tauri::command]
pub fn get_review_config(state: tauri::State<AppState>) -> Result<ReviewConfig, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    review_svc::get_config(&db)
}

#[tauri::command]
pub fn update_review_config(state: tauri::State<AppState>, params: UpdateReviewConfigParams) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    review_svc::update_config(&db, &params)
}

#[tauri::command]
pub fn get_daily_review(state: tauri::State<AppState>, date: String) -> Result<DailyReviewData, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    review_svc::get_daily_review(&db, &date)
}
