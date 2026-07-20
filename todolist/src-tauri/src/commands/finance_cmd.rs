use crate::models::finance::*;
use crate::AppState;
use crate::services::finance_svc;

// ─── 分类 ───

#[tauri::command]
pub fn list_transaction_categories(state: tauri::State<AppState>) -> Result<Vec<TransactionCategory>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    finance_svc::list_categories(&db)
}

// ─── 账户 ───

#[tauri::command]
pub fn create_account(state: tauri::State<AppState>, id: String, params: CreateAccountParams) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    finance_svc::create_account(&db, &id, &params)
}

#[tauri::command]
pub fn update_account(state: tauri::State<AppState>, id: String, params: UpdateAccountParams) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    finance_svc::update_account(&db, &id, &params)
}

#[tauri::command]
pub fn delete_account(state: tauri::State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    finance_svc::delete_account(&db, &id)
}

#[tauri::command]
pub fn list_accounts(state: tauri::State<AppState>) -> Result<Vec<Account>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    finance_svc::list_accounts(&db)
}

// ─── 交易 ───

#[tauri::command]
pub fn create_transaction(state: tauri::State<AppState>, id: String, params: CreateTransactionParams) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    finance_svc::create_transaction(&db, &id, &params)
}

#[tauri::command]
pub fn update_transaction(state: tauri::State<AppState>, id: String, params: UpdateTransactionParams) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    finance_svc::update_transaction(&db, &id, &params)
}

#[tauri::command]
pub fn delete_transaction(state: tauri::State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    finance_svc::delete_transaction(&db, &id)
}

#[tauri::command]
pub fn list_transactions(state: tauri::State<AppState>, filter: TransactionFilter) -> Result<Vec<Transaction>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    finance_svc::list_transactions(&db, &filter)
}

#[tauri::command]
pub fn get_transaction(state: tauri::State<AppState>, id: String) -> Result<Transaction, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    finance_svc::get_transaction_by_id(&db, &id)
}

// ─── 统计 ───

#[tauri::command]
pub fn get_finance_stats(state: tauri::State<AppState>, year: i32, month: i32) -> Result<FinanceStats, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    finance_svc::get_finance_stats(&db, year, month)
}

#[tauri::command]
pub fn get_monthly_chart(state: tauri::State<AppState>, year: i32) -> Result<Vec<MonthlyChartData>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    finance_svc::get_monthly_chart(&db, year)
}

#[tauri::command]
pub fn get_category_stats(state: tauri::State<AppState>, year: i32, month: i32) -> Result<Vec<CategoryStat>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    finance_svc::get_category_stats(&db, year, month)
}

#[tauri::command]
pub fn get_daily_heatmap(state: tauri::State<AppState>, year: i32, month: i32) -> Result<Vec<DailyHeatmapCell>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    finance_svc::get_daily_heatmap(&db, year, month)
}

#[tauri::command]
pub fn get_net_worth_trend(state: tauri::State<AppState>) -> Result<Vec<NetWorthPoint>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    finance_svc::get_net_worth_trend(&db)
}
