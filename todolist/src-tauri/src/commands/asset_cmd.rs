use crate::models::asset::{Asset, CreateAssetParams, UpdateAssetParams, AssetStats};
use crate::services::asset_svc;
use crate::AppState;

/// ── Asset CRUD Commands ──

#[tauri::command]
pub fn create_asset(
    state: tauri::State<AppState>,
    id: String,
    params: CreateAssetParams,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    asset_svc::create_asset(&db, &id, &params)
}

#[tauri::command]
pub fn update_asset(
    state: tauri::State<AppState>,
    id: String,
    params: UpdateAssetParams,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    asset_svc::update_asset(&db, &id, &params)
}

#[tauri::command]
pub fn delete_asset(
    state: tauri::State<AppState>,
    id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    asset_svc::delete_asset(&db, &id)
}

#[tauri::command]
pub fn get_asset(
    state: tauri::State<AppState>,
    id: String,
) -> Result<Asset, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    asset_svc::get_asset(&db, &id)
}

#[tauri::command]
pub fn list_assets(
    state: tauri::State<AppState>,
    category: Option<String>,
    status: Option<String>,
    search: Option<String>,
    sort_by: Option<String>,
    sort_dir: Option<String>,
) -> Result<Vec<Asset>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    asset_svc::list_assets(&db, category, status, search, sort_by, sort_dir)
}

#[tauri::command]
pub fn get_asset_stats(
    state: tauri::State<AppState>,
) -> Result<AssetStats, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    asset_svc::get_asset_stats(&db)
}

#[tauri::command]
pub fn get_expiring_warranties(
    state: tauri::State<AppState>,
    days: i32,
) -> Result<Vec<Asset>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    asset_svc::get_expiring_warranties(&db, days)
}
