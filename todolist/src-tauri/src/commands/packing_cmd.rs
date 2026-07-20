use crate::models::packing::{
    PackingList, CreatePackingListParams, UpdatePackingListParams,
    PackingItem, CreatePackingItemParams, UpdatePackingItemParams, ReorderItemsParams,
    PackingListDetail,
};
use crate::services::packing_svc;
use crate::AppState;

/// ── Packing List Commands ──

#[tauri::command]
pub fn list_user_lists(
    state: tauri::State<AppState>,
) -> Result<Vec<PackingList>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    packing_svc::get_all_lists(&db, false)
}

#[tauri::command]
pub fn list_templates(
    state: tauri::State<AppState>,
) -> Result<Vec<PackingList>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    packing_svc::get_all_lists(&db, true)
}

#[tauri::command]
pub fn create_packing_list(
    state: tauri::State<AppState>,
    id: String,
    params: CreatePackingListParams,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    packing_svc::create_list(&db, &id, &params)
}

#[tauri::command]
pub fn update_packing_list(
    state: tauri::State<AppState>,
    id: String,
    params: UpdatePackingListParams,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    packing_svc::update_list(&db, &id, &params)
}

#[tauri::command]
pub fn delete_packing_list(
    state: tauri::State<AppState>,
    id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    packing_svc::delete_list(&db, &id)
}

#[tauri::command]
pub fn duplicate_packing_list(
    state: tauri::State<AppState>,
    template_id: String,
    new_id: String,
    new_title: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    packing_svc::duplicate_list(&db, &template_id, &new_id, &new_title)
}

#[tauri::command]
pub fn get_packing_list_detail(
    state: tauri::State<AppState>,
    id: String,
) -> Result<PackingListDetail, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    packing_svc::get_list_detail(&db, &id)
}

/// ── Packing Item Commands ──

#[tauri::command]
pub fn get_packing_items(
    state: tauri::State<AppState>,
    list_id: String,
) -> Result<Vec<PackingItem>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    packing_svc::get_items(&db, &list_id)
}

#[tauri::command]
pub fn add_packing_item(
    state: tauri::State<AppState>,
    id: String,
    params: CreatePackingItemParams,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    packing_svc::add_item(&db, &id, &params)
}

#[tauri::command]
pub fn update_packing_item(
    state: tauri::State<AppState>,
    id: String,
    params: UpdatePackingItemParams,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    packing_svc::update_item(&db, &id, &params)
}

#[tauri::command]
pub fn toggle_item_packed(
    state: tauri::State<AppState>,
    id: String,
) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    packing_svc::toggle_item_packed(&db, &id)
}

#[tauri::command]
pub fn delete_packing_item(
    state: tauri::State<AppState>,
    id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    packing_svc::delete_item(&db, &id)
}

#[tauri::command]
pub fn reorder_packing_items(
    state: tauri::State<AppState>,
    params: ReorderItemsParams,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    packing_svc::reorder_items(&db, &params)
}

#[tauri::command]
pub fn reset_all_packing_items(
    state: tauri::State<AppState>,
    list_id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    packing_svc::reset_all_items(&db, &list_id)
}

#[tauri::command]
pub fn complete_all_packing_items(
    state: tauri::State<AppState>,
    list_id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    packing_svc::complete_all_items(&db, &list_id)
}
