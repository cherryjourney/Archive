use crate::models::task::*;
use crate::services::{task_svc, search_svc};
use crate::AppState;
use serde::Serialize;

#[derive(Serialize)]
pub struct GlobalSearchResult {
    pub tasks: Vec<SearchHit>,
}

#[derive(Serialize)]
pub struct SearchHit {
    pub id: String,
    pub title: String,
    pub item_type: String,
    pub subtitle: String,
}

#[tauri::command]
pub fn global_search(state: tauri::State<AppState>, query: String) -> Result<GlobalSearchResult, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let result = search_svc::global_search(&db, &query)?;
    Ok(GlobalSearchResult {
        tasks: result.tasks.iter().map(|t| SearchHit {
            id: t.id.clone(), title: t.title.clone(), item_type: "task".into(),
            subtitle: "任务".into(),
        }).collect(),
    })
}

#[tauri::command]
pub fn create_task(
    state: tauri::State<AppState>,
    params: CreateTaskParams,
) -> Result<Task, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    task_svc::create_task(&db, params)
}

#[tauri::command]
pub fn update_task(
    state: tauri::State<AppState>,
    task_id: String,
    params: UpdateTaskParams,
) -> Result<Task, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    task_svc::update_task(&db, &task_id, params)
}

#[tauri::command]
pub fn delete_task(state: tauri::State<AppState>, task_id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    task_svc::delete_task(&db, &task_id)
}

#[tauri::command]
pub fn get_task(state: tauri::State<AppState>, task_id: String) -> Result<Task, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    task_svc::get_task(&db, &task_id)
}

#[tauri::command]
pub fn list_tasks(
    state: tauri::State<AppState>,
    filter: TaskFilter,
) -> Result<TaskPage, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    task_svc::list_tasks(&db, filter)
}

#[tauri::command]
pub fn reorder_tasks(
    state: tauri::State<AppState>,
    task_ids: Vec<String>,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    task_svc::reorder_tasks(&db, task_ids)
}

#[tauri::command]
pub fn get_task_library(state: tauri::State<AppState>) -> Result<Vec<Task>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    task_svc::get_task_library(&db)
}

#[tauri::command]
pub fn schedule_task(
    state: tauri::State<AppState>,
    task_id: String,
    date: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    task_svc::schedule_task(&db, &task_id, &date)
}

#[tauri::command]
pub fn list_categories(
    state: tauri::State<AppState>,
    include_counts: Option<bool>,
) -> Result<Vec<task_svc::CategoryStat>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    task_svc::list_categories(&db, include_counts.unwrap_or(false))
}
