use rusqlite::params;

use crate::db::Database;
use crate::models::countdown::{CountdownEvent, CreateCountdownParams, UpdateCountdownParams};

/// Create a new countdown event.
pub fn create_event(db: &Database, id: &str, params: &CreateCountdownParams) -> Result<(), String> {
    db.conn()
        .execute(
            "INSERT INTO countdown_events (id, title, target_date, category, repeat_yearly, show_on_dashboard, color, notes)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                id,
                params.title,
                params.target_date,
                params.category,
                params.repeat_yearly as i32,
                params.show_on_dashboard as i32,
                params.color,
                params.notes,
            ],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Update an existing countdown event. Only provided fields are updated.
pub fn update_event(db: &Database, id: &str, params: &UpdateCountdownParams) -> Result<(), String> {
    let mut sets = vec!["updated_at = datetime('now','localtime')".to_string()];
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref v) = params.title { sets.push("title = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.target_date { sets.push("target_date = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.category { sets.push("category = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(v) = params.repeat_yearly { sets.push("repeat_yearly = ?".into()); values.push(Box::new(v as i32)); }
    if let Some(v) = params.show_on_dashboard { sets.push("show_on_dashboard = ?".into()); values.push(Box::new(v as i32)); }
    if let Some(ref v) = params.color { sets.push("color = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.notes { sets.push("notes = ?".into()); values.push(Box::new(v.clone())); }

    if sets.len() == 1 {
        return Ok(());
    }

    let sql = format!("UPDATE countdown_events SET {} WHERE id = ?", sets.join(", "));
    values.push(Box::new(id.to_string()));

    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
    db.conn().execute(&sql, params_refs.as_slice()).map_err(|e| e.to_string())?;
    Ok(())
}

/// Delete a countdown event by id.
pub fn delete_event(db: &Database, id: &str) -> Result<(), String> {
    db.conn()
        .execute("DELETE FROM countdown_events WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Get all countdown events, ordered by target_date ascending.
pub fn get_all_events(db: &Database) -> Result<Vec<CountdownEvent>, String> {
    let mut stmt = db
        .conn()
        .prepare(
            "SELECT id, title, target_date, category, repeat_yearly, show_on_dashboard, color, notes, created_at, updated_at
             FROM countdown_events ORDER BY target_date ASC",
        )
        .map_err(|e| e.to_string())?;

    let events = stmt
        .query_map([], |row| {
            Ok(CountdownEvent {
                id: row.get(0)?,
                title: row.get(1)?,
                target_date: row.get(2)?,
                category: row.get(3)?,
                repeat_yearly: row.get::<_, i32>(4)? != 0,
                show_on_dashboard: row.get::<_, i32>(5)? != 0,
                color: row.get(6)?,
                notes: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(events)
}

/// Get only events marked for dashboard display.
pub fn get_dashboard_events(db: &Database) -> Result<Vec<CountdownEvent>, String> {
    let mut stmt = db
        .conn()
        .prepare(
            "SELECT id, title, target_date, category, repeat_yearly, show_on_dashboard, color, notes, created_at, updated_at
             FROM countdown_events WHERE show_on_dashboard = 1 ORDER BY target_date ASC",
        )
        .map_err(|e| e.to_string())?;

    let events = stmt
        .query_map([], |row| {
            Ok(CountdownEvent {
                id: row.get(0)?,
                title: row.get(1)?,
                target_date: row.get(2)?,
                category: row.get(3)?,
                repeat_yearly: row.get::<_, i32>(4)? != 0,
                show_on_dashboard: row.get::<_, i32>(5)? != 0,
                color: row.get(6)?,
                notes: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(events)
}
