use crate::services::user_profile_svc;
use crate::AppState;

#[tauri::command]
pub fn get_user_profile(
    state: tauri::State<AppState>,
    key: String,
) -> Result<Option<String>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    user_profile_svc::get_profile(&db, &key)
}

#[tauri::command]
pub fn set_user_profile(
    state: tauri::State<AppState>,
    key: String,
    value: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    user_profile_svc::set_profile(&db, &key, &value)
}
