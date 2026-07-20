use crate::models::daily_plan::*;
use crate::services::plan_svc;
use crate::services::plan_svc::ImportFocusRecord;
use crate::AppState;

#[tauri::command]
pub fn get_daily_plan(state: tauri::State<AppState>, date: String) -> Result<DailyPlan, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    plan_svc::get_or_create_daily_plan(&db, &date)
}

#[tauri::command]
pub fn update_morning_plan(
    state: tauri::State<AppState>,
    plan_id: String,
    markdown: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    plan_svc::update_morning_plan(&db, &plan_id, &markdown)
}

#[tauri::command]
pub fn add_task_to_plan(
    state: tauri::State<AppState>,
    plan_id: String,
    task_id: String,
    is_mit: bool,
    start_time: Option<String>,
    end_time: Option<String>,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    plan_svc::add_task_to_plan(&db, &plan_id, &task_id, is_mit, start_time.as_deref(), end_time.as_deref())
}

#[tauri::command]
pub fn update_plan_task_time(
    state: tauri::State<AppState>,
    plan_id: String,
    task_id: String,
    start_time: String,
    end_time: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    plan_svc::update_plan_task_time(&db, &plan_id, &task_id, &start_time, &end_time)
}

#[tauri::command]
pub fn remove_task_from_plan(
    state: tauri::State<AppState>,
    plan_id: String,
    task_id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    plan_svc::remove_task_from_plan(&db, &plan_id, &task_id)
}

#[tauri::command]
pub fn reorder_plan_tasks(
    state: tauri::State<AppState>,
    plan_id: String,
    task_ids: Vec<String>,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    plan_svc::reorder_plan_tasks(&db, &plan_id, task_ids)
}

#[tauri::command]
pub fn complete_task_in_plan(
    state: tauri::State<AppState>,
    plan_id: String,
    task_id: String,
    actual_minutes: Option<i32>,
    completion_note: Option<String>,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    plan_svc::complete_task_in_plan(&db, &plan_id, &task_id, actual_minutes, completion_note.as_deref())?;

    // Fire-and-forget: update daily note stats
    let export_path = crate::commands::system_cmd::get_export_path(&db);

    if !export_path.is_empty() {
        let scheduled_date: Option<String> = db
            .conn()
            .query_row(
                "SELECT scheduled_date FROM tasks WHERE id=?1",
                rusqlite::params![task_id],
                |row| row.get(0),
            )
            .ok();

        if let Some(date) = scheduled_date {
            drop(db);
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
    }

    Ok(())
}

#[tauri::command]
pub fn postpone_task(
    state: tauri::State<AppState>,
    task_id: String,
    from_date: String,
    to_date: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    plan_svc::postpone_task(&db, &task_id, &from_date, &to_date)
}

#[tauri::command]
pub fn update_evening_review(
    state: tauri::State<AppState>,
    plan_id: String,
    params: EveningReviewParams,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    plan_svc::update_evening_review(&db, &plan_id, params)
}

#[tauri::command]
pub fn import_focus_records(
    state: tauri::State<AppState>,
    records: Vec<ImportFocusRecord>,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    plan_svc::import_focus_records(&db, records)
}
