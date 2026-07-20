use rusqlite::params;

use crate::db::Database;
use crate::models::emotion::{EmotionEntry, EmotionHeatmapCell, SaveEmotionParams};
use crate::utils::id;

pub fn get_or_create(db: &Database, date: &str) -> Result<EmotionEntry, String> {
    let result = db.conn().query_row(
        "SELECT id, date, emoji_1, emoji_2, emoji_3, emoji_4, emoji_5,
                control_score, notes, weather, task_completed_count,
                created_at, updated_at
         FROM emotion_entries WHERE date = ?1",
        params![date],
        |row| {
            Ok(EmotionEntry {
                id: row.get(0)?,
                date: row.get(1)?,
                emoji_1: row.get(2)?,
                emoji_2: row.get(3)?,
                emoji_3: row.get(4)?,
                emoji_4: row.get(5)?,
                emoji_5: row.get(6)?,
                control_score: row.get(7)?,
                notes: row.get(8)?,
                weather: row.get(9)?,
                task_completed_count: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        },
    );

    match result {
        Ok(entry) => Ok(entry),
        Err(_) => {
            let id_str = id::generate_id();
            db.conn()
                .execute(
                    "INSERT INTO emotion_entries (id, date, emoji_1, emoji_2, emoji_3, emoji_4, emoji_5,
                     control_score, notes, weather, task_completed_count, created_at, updated_at)
                     VALUES (?1, ?2, '', '', '', '', '', 0, '', '', 0,
                     datetime('now','localtime'), datetime('now','localtime'))",
                    params![id_str, date],
                )
                .map_err(|e| e.to_string())?;

            Ok(EmotionEntry {
                id: id_str,
                date: date.to_string(),
                emoji_1: String::new(),
                emoji_2: String::new(),
                emoji_3: String::new(),
                emoji_4: String::new(),
                emoji_5: String::new(),
                control_score: 0,
                notes: String::new(),
                weather: String::new(),
                task_completed_count: 0,
                created_at: String::new(),
                updated_at: String::new(),
            })
        }
    }
}

pub fn save(db: &Database, params: &SaveEmotionParams) -> Result<EmotionEntry, String> {
    // Ensure an entry exists (get_or_create does INSERT if missing)
    get_or_create(db, &params.date)?;

    db.conn()
        .execute(
            "UPDATE emotion_entries SET
             emoji_1 = ?1, emoji_2 = ?2, emoji_3 = ?3, emoji_4 = ?4, emoji_5 = ?5,
             control_score = ?6, notes = ?7, weather = ?8, task_completed_count = ?9,
             updated_at = datetime('now','localtime')
             WHERE date = ?10",
            params![
                params.emoji_1, params.emoji_2, params.emoji_3, params.emoji_4, params.emoji_5,
                params.control_score, params.notes, params.weather, params.task_completed_count,
                params.date,
            ],
        )
        .map_err(|e| e.to_string())?;

    get_or_create(db, &params.date)
}

pub fn list_for_heatmap(db: &Database, year: i32) -> Result<Vec<EmotionHeatmapCell>, String> {
    let start = format!("{}-01-01", year);
    let end = format!("{}-12-31", year);

    let mut stmt = db.conn()
        .prepare(
            "SELECT date, control_score, emoji_1 FROM emotion_entries
             WHERE date >= ?1 AND date <= ?2 ORDER BY date ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![start, end], |row| {
            Ok(EmotionHeatmapCell {
                date: row.get(0)?,
                control_score: row.get(1)?,
                emoji_1: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut cells = Vec::new();
    for row in rows {
        cells.push(row.map_err(|e| e.to_string())?);
    }
    Ok(cells)
}
