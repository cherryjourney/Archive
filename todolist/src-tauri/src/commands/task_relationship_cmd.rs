use crate::models::task_relationship::*;
use crate::services::task_relationship_svc;
use crate::AppState;

#[tauri::command]
pub fn create_task_relationship(
    state: tauri::State<AppState>,
    params: CreateTaskRelationshipParams,
) -> Result<TaskRelationship, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    task_relationship_svc::create_task_relationship(&db, params)
}

#[tauri::command]
pub fn delete_task_relationship(
    state: tauri::State<AppState>,
    id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    task_relationship_svc::delete_task_relationship(&db, &id)
}

#[tauri::command]
pub fn list_task_relationships(
    state: tauri::State<AppState>,
) -> Result<Vec<TaskRelationship>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    task_relationship_svc::list_task_relationships(&db)
}
