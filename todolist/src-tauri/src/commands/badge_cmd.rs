use crate::models::badge::BadgeWithStatus;
use crate::services::badge_svc;
use crate::AppState;

#[tauri::command]
pub fn list_badges(state: tauri::State<AppState>) -> Result<Vec<BadgeWithStatus>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    badge_svc::list_badges(&db)
}

#[tauri::command]
pub fn check_badges(state: tauri::State<AppState>) -> Result<Vec<BadgeWithStatus>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    badge_svc::check_all_badges(&db)
}

#[tauri::command]
pub fn get_new_badge_count(state: tauri::State<AppState>) -> Result<i32, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    badge_svc::get_newly_unlocked_count(&db)
}

#[tauri::command]
pub fn mark_badges_notified(state: tauri::State<AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    badge_svc::mark_all_notified(&db)
}
