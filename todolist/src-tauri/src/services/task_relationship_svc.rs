use rusqlite::params;
use crate::db::Database;
use crate::models::task_relationship::*;
use crate::utils::date;
use crate::utils::id;

pub fn create_task_relationship(
    db: &Database,
    params: CreateTaskRelationshipParams,
) -> Result<TaskRelationship, String> {
    let id = id::generate_id();
    let now = date::now_str();
    db.conn()
        .execute(
            "INSERT INTO task_relationships (id, source_task_id, target_task_id, relationship_type, is_blocking, label, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                id,
                params.source_task_id,
                params.target_task_id,
                params.relationship_type,
                params.is_blocking as i32,
                params.label,
                now,
            ],
        )
        .map_err(|e| e.to_string())?;
    get_task_relationship(db, &id)
}

pub fn delete_task_relationship(db: &Database, id: &str) -> Result<(), String> {
    db.conn()
        .execute(
            "DELETE FROM task_relationships WHERE id=?1",
            params![id],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_task_relationship(db: &Database, id: &str) -> Result<TaskRelationship, String> {
    db.conn()
        .query_row(
            "SELECT id, source_task_id, target_task_id, relationship_type, is_blocking, label, created_at
             FROM task_relationships WHERE id=?1",
            params![id],
            |row| {
                Ok(TaskRelationship {
                    id: row.get(0)?,
                    source_task_id: row.get(1)?,
                    target_task_id: row.get(2)?,
                    relationship_type: row.get(3)?,
                    is_blocking: row.get::<_, i32>(4)? != 0,
                    label: row.get(5)?,
                    created_at: row.get(6)?,
                })
            },
        )
        .map_err(|e| format!("Task relationship not found: {}", e))
}

pub fn list_task_relationships(db: &Database) -> Result<Vec<TaskRelationship>, String> {
    let mut stmt = db
        .conn()
        .prepare(
            "SELECT id, source_task_id, target_task_id, relationship_type, is_blocking, label, created_at
             FROM task_relationships ORDER BY created_at",
        )
        .map_err(|e| e.to_string())?;
    let rels = stmt
        .query_map([], |row| {
            Ok(TaskRelationship {
                id: row.get(0)?,
                source_task_id: row.get(1)?,
                target_task_id: row.get(2)?,
                relationship_type: row.get(3)?,
                is_blocking: row.get::<_, i32>(4)? != 0,
                label: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    Ok(rels)
}
