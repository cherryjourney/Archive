use crate::models::tags::*;
use crate::services::tag_svc;
use crate::AppState;

#[tauri::command]
pub fn create_tag(state: tauri::State<AppState>, params: CreateTagParams) -> Result<Tag, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tag_svc::create_tag(&db, params)
}
#[tauri::command]
pub fn delete_tag(state: tauri::State<AppState>, tag_id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tag_svc::delete_tag(&db, &tag_id)
}
#[tauri::command]
pub fn list_tags(state: tauri::State<AppState>) -> Result<Vec<Tag>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tag_svc::list_tags(&db)
}
#[tauri::command]
pub fn add_tag_to_entity(state: tauri::State<AppState>, tag_id: String, entity_type: String, entity_id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tag_svc::add_tag_to_entity(&db, &tag_id, &entity_type, &entity_id)
}
#[tauri::command]
pub fn remove_tag_from_entity(state: tauri::State<AppState>, tag_id: String, entity_type: String, entity_id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tag_svc::remove_tag_from_entity(&db, &tag_id, &entity_type, &entity_id)
}
#[tauri::command]
pub fn get_tags_for_entity(state: tauri::State<AppState>, entity_type: String, entity_id: String) -> Result<Vec<Tag>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tag_svc::get_tags_for_entity(&db, &entity_type, &entity_id)
}
#[tauri::command]
pub fn get_entities_by_tag(state: tauri::State<AppState>, tag_id: String) -> Result<Vec<(String, String)>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tag_svc::get_entities_by_tag(&db, &tag_id)
}
#[tauri::command]
pub fn create_entity_link(state: tauri::State<AppState>, params: CreateEntityLinkParams) -> Result<EntityLink, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tag_svc::create_entity_link(&db, params)
}
#[tauri::command]
pub fn delete_entity_link(state: tauri::State<AppState>, link_id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tag_svc::delete_entity_link(&db, &link_id)
}
#[tauri::command]
pub fn get_backlinks(state: tauri::State<AppState>, target_type: String, target_id: String) -> Result<Vec<EntityLink>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tag_svc::get_backlinks(&db, &target_type, &target_id)
}
