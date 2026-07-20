use rusqlite::params;
use crate::db::Database;

pub fn get_profile(db: &Database, key: &str) -> Result<Option<String>, String> {
    db.conn()
        .query_row(
            "SELECT value FROM user_profile WHERE key = ?1",
            params![key],
            |row| row.get(0),
        )
        .map(Some)
        .or_else(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => Ok(None),
            _ => Err(e.to_string()),
        })
}

pub fn set_profile(db: &Database, key: &str, value: &str) -> Result<(), String> {
    db.conn()
        .execute(
            "INSERT INTO user_profile (key, value) VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![key, value],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}
