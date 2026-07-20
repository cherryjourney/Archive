use rusqlite::params;
use chrono::Local;

use crate::db::Database;
use crate::models::advisor::*;
use crate::utils::id;

pub fn create_meeting(db: &Database, id_str: &str, params: &CreateMeetingParams) -> Result<(), String> {
    db.conn().execute(
        "INSERT INTO advisor_meetings (id, date, summary, feedback, action_items, next_goals, related_task_ids, related_experiment_ids, created_at, updated_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,datetime('now','localtime'),datetime('now','localtime'))",
        params![id_str, params.date, params.summary, params.feedback, params.action_items, params.next_goals, params.related_task_ids, params.related_experiment_ids],
    ).map_err(|e| e.to_string())?;
    // Update last_meeting_date in config
    db.conn().execute(
        "INSERT INTO advisor_config (id, meeting_pattern, meeting_day_of_week, last_meeting_date) VALUES (1, 'weekly', 1, ?1)
         ON CONFLICT(id) DO UPDATE SET last_meeting_date = ?1",
        params![params.date],
    ).ok();
    Ok(())
}

pub fn update_meeting(db: &Database, id_str: &str, params: &UpdateMeetingParams) -> Result<(), String> {
    let mut sets: Vec<String> = vec!["updated_at = datetime('now','localtime')".into()];
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
    if let Some(ref v) = params.date { sets.push("date = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.summary { sets.push("summary = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.feedback { sets.push("feedback = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.action_items { sets.push("action_items = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.next_goals { sets.push("next_goals = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.related_task_ids { sets.push("related_task_ids = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.related_experiment_ids { sets.push("related_experiment_ids = ?".into()); values.push(Box::new(v.clone())); }
    if sets.len() == 1 { return Ok(()); }
    let sql = format!("UPDATE advisor_meetings SET {} WHERE id = ?", sets.join(", "));
    values.push(Box::new(id_str.to_string()));
    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
    db.conn().execute(&sql, params_refs.as_slice()).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_meeting(db: &Database, id_str: &str) -> Result<(), String> {
    db.conn().execute("DELETE FROM advisor_meetings WHERE id = ?1", params![id_str]).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_meeting(db: &Database, id_str: &str) -> Result<AdvisorMeeting, String> {
    db.conn().query_row("SELECT id,date,summary,feedback,action_items,next_goals,related_task_ids,related_experiment_ids,created_at,updated_at FROM advisor_meetings WHERE id=?1", params![id_str], |r| Ok(AdvisorMeeting {
        id: r.get(0)?, date: r.get(1)?, summary: r.get(2)?, feedback: r.get(3)?,
        action_items: r.get(4)?, next_goals: r.get(5)?, related_task_ids: r.get(6)?,
        related_experiment_ids: r.get(7)?, created_at: r.get(8)?, updated_at: r.get(9)?,
    })).map_err(|e| e.to_string())
}

pub fn list_meetings(db: &Database) -> Result<Vec<AdvisorMeeting>, String> {
    let mut stmt = db.conn().prepare("SELECT id,date,summary,feedback,action_items,next_goals,related_task_ids,related_experiment_ids,created_at,updated_at FROM advisor_meetings ORDER BY date DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |r| Ok(AdvisorMeeting {
        id: r.get(0)?, date: r.get(1)?, summary: r.get(2)?, feedback: r.get(3)?,
        action_items: r.get(4)?, next_goals: r.get(5)?, related_task_ids: r.get(6)?,
        related_experiment_ids: r.get(7)?, created_at: r.get(8)?, updated_at: r.get(9)?,
    })).map_err(|e| e.to_string())?;
    Ok(rows.filter_map(|r| r.ok()).collect())
}

pub fn get_config(db: &Database) -> Result<AdvisorConfig, String> {
    let r = db.conn().query_row("SELECT meeting_pattern, meeting_day_of_week, last_meeting_date FROM advisor_config WHERE id=1", [], |row| Ok(AdvisorConfig {
        meeting_pattern: row.get(0)?, meeting_day_of_week: row.get(1)?, last_meeting_date: row.get(2)?,
    }));
    match r {
        Ok(c) => Ok(c),
        Err(_) => { db.conn().execute("INSERT OR IGNORE INTO advisor_config (id,meeting_pattern,meeting_day_of_week) VALUES (1,'weekly',1)", []).ok(); Ok(AdvisorConfig { meeting_pattern: "weekly".into(), meeting_day_of_week: 1, last_meeting_date: None }) }
    }
}

pub fn update_config(db: &Database, params: &UpdateAdvisorConfigParams) -> Result<(), String> {
    let mut sets: Vec<String> = Vec::new(); let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
    if let Some(ref v) = params.meeting_pattern { sets.push("meeting_pattern = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(v) = params.meeting_day_of_week { sets.push("meeting_day_of_week = ?".into()); values.push(Box::new(v)); }
    if let Some(ref v) = params.last_meeting_date { sets.push("last_meeting_date = ?".into()); values.push(Box::new(v.clone())); }
    if sets.is_empty() { return Ok(()); }
    let sql = format!("UPDATE advisor_config SET {} WHERE id=1", sets.join(", "));
    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
    db.conn().execute(&sql, params_refs.as_slice()).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_next_meeting(db: &Database) -> Result<NextMeetingInfo, String> {
    let config = get_config(db)?;
    let today = Local::now().date_naive();
    let today_str = today.format("%Y-%m-%d").to_string();

    let last_date = config.last_meeting_date.as_deref().unwrap_or(&today_str);
    let last = crate::utils::date::parse_date(last_date).unwrap_or(today);

    let interval_days = match config.meeting_pattern.as_str() {
        "weekly" => 7, "biweekly" => 14, "monthly" => 30, _ => 7,
    };
    let label = match config.meeting_pattern.as_str() {
        "weekly" => "每周", "biweekly" => "每两周", "monthly" => "每月", _ => "定期",
    };

    let next = last + chrono::Duration::days(interval_days);
    let days_until = (next - today).num_days();

    Ok(NextMeetingInfo {
        days_until: days_until as i32,
        expected_date: next.format("%Y-%m-%d").to_string(),
        pattern_label: label.to_string(),
    })
}

/// Batch create tasks from action items JSON array
pub fn batch_create_tasks(db: &Database, meeting_id: &str, action_items_json: &str) -> Result<Vec<String>, String> {
    let items: Vec<String> = serde_json::from_str(action_items_json).unwrap_or_default();
    let mut task_ids = Vec::new();
    for item in &items {
        let task_id = id::generate_id();
        let today = crate::utils::date::today_str();
        db.conn().execute(
            "INSERT INTO tasks (id, title, status, priority, scheduled_date, created_at, updated_at)
             VALUES (?1, ?2, 'pending', 2, ?3, datetime('now','localtime'), datetime('now','localtime'))",
            params![task_id, item, today],
        ).map_err(|e| e.to_string())?;
        task_ids.push(task_id);
    }
    // Update meeting's related_task_ids
    if !task_ids.is_empty() {
        let all_ids: Vec<String> = {
            let meeting = get_meeting(db, meeting_id)?;
            let mut existing: Vec<String> = serde_json::from_str(&meeting.related_task_ids).unwrap_or_default();
            existing.extend(task_ids.clone());
            existing
        };
        let json = serde_json::to_string(&all_ids).unwrap_or_default();
        db.conn().execute("UPDATE advisor_meetings SET related_task_ids = ?1 WHERE id = ?2", params![json, meeting_id]).ok();
    }
    Ok(task_ids)
}
