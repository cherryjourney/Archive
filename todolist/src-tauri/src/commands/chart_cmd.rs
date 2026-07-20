use crate::services::chart_svc;
use crate::AppState;

#[tauri::command]
pub fn get_dashboard_stats(state: tauri::State<AppState>) -> Result<chart_svc::DashboardStats, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    chart_svc::get_dashboard_stats(&db)
}

#[tauri::command]
pub fn get_weekly_trend(
    state: tauri::State<AppState>,
    start_date: String,
    end_date: String,
) -> Result<Vec<chart_svc::DailyStat>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    chart_svc::get_weekly_trend(&db, &start_date, &end_date)
}

#[tauri::command]
pub fn get_category_distribution(
    state: tauri::State<AppState>,
    start_date: String,
    end_date: String,
) -> Result<Vec<chart_svc::CategoryStat>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    chart_svc::get_category_distribution(&db, &start_date, &end_date)
}

#[tauri::command]
pub fn get_monthly_heatmap(
    state: tauri::State<AppState>,
    year: i32,
) -> Result<Vec<chart_svc::HeatmapCell>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    chart_svc::get_monthly_heatmap(&db, year)
}

#[tauri::command]
pub fn get_priority_distribution(
    state: tauri::State<AppState>,
    start_date: String,
    end_date: String,
) -> Result<Vec<chart_svc::PriorityStat>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    chart_svc::get_priority_distribution(&db, &start_date, &end_date)
}

#[tauri::command]
pub fn get_estimate_vs_actual(
    state: tauri::State<AppState>,
    start_date: String,
    end_date: String,
) -> Result<Vec<chart_svc::EstimateVsActual>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    chart_svc::get_estimate_vs_actual(&db, &start_date, &end_date)
}

#[tauri::command]
pub fn get_streak_info(state: tauri::State<AppState>) -> Result<chart_svc::StreakData, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    chart_svc::get_streak_info(&db)
}

#[tauri::command]
pub fn get_productivity_data(
    state: tauri::State<AppState>,
    start_date: String,
    end_date: String,
) -> Result<Vec<chart_svc::ProductivityPoint>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    chart_svc::get_productivity_data(&db, &start_date, &end_date)
}

