use rusqlite::params;
use serde::{Deserialize, Serialize};

use crate::db::Database;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NotificationConfig {
    pub daily_reminder_enabled: bool,
    pub daily_reminder_time: String,
    pub deadline_reminder_enabled: bool,
    pub deadline_30min_enabled: bool,
    pub deadline_1hour_enabled: bool,
    pub deadline_1day_enabled: bool,
    pub task_reminder_enabled: bool,
    pub task_reminder_advance_minutes: i32,
}

impl Default for NotificationConfig {
    fn default() -> Self {
        NotificationConfig {
            daily_reminder_enabled: true,
            daily_reminder_time: "08:00".to_string(),
            deadline_reminder_enabled: true,
            deadline_30min_enabled: true,
            deadline_1hour_enabled: true,
            deadline_1day_enabled: true,
            task_reminder_enabled: true,
            task_reminder_advance_minutes: 5,
        }
    }
}

pub fn get_notification_config(db: &Database) -> Result<NotificationConfig, String> {
    let result = db.conn().query_row(
        "SELECT daily_reminder_enabled, daily_reminder_time,
         deadline_reminder_enabled, deadline_30min_enabled, deadline_1hour_enabled,
         deadline_1day_enabled, task_reminder_enabled, task_reminder_advance_minutes
         FROM notification_config WHERE id=1",
        [],
        |row| {
            Ok(NotificationConfig {
                daily_reminder_enabled: row.get::<_, i32>(0)? != 0,
                daily_reminder_time: row.get(1)?,
                deadline_reminder_enabled: row.get::<_, i32>(2)? != 0,
                deadline_30min_enabled: row.get::<_, i32>(3)? != 0,
                deadline_1hour_enabled: row.get::<_, i32>(4)? != 0,
                deadline_1day_enabled: row.get::<_, i32>(5)? != 0,
                task_reminder_enabled: row.get::<_, i32>(6)? != 0,
                task_reminder_advance_minutes: row.get(7)?,
            })
        },
    );

    match result {
        Ok(cfg) => Ok(cfg),
        Err(_) => {
            // 表可能刚创建，插入默认行
            db.conn()
                .execute(
                    "INSERT OR IGNORE INTO notification_config (id) VALUES (1)",
                    [],
                )
                .map_err(|e| e.to_string())?;
            Ok(NotificationConfig::default())
        }
    }
}

pub fn update_notification_config(
    db: &Database,
    config: &NotificationConfig,
) -> Result<(), String> {
    db.conn()
        .execute(
            "UPDATE notification_config SET
             daily_reminder_enabled=?1, daily_reminder_time=?2,
             deadline_reminder_enabled=?3, deadline_30min_enabled=?4,
             deadline_1hour_enabled=?5, deadline_1day_enabled=?6,
             task_reminder_enabled=?7, task_reminder_advance_minutes=?8,
             updated_at=datetime('now','localtime')
             WHERE id=1",
            params![
                config.daily_reminder_enabled as i32,
                config.daily_reminder_time,
                config.deadline_reminder_enabled as i32,
                config.deadline_30min_enabled as i32,
                config.deadline_1hour_enabled as i32,
                config.deadline_1day_enabled as i32,
                config.task_reminder_enabled as i32,
                config.task_reminder_advance_minutes,
            ],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// 检查某个通知是否今天已发送过
pub fn was_notification_sent(
    db: &Database,
    ntype: &str,
    reference_id: &str,
    date: &str,
) -> Result<bool, String> {
    let count: i32 = db
        .conn()
        .query_row(
            "SELECT COUNT(*) FROM notification_log
             WHERE notification_type=?1 AND reference_id=?2 AND date=?3",
            params![ntype, reference_id, date],
            |row| row.get(0),
        )
        .unwrap_or(0);
    Ok(count > 0)
}

/// 记录通知已发送
pub fn log_notification(
    db: &Database,
    ntype: &str,
    reference_id: &str,
    date: &str,
) -> Result<(), String> {
    let now = crate::utils::date::now_str();
    db.conn()
        .execute(
            "INSERT INTO notification_log (notification_type, reference_id, sent_at, date)
             VALUES (?1, ?2, ?3, ?4)",
            params![ntype, reference_id, now, date],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// 后台调度器：每 30 秒检查一次是否需要发送提醒
pub fn run_scheduler(app: tauri::AppHandle) {
    use tauri::Manager;
    use tauri_plugin_notification::NotificationExt;

    loop {
        std::thread::sleep(std::time::Duration::from_secs(30));

        let state = app.state::<std::sync::Mutex<Database>>();
        let db = match state.lock() {
            Ok(db) => db,
            Err(_) => continue,
        };

        let config = match get_notification_config(&db) {
            Ok(c) => c,
            Err(_) => continue,
        };

        let today = crate::utils::date::today_str();
        let now = crate::utils::date::now_str();

        // 1) 每日提醒
        if config.daily_reminder_enabled {
            let key = format!("daily-reminder-{}", today);
            if !was_notification_sent(&db, "daily_reminder", &key, &today).unwrap_or(false) {
                let now_time = &now[11..16]; // "HH:MM"
                if now_time >= config.daily_reminder_time.as_str() {
                    // 发送原生通知
                    let _ = app
                        .notification()
                        .builder()
                        .title("Archive · 存迹 每日计划")
                        .body(&format!("{} 早上好！打开查看今天的计划吧 ✨", today))
                        .show();

                    let _ = log_notification(&db, "daily_reminder", &key, &today);
                }
            }
        }

        // 2) 任务弹窗提醒（今日计划中 start_time 临近的任务）
        if config.task_reminder_enabled {
            check_task_reminders(&db, &app, &config, &today, &now);
        }

        // 3) 截止日提醒
        if config.deadline_reminder_enabled {
            check_deadline_reminders(&db, &app, &config, &today, &now);
        }

        // 4) 质保到期提醒（每24h检查一次）
        check_warranty_expiry(&db, &app, &today);
    }
}

/// 检查今日计划中即将开始的任务
fn check_task_reminders(
    db: &Database,
    app: &tauri::AppHandle,
    config: &NotificationConfig,
    today: &str,
    now: &str,
) {
    use rusqlite::params;
    use tauri::Emitter;
    use tauri_plugin_notification::NotificationExt;

    let advance = config.task_reminder_advance_minutes;

    // 查询今日计划中有 start_time 的任务，且提醒时间已到但任务时间未过
    let mut stmt = match db.conn().prepare(
        "SELECT t.id, t.title, dpt.start_time, dpt.end_time
         FROM daily_plan_tasks dpt
         JOIN daily_plans dp ON dpt.daily_plan_id = dp.id
         JOIN tasks t ON dpt.task_id = t.id
         WHERE dp.date=?1 AND dpt.start_time IS NOT NULL AND dpt.start_time != ''
         AND t.status != 'completed'
         ORDER BY dpt.start_time",
    ) {
        Ok(s) => s,
        Err(_) => return,
    };

    let tasks: Vec<(String, String, String, Option<String>)> = stmt
        .query_map(params![today], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, Option<String>>(3)?,
            ))
        })
        .ok()
        .map(|rows| rows.filter_map(|r| r.ok()).collect())
        .unwrap_or_default();

    for (task_id, title, start_time, end_time) in &tasks {
        let remind_key = format!("task-reminder-{}-{}", task_id, today);
        if was_notification_sent(db, "task_reminder", &remind_key, today).unwrap_or(false) {
            continue;
        }

        // 检查提醒时间 = start_time - advance_minutes
        if let Some(start_dt) = parse_datetime(start_time) {
            let remind_at = start_dt - chrono::Duration::minutes(advance as i64);
            if let Some(now_dt) = parse_datetime(now) {
                if now_dt >= remind_at && now_dt < start_dt {
                    let end_str = end_time
                        .as_deref()
                        .map(|e| format!("-{}", &e[11..16]))
                        .unwrap_or_default();
                    let body = format!(
                        "⏰ {} {}{}",
                        title,
                        &start_time[11..16],
                        end_str
                    );

                    // 发送事件到前端（弹窗提醒）
                    let _ = app.emit("task-reminder", serde_json::json!({
                        "task_id": task_id,
                        "title": title,
                        "start_time": start_time,
                        "end_time": end_time,
                    }));

                    // 同时发送原生通知（窗口隐藏时也能看到）
                    let _ = app
                        .notification()
                        .builder()
                        .title("⏰ 任务提醒")
                        .body(&body)
                        .show();

                    let _ = log_notification(db, "task_reminder", &remind_key, today);
                }
            }
        }
    }
}

/// 检查截止日临近的任务和作业
fn check_deadline_reminders(
    db: &Database,
    app: &tauri::AppHandle,
    config: &NotificationConfig,
    today: &str,
    _now: &str,
) {
    // 检查任务截止日
    if let Ok(mut stmt) = db.conn().prepare(
        "SELECT id, title, due_date FROM tasks
         WHERE status != 'completed' AND due_date IS NOT NULL AND due_date != ''",
    ) {
        let tasks: Vec<(String, String, String)> = stmt
            .query_map([], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                ))
            })
            .ok()
            .map(|rows| rows.filter_map(|r| r.ok()).collect())
            .unwrap_or_default();

        for (task_id, title, due_date) in &tasks {
            send_deadline_notification(db, app, config, task_id, title, due_date, today, "task");
        }
    }

    // 检查作业截止日
    if let Ok(mut stmt) = db.conn().prepare(
        "SELECT a.id, a.title, a.due_date, c.name FROM assignments a
         JOIN courses c ON a.course_id = c.id
         WHERE a.done = 0 AND a.due_date IS NOT NULL AND a.due_date != ''",
    ) {
        let assignments: Vec<(String, String, String, String)> = stmt
            .query_map([], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                ))
            })
            .ok()
            .map(|rows| rows.filter_map(|r| r.ok()).collect())
            .unwrap_or_default();

        for (id, title, due_date, course_name) in &assignments {
            let display = format!("[{}] {}", course_name, title);
            send_deadline_notification(db, app, config, id, &display, due_date, today, "assignment");
        }
    }
}

fn send_deadline_notification(
    db: &Database,
    app: &tauri::AppHandle,
    config: &NotificationConfig,
    ref_id: &str,
    title: &str,
    due_date: &str,
    today: &str,
    ntype: &str,
) {
    use tauri_plugin_notification::NotificationExt;

    if let Some(due) = parse_date_only(due_date) {
        if let Some(today_d) = parse_date_only(today) {
            let days_left = (due - today_d).num_days();
            if days_left < 0 {
                return; // 已过期
            }

            let (enabled, label, remind_key) = match days_left {
                0 => (
                    config.deadline_30min_enabled,
                    "今天截止",
                    format!("deadline-{}-{}-0d", ntype, ref_id),
                ),
                1 => (
                    config.deadline_1day_enabled,
                    "明天截止",
                    format!("deadline-{}-{}-1d", ntype, ref_id),
                ),
                _ => return, // 不在提醒范围内
            };

            if !enabled {
                return;
            }

            if was_notification_sent(db, "deadline", &remind_key, today).unwrap_or(false) {
                return;
            }

            let _ = app
                .notification()
                .builder()
                .title(&format!("📅 {}", label))
                .body(&format!("{} — 截止日期 {}", title, due_date))
                .show();

            let _ = log_notification(db, "deadline", &remind_key, today);
        }
    }
}

/// Check for warranties expiring within 30 days
fn check_warranty_expiry(
    db: &Database,
    app: &tauri::AppHandle,
    today: &str,
) {
    use tauri_plugin_notification::NotificationExt;

    // Only check once per day
    let key = format!("warranty-check-{}", today);
    if was_notification_sent(db, "warranty", &key, today).unwrap_or(false) {
        return;
    }

    // Find assets with warranty expiring in 30 days
    let assets = crate::services::asset_svc::get_expiring_warranties(db, 30).unwrap_or_default();

    if assets.is_empty() {
        return;
    }

    let count = assets.len();
    let names: Vec<String> = assets.iter().take(5).map(|a| a.name.clone()).collect();
    let body = if count <= 5 {
        format!("以下物品质保即将到期：{}", names.join("、"))
    } else {
        format!("{} 件物品质保即将到期，包括：{} 等", count, names.join("、"))
    };

    let _ = app
        .notification()
        .builder()
        .title(&format!("🛡️ 质保到期提醒"))
        .body(&body)
        .show();

    let _ = log_notification(db, "warranty", &key, today);
}

fn parse_datetime(s: &str) -> Option<chrono::NaiveDateTime> {
    chrono::NaiveDateTime::parse_from_str(s, "%Y-%m-%dT%H:%M:%S").ok()
}

fn parse_date_only(s: &str) -> Option<chrono::NaiveDate> {
    chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d").ok()
}
