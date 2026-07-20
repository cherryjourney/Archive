use crate::models::countdown::{CountdownEvent, CreateCountdownParams, UpdateCountdownParams};
use crate::services::countdown_svc;
use crate::AppState;

#[tauri::command]
pub fn create_countdown_event(
    state: tauri::State<AppState>,
    id: String,
    params: CreateCountdownParams,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    countdown_svc::create_event(&db, &id, &params)
}

#[tauri::command]
pub fn update_countdown_event(
    state: tauri::State<AppState>,
    id: String,
    params: UpdateCountdownParams,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    countdown_svc::update_event(&db, &id, &params)
}

#[tauri::command]
pub fn delete_countdown_event(
    state: tauri::State<AppState>,
    id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    countdown_svc::delete_event(&db, &id)
}

#[tauri::command]
pub fn get_all_countdown_events(
    state: tauri::State<AppState>,
) -> Result<Vec<CountdownEvent>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    countdown_svc::get_all_events(&db)
}

#[tauri::command]
pub fn get_dashboard_countdown_events(
    state: tauri::State<AppState>,
) -> Result<Vec<CountdownEvent>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    countdown_svc::get_dashboard_events(&db)
}
