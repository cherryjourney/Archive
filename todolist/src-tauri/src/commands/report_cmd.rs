use crate::AppState;
use crate::services::report_svc;

#[tauri::command]
pub fn generate_weekly_report(
    state: tauri::State<AppState>,
    start_date: String,
    end_date: String,
) -> Result<report_svc::WeeklyReport, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    report_svc::generate_weekly_report(&db, &start_date, &end_date)
}

#[tauri::command]
pub fn export_weekly_report_markdown(
    state: tauri::State<AppState>,
    start_date: String,
    end_date: String,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let report = report_svc::generate_weekly_report(&db, &start_date, &end_date)?;
    Ok(report_svc::generate_markdown_report(&report))
}
