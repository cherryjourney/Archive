use rusqlite::params;
use crate::db::Database;
use crate::models::paper::*;
use crate::utils::date;
use crate::utils::id;

pub fn create_paper(db: &Database, params: CreatePaperParams) -> Result<Paper, String> {
    let id = id::generate_id();
    let now = date::now_str();
    db.conn().execute(
        "INSERT INTO papers (id, title, authors, year, venue, doi, arxiv_id, status, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![id, params.title, params.authors, params.year, params.venue, params.doi, params.arxiv_id, params.status, now, now],
    ).map_err(|e| e.to_string())?;
    get_paper(db, &id)
}

pub fn update_paper(db: &Database, id: &str, params: UpdatePaperParams) -> Result<Paper, String> {
    let now = date::now_str();
    if let Some(v) = &params.title { db.conn().execute("UPDATE papers SET title=?1, updated_at=?2 WHERE id=?3", params![v, now, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = &params.authors { db.conn().execute("UPDATE papers SET authors=?1, updated_at=?2 WHERE id=?3", params![v, now, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = params.year { db.conn().execute("UPDATE papers SET year=?1, updated_at=?2 WHERE id=?3", params![v, now, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = &params.venue { db.conn().execute("UPDATE papers SET venue=?1, updated_at=?2 WHERE id=?3", params![v, now, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = &params.doi { db.conn().execute("UPDATE papers SET doi=?1, updated_at=?2 WHERE id=?3", params![v, now, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = &params.arxiv_id { db.conn().execute("UPDATE papers SET arxiv_id=?1, updated_at=?2 WHERE id=?3", params![v, now, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = &params.status { db.conn().execute("UPDATE papers SET status=?1, updated_at=?2 WHERE id=?3", params![v, now, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = &params.contribution { db.conn().execute("UPDATE papers SET contribution=?1, updated_at=?2 WHERE id=?3", params![v, now, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = &params.notes { db.conn().execute("UPDATE papers SET notes=?1, updated_at=?2 WHERE id=?3", params![v, now, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = params.rating { db.conn().execute("UPDATE papers SET rating=?1, updated_at=?2 WHERE id=?3", params![v, now, id]).map_err(|e| e.to_string())?; }
    get_paper(db, id)
}

pub fn delete_paper(db: &Database, id: &str) -> Result<(), String> {
    db.conn().execute("DELETE FROM papers WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_paper(db: &Database, id: &str) -> Result<Paper, String> {
    db.conn().query_row(
        "SELECT id, title, authors, year, venue, doi, arxiv_id, status, contribution, notes, rating, created_at, updated_at FROM papers WHERE id=?1",
        params![id], |row| Ok(Paper {
            id: row.get(0)?, title: row.get(1)?, authors: row.get(2)?, year: row.get(3)?,
            venue: row.get(4)?, doi: row.get(5)?, arxiv_id: row.get(6)?, status: row.get(7)?,
            contribution: row.get(8)?, notes: row.get(9)?, rating: row.get(10)?,
            created_at: row.get(11)?, updated_at: row.get(12)?,
        })
    ).map_err(|e| format!("Paper not found: {}", e))
}

pub fn list_papers(db: &Database) -> Result<Vec<Paper>, String> {
    let mut stmt = db.conn().prepare(
        "SELECT id, title, authors, year, venue, doi, arxiv_id, status, contribution, notes, rating, created_at, updated_at FROM papers ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;
    let papers = stmt.query_map([], |row| Ok(Paper {
        id: row.get(0)?, title: row.get(1)?, authors: row.get(2)?, year: row.get(3)?,
        venue: row.get(4)?, doi: row.get(5)?, arxiv_id: row.get(6)?, status: row.get(7)?,
        contribution: row.get(8)?, notes: row.get(9)?, rating: row.get(10)?,
        created_at: row.get(11)?, updated_at: row.get(12)?,
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(papers)
}
