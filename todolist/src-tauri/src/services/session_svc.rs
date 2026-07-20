use rusqlite::params;

use crate::db::Database;
use crate::services::chart_svc::HeatmapCell;

/// Close any sessions that were not properly ended (crash recovery).
pub fn close_stale_sessions(db: &Database) -> Result<(), String> {
    db.conn()
        .execute(
            "UPDATE app_sessions
             SET end_time = datetime('now','localtime'),
                 duration_seconds = CAST((julianday('now') - julianday(start_time)) * 86400 AS INTEGER)
             WHERE end_time IS NULL",
            [],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Start a new app session.
pub fn start_session(db: &Database, id: &str) -> Result<(), String> {
    // First close any stale sessions from previous crash
    close_stale_sessions(db)?;

    db.conn()
        .execute(
            "INSERT INTO app_sessions (id, start_time) VALUES (?1, datetime('now','localtime'))",
            params![id],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// End an app session, recording end_time and duration_seconds.
pub fn end_session(db: &Database, id: &str) -> Result<(), String> {
    db.conn()
        .execute(
            "UPDATE app_sessions
             SET end_time = datetime('now','localtime'),
                 duration_seconds = CAST((julianday('now') - julianday(start_time)) * 86400 AS INTEGER)
             WHERE id = ?1 AND end_time IS NULL",
            params![id],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Get daily task focus-time heatmap for a given year.
/// Sums actual_minutes from all completed tasks per day, assigns level 0-4.
pub fn get_daily_usage_heatmap(db: &Database, year: i32) -> Result<Vec<HeatmapCell>, String> {
    let start = format!("{}-01-01", year);
    let end = format!("{}-12-31", year);

    let mut stmt = db
        .conn()
        .prepare(
            "SELECT t.scheduled_date, COALESCE(SUM(t.actual_minutes), 0) as total_min
             FROM tasks t
             WHERE t.scheduled_date BETWEEN ?1 AND ?2
               AND t.status = 'completed'
             GROUP BY t.scheduled_date
             ORDER BY t.scheduled_date",
        )
        .map_err(|e| e.to_string())?;

    let cells = stmt
        .query_map(params![start, end], |row| {
            let total_minutes: i32 = row.get(1)?;
            let level = match total_minutes {
                0 => 0,
                1..=120 => 1,   // up to 2h
                121..=240 => 2, // 2h–4h
                241..=420 => 3, // 4h–7h
                _ => 4,         // 7h+
            };
            Ok(HeatmapCell {
                date: row.get(0)?,
                count: total_minutes,
                level,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(cells)
}
