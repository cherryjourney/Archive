use crate::models::advisor::*;
use crate::services::advisor_svc;
use crate::AppState;

#[tauri::command] pub fn create_advisor_meeting(state: tauri::State<AppState>, id: String, params: CreateMeetingParams) -> Result<(), String> { let db = state.db.lock().map_err(|e| e.to_string())?; advisor_svc::create_meeting(&db, &id, &params) }
#[tauri::command] pub fn update_advisor_meeting(state: tauri::State<AppState>, id: String, params: UpdateMeetingParams) -> Result<(), String> { let db = state.db.lock().map_err(|e| e.to_string())?; advisor_svc::update_meeting(&db, &id, &params) }
#[tauri::command] pub fn delete_advisor_meeting(state: tauri::State<AppState>, id: String) -> Result<(), String> { let db = state.db.lock().map_err(|e| e.to_string())?; advisor_svc::delete_meeting(&db, &id) }
#[tauri::command] pub fn get_advisor_meeting(state: tauri::State<AppState>, id: String) -> Result<AdvisorMeeting, String> { let db = state.db.lock().map_err(|e| e.to_string())?; advisor_svc::get_meeting(&db, &id) }
#[tauri::command] pub fn list_advisor_meetings(state: tauri::State<AppState>) -> Result<Vec<AdvisorMeeting>, String> { let db = state.db.lock().map_err(|e| e.to_string())?; advisor_svc::list_meetings(&db) }
#[tauri::command] pub fn get_advisor_config(state: tauri::State<AppState>) -> Result<AdvisorConfig, String> { let db = state.db.lock().map_err(|e| e.to_string())?; advisor_svc::get_config(&db) }
#[tauri::command] pub fn update_advisor_config(state: tauri::State<AppState>, params: UpdateAdvisorConfigParams) -> Result<(), String> { let db = state.db.lock().map_err(|e| e.to_string())?; advisor_svc::update_config(&db, &params) }
#[tauri::command] pub fn get_next_meeting(state: tauri::State<AppState>) -> Result<NextMeetingInfo, String> { let db = state.db.lock().map_err(|e| e.to_string())?; advisor_svc::get_next_meeting(&db) }
#[tauri::command] pub fn batch_create_tasks_from_meeting(state: tauri::State<AppState>, meeting_id: String, action_items_json: String) -> Result<Vec<String>, String> { let db = state.db.lock().map_err(|e| e.to_string())?; advisor_svc::batch_create_tasks(&db, &meeting_id, &action_items_json) }
