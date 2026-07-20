use crate::models::meal::{DailyMeal, SaveMealParams};
use crate::services::meal_svc;
use crate::AppState;

#[tauri::command]
pub fn get_daily_meal(
    state: tauri::State<AppState>,
    date: String,
) -> Result<DailyMeal, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    meal_svc::get_or_create(&db, &date)
}

#[tauri::command]
pub fn save_daily_meal(
    state: tauri::State<AppState>,
    params: SaveMealParams,
) -> Result<DailyMeal, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let meal = meal_svc::save(&db, &params)?;

    // Fire-and-forget: update daily note with meals data
    let export_path = crate::commands::system_cmd::get_export_path(&db);
    drop(db);

    if !export_path.is_empty() {
        let date = params.date.clone();
        let db_path = state.data_dir.join("todolist.db");
        let db_path_str = db_path.to_string_lossy().to_string();
        std::thread::spawn(move || {
            crate::services::vault_svc::update_calendar_note_stats(
                &export_path,
                &db_path_str,
                &date,
            );
        });
    }

    Ok(meal)
}

#[tauri::command]
pub fn delete_daily_meal(
    state: tauri::State<AppState>,
    date: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    meal_svc::delete(&db, &date)
}

#[tauri::command]
pub fn list_meal_dates(
    state: tauri::State<AppState>,
) -> Result<Vec<String>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    meal_svc::list_dates(&db)
}
