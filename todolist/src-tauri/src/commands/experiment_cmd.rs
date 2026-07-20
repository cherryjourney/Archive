use crate::models::experiment::*;
use crate::services::experiment_svc;
use crate::AppState;

#[tauri::command]
pub fn create_experiment(state: tauri::State<AppState>, params: CreateExperimentParams) -> Result<Experiment, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    experiment_svc::create_experiment(&db, params)
}
#[tauri::command]
pub fn update_experiment(state: tauri::State<AppState>, exp_id: String, params: UpdateExperimentParams) -> Result<Experiment, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    experiment_svc::update_experiment(&db, &exp_id, params)
}
#[tauri::command]
pub fn delete_experiment(state: tauri::State<AppState>, exp_id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    experiment_svc::delete_experiment(&db, &exp_id)
}
#[tauri::command]
pub fn get_experiment(state: tauri::State<AppState>, exp_id: String) -> Result<Experiment, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    experiment_svc::get_experiment(&db, &exp_id)
}
#[tauri::command]
pub fn list_experiments(state: tauri::State<AppState>) -> Result<Vec<Experiment>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    experiment_svc::list_experiments(&db)
}
