use crate::models::paper::*;
use crate::services::paper_svc;
use crate::AppState;

#[tauri::command]
pub fn create_paper(state: tauri::State<AppState>, params: CreatePaperParams) -> Result<Paper, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    paper_svc::create_paper(&db, params)
}
#[tauri::command]
pub fn update_paper(state: tauri::State<AppState>, paper_id: String, params: UpdatePaperParams) -> Result<Paper, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    paper_svc::update_paper(&db, &paper_id, params)
}
#[tauri::command]
pub fn delete_paper(state: tauri::State<AppState>, paper_id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    paper_svc::delete_paper(&db, &paper_id)
}
#[tauri::command]
pub fn get_paper(state: tauri::State<AppState>, paper_id: String) -> Result<Paper, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    paper_svc::get_paper(&db, &paper_id)
}
#[tauri::command]
pub fn list_papers(state: tauri::State<AppState>) -> Result<Vec<Paper>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    paper_svc::list_papers(&db)
}
