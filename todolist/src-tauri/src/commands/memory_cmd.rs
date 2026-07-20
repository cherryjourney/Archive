use crate::models::memory::{CreateMemoryParams, Memory, UpdateMemoryParams};
use crate::services::memory_svc;
use crate::AppState;

#[tauri::command]
pub fn create_memory(
    state: tauri::State<AppState>,
    params: CreateMemoryParams,
) -> Result<Memory, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    memory_svc::create(&db, &params)
}

#[tauri::command]
pub fn update_memory(
    state: tauri::State<AppState>,
    id: String,
    params: UpdateMemoryParams,
) -> Result<Memory, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    memory_svc::update(&db, &id, &params)
}

#[tauri::command]
pub fn delete_memory(
    state: tauri::State<AppState>,
    id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    memory_svc::delete(&db, &id)
}

#[tauri::command]
pub fn get_memories_by_date(
    state: tauri::State<AppState>,
    date: String,
) -> Result<Vec<Memory>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    memory_svc::list_by_date(&db, &date)
}

#[tauri::command]
pub fn list_memories(
    state: tauri::State<AppState>,
    limit: i32,
    offset: i32,
) -> Result<Vec<Memory>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    memory_svc::list_all(&db, limit, offset)
}
