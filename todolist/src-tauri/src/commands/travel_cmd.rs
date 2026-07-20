use crate::models::travel::{
    VisitedCity, CreateVisitedCityParams, UpdateVisitedCityParams,
    CityNote, CreateCityNoteParams, UpdateCityNoteParams, CityDetail,
    WishlistItem, CreateWishlistParams, UpdateWishlistParams,
};
use crate::services::travel_svc;
use crate::AppState;

#[tauri::command]
pub fn create_visited_city(
    state: tauri::State<AppState>,
    id: String,
    params: CreateVisitedCityParams,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    travel_svc::create_city(&db, &id, &params)
}

#[tauri::command]
pub fn update_visited_city(
    state: tauri::State<AppState>,
    id: String,
    params: UpdateVisitedCityParams,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    travel_svc::update_city(&db, &id, &params)
}

#[tauri::command]
pub fn delete_visited_city(
    state: tauri::State<AppState>,
    id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    travel_svc::delete_city(&db, &id)
}

#[tauri::command]
pub fn get_all_visited_cities(
    state: tauri::State<AppState>,
) -> Result<Vec<VisitedCity>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    travel_svc::get_all_cities(&db)
}

#[tauri::command]
pub fn get_city_detail(
    state: tauri::State<AppState>,
    id: String,
) -> Result<CityDetail, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    travel_svc::get_city_detail(&db, &id)
}

#[tauri::command]
pub fn add_city_note(
    state: tauri::State<AppState>,
    id: String,
    params: CreateCityNoteParams,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    travel_svc::create_note(&db, &id, &params)
}

#[tauri::command]
pub fn update_city_note(
    state: tauri::State<AppState>,
    id: String,
    params: UpdateCityNoteParams,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    travel_svc::update_note(&db, &id, &params)
}

#[tauri::command]
pub fn delete_city_note(
    state: tauri::State<AppState>,
    id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    travel_svc::delete_note(&db, &id)
}

#[tauri::command]
pub fn get_city_notes(
    state: tauri::State<AppState>,
    city_id: String,
) -> Result<Vec<CityNote>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    travel_svc::get_notes_by_city(&db, &city_id)
}

// ── Wishlist ──

#[tauri::command] pub fn list_wishlist(state: tauri::State<AppState>) -> Result<Vec<WishlistItem>, String> { let db = state.db.lock().map_err(|e| e.to_string())?; travel_svc::list_wishlist(&db) }
#[tauri::command] pub fn create_wishlist(state: tauri::State<AppState>, id: String, params: CreateWishlistParams) -> Result<(), String> { let db = state.db.lock().map_err(|e| e.to_string())?; travel_svc::create_wishlist(&db, &id, &params) }
#[tauri::command] pub fn update_wishlist(state: tauri::State<AppState>, id: String, params: UpdateWishlistParams) -> Result<(), String> { let db = state.db.lock().map_err(|e| e.to_string())?; travel_svc::update_wishlist(&db, &id, &params) }
#[tauri::command] pub fn delete_wishlist(state: tauri::State<AppState>, id: String) -> Result<(), String> { let db = state.db.lock().map_err(|e| e.to_string())?; travel_svc::delete_wishlist(&db, &id) }
#[tauri::command] pub fn mark_wishlist_visited(state: tauri::State<AppState>, id: String, visited_date: String) -> Result<(), String> { let db = state.db.lock().map_err(|e| e.to_string())?; travel_svc::mark_wishlist_visited(&db, &id, &visited_date) }
