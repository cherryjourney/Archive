use crate::models::life_event::{LifeEvent, CreateLifeEventParams, UpdateLifeEventParams,
    LifeEventLink, CreateLifeEventLinkParams, LifeEventStats};
use crate::services::life_event_svc;
use crate::AppState;

#[tauri::command]
pub fn create_life_event(
    state: tauri::State<AppState>,
    id: String,
    params: CreateLifeEventParams,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    life_event_svc::create_event(&db, &id, &params)
}

#[tauri::command]
pub fn update_life_event(
    state: tauri::State<AppState>,
    id: String,
    params: UpdateLifeEventParams,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    life_event_svc::update_event(&db, &id, &params)
}

#[tauri::command]
pub fn delete_life_event(
    state: tauri::State<AppState>,
    id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    life_event_svc::delete_event(&db, &id)
}

#[tauri::command]
pub fn get_all_life_events(
    state: tauri::State<AppState>,
) -> Result<Vec<LifeEvent>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    life_event_svc::get_all_events(&db)
}

#[tauri::command]
pub fn get_life_event(
    state: tauri::State<AppState>,
    id: String,
) -> Result<LifeEvent, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    life_event_svc::get_event(&db, &id)
}

#[tauri::command]
pub fn create_life_event_link(
    state: tauri::State<AppState>,
    id: String,
    params: CreateLifeEventLinkParams,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    life_event_svc::create_link(&db, &id, &params)
}

#[tauri::command]
pub fn delete_life_event_link(
    state: tauri::State<AppState>,
    id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    life_event_svc::delete_link(&db, &id)
}

#[tauri::command]
pub fn get_life_event_links(
    state: tauri::State<AppState>,
    life_event_id: String,
) -> Result<Vec<LifeEventLink>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    life_event_svc::get_links(&db, &life_event_id)
}

#[tauri::command]
pub fn get_life_event_stats(
    state: tauri::State<AppState>,
    start_date: String,
    end_date: String,
) -> Result<LifeEventStats, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    life_event_svc::get_event_stats(&db, &start_date, &end_date)
}
