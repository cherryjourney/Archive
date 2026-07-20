use crate::models::grad::*;
use crate::services::grad_svc;
use crate::AppState;

#[tauri::command] pub fn create_milestone(state: tauri::State<AppState>, id: String, params: CreateMilestoneParams) -> Result<(), String> { let db = state.db.lock().map_err(|e| e.to_string())?; grad_svc::create_milestone(&db, &id, &params) }
#[tauri::command] pub fn update_milestone(state: tauri::State<AppState>, id: String, params: UpdateMilestoneParams) -> Result<(), String> { let db = state.db.lock().map_err(|e| e.to_string())?; grad_svc::update_milestone(&db, &id, &params) }
#[tauri::command] pub fn delete_milestone(state: tauri::State<AppState>, id: String) -> Result<(), String> { let db = state.db.lock().map_err(|e| e.to_string())?; grad_svc::delete_milestone(&db, &id) }
#[tauri::command] pub fn list_milestones(state: tauri::State<AppState>) -> Result<Vec<GradMilestone>, String> { let db = state.db.lock().map_err(|e| e.to_string())?; grad_svc::list_milestones(&db) }
#[tauri::command] pub fn generate_semester_review(state: tauri::State<AppState>, id: String, semester: String, period_start: String, period_end: String) -> Result<SemesterReview, String> { let db = state.db.lock().map_err(|e| e.to_string())?; grad_svc::generate_semester_review(&db, &id, &semester, &period_start, &period_end) }
#[tauri::command] pub fn list_semester_reviews(state: tauri::State<AppState>) -> Result<Vec<SemesterReview>, String> { let db = state.db.lock().map_err(|e| e.to_string())?; grad_svc::list_reviews(&db) }
