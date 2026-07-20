use crate::models::contact::*;
use crate::services::contact_svc;
use crate::AppState;

#[tauri::command] pub fn create_contact(state: tauri::State<AppState>, id: String, params: CreateContactParams) -> Result<(), String> { let db = state.db.lock().map_err(|e| e.to_string())?; contact_svc::create(&db, &id, &params) }
#[tauri::command] pub fn update_contact(state: tauri::State<AppState>, id: String, params: UpdateContactParams) -> Result<(), String> { let db = state.db.lock().map_err(|e| e.to_string())?; contact_svc::update(&db, &id, &params) }
#[tauri::command] pub fn delete_contact(state: tauri::State<AppState>, id: String) -> Result<(), String> { let db = state.db.lock().map_err(|e| e.to_string())?; contact_svc::delete(&db, &id) }
#[tauri::command] pub fn get_contact(state: tauri::State<AppState>, id: String) -> Result<Contact, String> { let db = state.db.lock().map_err(|e| e.to_string())?; contact_svc::get(&db, &id) }
#[tauri::command] pub fn list_contacts(state: tauri::State<AppState>) -> Result<Vec<Contact>, String> { let db = state.db.lock().map_err(|e| e.to_string())?; contact_svc::list_all(&db) }
#[tauri::command] pub fn create_contact_link(state: tauri::State<AppState>, id: String, params: CreateContactLinkParams) -> Result<(), String> { let db = state.db.lock().map_err(|e| e.to_string())?; contact_svc::create_link(&db, &id, &params) }
#[tauri::command] pub fn delete_contact_link(state: tauri::State<AppState>, id: String) -> Result<(), String> { let db = state.db.lock().map_err(|e| e.to_string())?; contact_svc::delete_link(&db, &id) }
#[tauri::command] pub fn get_contact_links(state: tauri::State<AppState>, contact_id: String) -> Result<Vec<ContactLink>, String> { let db = state.db.lock().map_err(|e| e.to_string())?; contact_svc::get_links_for_contact(&db, &contact_id) }
#[tauri::command] pub fn get_contact_graph(state: tauri::State<AppState>) -> Result<ContactGraphData, String> { let db = state.db.lock().map_err(|e| e.to_string())?; contact_svc::get_graph(&db) }
#[tauri::command] pub fn create_contact_relation(state: tauri::State<AppState>, params: CreateContactRelationParams) -> Result<(), String> { let db = state.db.lock().map_err(|e| e.to_string())?; contact_svc::create_relation(&db, &params) }
#[tauri::command] pub fn delete_contact_relation(state: tauri::State<AppState>, params: DeleteContactRelationParams) -> Result<(), String> { let db = state.db.lock().map_err(|e| e.to_string())?; contact_svc::delete_relation(&db, &params) }
#[tauri::command] pub fn set_family_link(state: tauri::State<AppState>, contact_id: String, relation_type: String, target_id: Option<String>) -> Result<(), String> { let db = state.db.lock().map_err(|e| e.to_string())?; contact_svc::set_family_link(&db, &contact_id, &relation_type, target_id.as_deref()) }
