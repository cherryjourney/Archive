use rusqlite::params;

use crate::db::Database;
use crate::models::review::{DailyReviewData, ReviewConfig, UpdateReviewConfigParams};

pub fn get_config(db: &Database) -> Result<ReviewConfig, String> {
    let result = db.conn().query_row(
        "SELECT enabled, review_time, position FROM review_config WHERE id = 1",
        [],
        |row| {
            Ok(ReviewConfig {
                enabled: row.get::<_, i32>(0)? != 0,
                review_time: row.get(1)?,
                position: row.get(2)?,
            })
        },
    );
    match result {
        Ok(c) => Ok(c),
        Err(_) => {
            db.conn().execute(
                "INSERT OR IGNORE INTO review_config (id, enabled, review_time, position) VALUES (1, 1, '21:00', 'bottom-right')",
                [],
            ).map_err(|e| e.to_string())?;
            Ok(ReviewConfig { enabled: true, review_time: "21:00".into(), position: "bottom-right".into() })
        }
    }
}

pub fn update_config(db: &Database, params: &UpdateReviewConfigParams) -> Result<(), String> {
    let mut sets: Vec<String> = Vec::new();
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(v) = params.enabled { sets.push("enabled = ?".into()); values.push(Box::new(v as i32)); }
    if let Some(ref v) = params.review_time { sets.push("review_time = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.position { sets.push("position = ?".into()); values.push(Box::new(v.clone())); }

    if sets.is_empty() { return Ok(()); }
    let sql = format!("UPDATE review_config SET {} WHERE id = 1", sets.join(", "));
    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
    db.conn().execute(&sql, params_refs.as_slice()).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_daily_review(db: &Database, date: &str) -> Result<DailyReviewData, String> {
    let tasks_completed: i32 = db.conn().query_row(
        "SELECT COUNT(*) FROM tasks WHERE status = 'completed' AND date(updated_at) = ?1", params![date], |r| r.get(0)
    ).unwrap_or(0);
    let tasks_total: i32 = db.conn().query_row(
        "SELECT COUNT(*) FROM daily_plan_tasks dpt JOIN daily_plans dp ON dpt.daily_plan_id = dp.id WHERE dp.date = ?1", params![date], |r| r.get(0)
    ).unwrap_or(0);
    let pomodoro_minutes: i32 = 0; // Pomodoro feature removed
    let experiments_updated: i32 = db.conn().query_row(
        "SELECT COUNT(*) FROM experiments WHERE date(updated_at) = ?1", params![date], |r| r.get(0)
    ).unwrap_or(0);
    let papers_read: i32 = db.conn().query_row(
        "SELECT COUNT(*) FROM papers WHERE date(updated_at) = ?1 AND status = 'read'", params![date], |r| r.get(0)
    ).unwrap_or(0);
    let finance_spent: f64 = db.conn().query_row(
        "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE date = ?1 AND type = 'expense'", params![date], |r| r.get(0)
    ).unwrap_or(0.0);

    // Random quote
    let quote: String = db.conn().query_row(
        "SELECT quote FROM encouragement_quotes ORDER BY RANDOM() LIMIT 1", [], |r| r.get(0)
    ).unwrap_or_else(|_| "今天也是充实的一天 ✨".into());

    // Tomorrow hint
    let hint = if tasks_completed == 0 { "明天试试先完成最重要的3件事".into() }
               else { "保持节奏，明天的你会感谢今天努力的自己".into() };

    Ok(DailyReviewData {
        date: date.to_string(),
        tasks_completed, tasks_total,
        pomodoro_minutes, experiments_updated,
        papers_read_today: papers_read,
        finance_spent,
        quote, tomorrow_hint: hint,
    })
}
