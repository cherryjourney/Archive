use rusqlite::params;

use crate::db::Database;
use crate::models::life_event::{LifeEvent, CreateLifeEventParams, UpdateLifeEventParams,
    LifeEventLink, CreateLifeEventLinkParams, LifeEventStats};

/// Create a new life event.
pub fn create_event(db: &Database, id: &str, params: &CreateLifeEventParams) -> Result<(), String> {
    db.conn()
        .execute(
            "INSERT INTO life_events (id, title, description, start_date, end_date, category, color, is_highlighted, start_precision, end_precision)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                id,
                params.title,
                params.description,
                params.start_date,
                params.end_date,
                params.category,
                params.color,
                params.is_highlighted as i32,
                params.start_precision,
                params.end_precision,
            ],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Update an existing life event. Only provided fields are updated.
pub fn update_event(db: &Database, id: &str, params: &UpdateLifeEventParams) -> Result<(), String> {
    let mut sets = vec!["updated_at = datetime('now','localtime')".to_string()];
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref v) = params.title { sets.push("title = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.description { sets.push("description = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.start_date { sets.push("start_date = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.end_date {
        if v.is_empty() {
            // Empty string → set to NULL (ongoing / 至今)
            sets.push("end_date = NULL".into());
        } else {
            sets.push("end_date = ?".into());
            values.push(Box::new(v.clone()));
        }
    }
    if let Some(ref v) = params.category { sets.push("category = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.color { sets.push("color = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.start_precision { sets.push("start_precision = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.end_precision { sets.push("end_precision = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(v) = params.is_highlighted { sets.push("is_highlighted = ?".into()); values.push(Box::new(v as i32)); }

    if sets.len() == 1 {
        return Ok(());
    }

    let sql = format!("UPDATE life_events SET {} WHERE id = ?", sets.join(", "));
    values.push(Box::new(id.to_string()));

    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
    db.conn().execute(&sql, params_refs.as_slice()).map_err(|e| e.to_string())?;
    Ok(())
}

/// Delete a life event by id. life_event_links are CASCADE deleted.
pub fn delete_event(db: &Database, id: &str) -> Result<(), String> {
    db.conn()
        .execute("DELETE FROM life_event_links WHERE life_event_id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    db.conn()
        .execute("DELETE FROM life_events WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Get all life events, ordered by start_date ascending (earliest first).
pub fn get_all_events(db: &Database) -> Result<Vec<LifeEvent>, String> {
    let mut stmt = db
        .conn()
        .prepare(
            "SELECT id, title, description, start_date, end_date, category, color, is_highlighted, created_at, updated_at, start_precision, end_precision
             FROM life_events ORDER BY start_date ASC",
        )
        .map_err(|e| e.to_string())?;

    let events = stmt
        .query_map([], |row| {
            Ok(LifeEvent {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                start_date: row.get(3)?,
                end_date: row.get(4)?,
                category: row.get(5)?,
                color: row.get(6)?,
                is_highlighted: row.get::<_, i32>(7)? != 0,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
                start_precision: row.get(10)?,
                end_precision: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(events)
}

/// Get a single event by id.
pub fn get_event(db: &Database, id: &str) -> Result<LifeEvent, String> {
    db.conn()
        .query_row(
            "SELECT id, title, description, start_date, end_date, category, color, is_highlighted, created_at, updated_at, start_precision, end_precision
             FROM life_events WHERE id = ?1",
            params![id],
            |row| {
                Ok(LifeEvent {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    description: row.get(2)?,
                    start_date: row.get(3)?,
                    end_date: row.get(4)?,
                    category: row.get(5)?,
                    color: row.get(6)?,
                    is_highlighted: row.get::<_, i32>(7)? != 0,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                    start_precision: row.get(10)?,
                    end_precision: row.get(11)?,
                })
            },
        )
        .map_err(|e| e.to_string())
}

/// ── LifeEventLink operations ──

pub fn create_link(db: &Database, id: &str, params: &CreateLifeEventLinkParams) -> Result<(), String> {
    let label = params.label.as_deref().unwrap_or("");
    db.conn()
        .execute(
            "INSERT INTO life_event_links (id, life_event_id, entity_type, entity_id, label) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, params.life_event_id, params.entity_type, params.entity_id, label],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_link(db: &Database, id: &str) -> Result<(), String> {
    db.conn()
        .execute("DELETE FROM life_event_links WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_links(db: &Database, life_event_id: &str) -> Result<Vec<LifeEventLink>, String> {
    let mut stmt = db
        .conn()
        .prepare(
            "SELECT id, life_event_id, entity_type, entity_id, label, created_at
             FROM life_event_links WHERE life_event_id = ?1 ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let links = stmt
        .query_map(params![life_event_id], |row| {
            Ok(LifeEventLink {
                id: row.get(0)?,
                life_event_id: row.get(1)?,
                entity_type: row.get(2)?,
                entity_id: row.get(3)?,
                label: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(links)
}

/// ── Auto-statistics ──

pub fn get_event_stats(db: &Database, start_date: &str, end_date: &str) -> Result<LifeEventStats, String> {
    let task_count: i64 = db.conn().query_row(
        "SELECT COUNT(*) FROM tasks WHERE scheduled_date BETWEEN ?1 AND ?2",
        params![start_date, end_date],
        |row| row.get(0),
    ).unwrap_or(0);

    let paper_count: i64 = db.conn().query_row(
        "SELECT COUNT(*) FROM papers WHERE created_at BETWEEN ?1 AND ?2",
        params![start_date, end_date],
        |row| row.get(0),
    ).unwrap_or(0);

    let experiment_count: i64 = db.conn().query_row(
        "SELECT COUNT(*) FROM experiments WHERE created_at BETWEEN ?1 AND ?2",
        params![start_date, end_date],
        |row| row.get(0),
    ).unwrap_or(0);

    Ok(LifeEventStats { task_count, paper_count, experiment_count })
}
