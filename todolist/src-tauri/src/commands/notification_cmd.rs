use crate::services::notification_svc;
use crate::AppState;

#[tauri::command]
pub fn get_notification_config(
    state: tauri::State<AppState>,
) -> Result<notification_svc::NotificationConfig, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    notification_svc::get_notification_config(&db)
}

#[tauri::command]
pub fn update_notification_config(
    state: tauri::State<AppState>,
    config: notification_svc::NotificationConfig,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    notification_svc::update_notification_config(&db, &config)
}

/// 立即发送一条测试通知（用于验证通知权限/功能）
#[tauri::command]
pub fn send_test_notification(app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_notification::NotificationExt;
    app.notification()
        .builder()
        .title("Archive · 存迹 通知测试")
        .body("如果你看到这条消息，说明通知功能正常！✅")
        .show()
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// 发送时间线任务提醒通知
#[tauri::command]
pub fn send_timeline_reminder_notification(
    app: tauri::AppHandle,
    title: String,
    body: String,
) -> Result<(), String> {
    use tauri_plugin_notification::NotificationExt;
    app.notification()
        .builder()
        .title(&title)
        .body(&body)
        .show()
        .map_err(|e| e.to_string())?;
    Ok(())
}
