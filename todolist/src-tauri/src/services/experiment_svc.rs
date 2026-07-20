use rusqlite::params;
use crate::db::Database;
use crate::models::experiment::*;
use crate::utils::date;
use crate::utils::id;

pub fn create_experiment(db: &Database, params: CreateExperimentParams) -> Result<Experiment, String> {
    let id = id::generate_id();
    let now = date::now_str();
    db.conn().execute(
        "INSERT INTO experiments (id, title, model, dataset, hyperparams, metrics, notes, is_baseline, project_id, paper_id, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![id, params.title, params.model, params.dataset, params.hyperparams, params.metrics, params.notes, params.is_baseline as i32, params.project_id, params.paper_id, now, now],
    ).map_err(|e| e.to_string())?;
    get_experiment(db, &id)
}

pub fn update_experiment(db: &Database, id: &str, params: UpdateExperimentParams) -> Result<Experiment, String> {
    let now = date::now_str();
    if let Some(v) = &params.title { db.conn().execute("UPDATE experiments SET title=?1, updated_at=?2 WHERE id=?3", params![v, now, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = &params.model { db.conn().execute("UPDATE experiments SET model=?1, updated_at=?2 WHERE id=?3", params![v, now, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = &params.dataset { db.conn().execute("UPDATE experiments SET dataset=?1, updated_at=?2 WHERE id=?3", params![v, now, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = &params.hyperparams { db.conn().execute("UPDATE experiments SET hyperparams=?1, updated_at=?2 WHERE id=?3", params![v, now, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = &params.metrics { db.conn().execute("UPDATE experiments SET metrics=?1, updated_at=?2 WHERE id=?3", params![v, now, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = &params.notes { db.conn().execute("UPDATE experiments SET notes=?1, updated_at=?2 WHERE id=?3", params![v, now, id]).map_err(|e| e.to_string())?; }
    if let Some(v) = params.is_baseline { db.conn().execute("UPDATE experiments SET is_baseline=?1, updated_at=?2 WHERE id=?3", params![v as i32, now, id]).map_err(|e| e.to_string())?; }
    get_experiment(db, id)
}

pub fn delete_experiment(db: &Database, id: &str) -> Result<(), String> {
    db.conn().execute("DELETE FROM experiments WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_experiment(db: &Database, id: &str) -> Result<Experiment, String> {
    db.conn().query_row(
        "SELECT id, title, model, dataset, hyperparams, metrics, notes, is_baseline, project_id, paper_id, created_at, updated_at FROM experiments WHERE id=?1",
        params![id], |row| Ok(Experiment {
            id: row.get(0)?, title: row.get(1)?, model: row.get(2)?, dataset: row.get(3)?,
            hyperparams: row.get(4)?, metrics: row.get(5)?, notes: row.get(6)?,
            is_baseline: row.get::<_, i32>(7)? != 0,
            project_id: row.get(8)?, paper_id: row.get(9)?,
            created_at: row.get(10)?, updated_at: row.get(11)?,
        })
    ).map_err(|e| format!("Experiment not found: {}", e))
}

pub fn list_experiments(db: &Database) -> Result<Vec<Experiment>, String> {
    let mut stmt = db.conn().prepare(
        "SELECT id, title, model, dataset, hyperparams, metrics, notes, is_baseline, project_id, paper_id, created_at, updated_at FROM experiments ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;
    let exps = stmt.query_map([], |row| Ok(Experiment {
        id: row.get(0)?, title: row.get(1)?, model: row.get(2)?, dataset: row.get(3)?,
        hyperparams: row.get(4)?, metrics: row.get(5)?, notes: row.get(6)?,
        is_baseline: row.get::<_, i32>(7)? != 0,
        project_id: row.get(8)?, paper_id: row.get(9)?,
        created_at: row.get(10)?, updated_at: row.get(11)?,
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(exps)
}
