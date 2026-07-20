use rusqlite::params;

use crate::db::Database;
use crate::models::memory::{CreateMemoryParams, Memory, UpdateMemoryParams};
use crate::utils::id;

/// Create a new memory note.
pub fn create(db: &Database, params: &CreateMemoryParams) -> Result<Memory, String> {
    let id = id::generate_id();
    let now = crate::utils::date::now_str();

    db.conn()
        .execute(
            "INSERT INTO memories (id, date, content, context, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, params.date, params.content, params.context, now, now],
        )
        .map_err(|e| e.to_string())?;

    get_by_id(db, &id)
}

/// Get a single memory by id.
pub fn get_by_id(db: &Database, id: &str) -> Result<Memory, String> {
    db.conn()
        .query_row(
            "SELECT id, date, content, context, created_at, updated_at
             FROM memories WHERE id = ?1",
            params![id],
            |row| {
                Ok(Memory {
                    id: row.get(0)?,
                    date: row.get(1)?,
                    content: row.get(2)?,
                    context: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            },
        )
        .map_err(|e| e.to_string())
}

/// Update a memory note.
pub fn update(db: &Database, id: &str, params: &UpdateMemoryParams) -> Result<Memory, String> {
    let now = crate::utils::date::now_str();

    if let Some(ref content) = params.content {
        db.conn()
            .execute(
                "UPDATE memories SET content = ?1, updated_at = ?2 WHERE id = ?3",
                params![content, now, id],
            )
            .map_err(|e| e.to_string())?;
    }

    if let Some(ref context) = params.context {
        db.conn()
            .execute(
                "UPDATE memories SET context = ?1, updated_at = ?2 WHERE id = ?3",
                params![context, now, id],
            )
            .map_err(|e| e.to_string())?;
    }

    get_by_id(db, id)
}

/// Delete a memory by id.
pub fn delete(db: &Database, id: &str) -> Result<(), String> {
    db.conn()
        .execute("DELETE FROM memories WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// List memories for a date, ordered by creation time.
pub fn list_by_date(db: &Database, date: &str) -> Result<Vec<Memory>, String> {
    let mut stmt = db
        .conn()
        .prepare(
            "SELECT id, date, content, context, created_at, updated_at
             FROM memories WHERE date = ?1 ORDER BY created_at ASC",
        )
        .map_err(|e| e.to_string())?;

    let items = stmt
        .query_map(params![date], |row| {
            Ok(Memory {
                id: row.get(0)?,
                date: row.get(1)?,
                content: row.get(2)?,
                context: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(items)
}

/// List all memories, ordered by date descending.
pub fn list_all(db: &Database, limit: i32, offset: i32) -> Result<Vec<Memory>, String> {
    let mut stmt = db
        .conn()
        .prepare(
            "SELECT id, date, content, context, created_at, updated_at
             FROM memories ORDER BY date DESC, created_at DESC LIMIT ?1 OFFSET ?2",
        )
        .map_err(|e| e.to_string())?;

    let items = stmt
        .query_map(params![limit, offset], |row| {
            Ok(Memory {
                id: row.get(0)?,
                date: row.get(1)?,
                content: row.get(2)?,
                context: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(items)
}
