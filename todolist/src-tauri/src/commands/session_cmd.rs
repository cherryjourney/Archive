use crate::services::session_svc;
use crate::services::chart_svc::HeatmapCell;
use crate::AppState;

#[tauri::command]
pub fn start_app_session(state: tauri::State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    session_svc::start_session(&db, &id)
}

#[tauri::command]
pub fn end_app_session(state: tauri::State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    session_svc::end_session(&db, &id)
}

#[tauri::command]
pub fn get_app_usage_heatmap(
    state: tauri::State<AppState>,
    year: i32,
) -> Result<Vec<HeatmapCell>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    session_svc::get_daily_usage_heatmap(&db, year)
}
