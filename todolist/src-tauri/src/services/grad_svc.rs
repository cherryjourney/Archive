use rusqlite::params;
use crate::db::Database;
use crate::models::grad::*;

pub fn create_milestone(db: &Database, id_str: &str, params: &CreateMilestoneParams) -> Result<(), String> {
    db.conn().execute("INSERT INTO grad_milestones (id,title,date,milestone_type,category,description,is_key,semester,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,datetime('now','localtime'),datetime('now','localtime'))",
        params![id_str, params.title, params.date, params.milestone_type, params.category, params.description, params.is_key as i32, params.semester]).map_err(|e| e.to_string())?;
    Ok(())
}
pub fn update_milestone(db: &Database, id_str: &str, params: &UpdateMilestoneParams) -> Result<(), String> {
    let mut sets: Vec<String> = vec!["updated_at = datetime('now','localtime')".into()];
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
    if let Some(ref v) = params.title { sets.push("title = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.date { sets.push("date = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.milestone_type { sets.push("milestone_type = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.category { sets.push("category = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.description { sets.push("description = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(v) = params.is_key { sets.push("is_key = ?".into()); values.push(Box::new(v as i32)); }
    if let Some(ref v) = params.semester { sets.push("semester = ?".into()); values.push(Box::new(v.clone())); }
    if sets.len() == 1 { return Ok(()); }
    let sql = format!("UPDATE grad_milestones SET {} WHERE id = ?", sets.join(", "));
    values.push(Box::new(id_str.to_string()));
    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
    db.conn().execute(&sql, params_refs.as_slice()).map_err(|e| e.to_string())?;
    Ok(())
}
pub fn delete_milestone(db: &Database, id_str: &str) -> Result<(), String> {
    db.conn().execute("DELETE FROM grad_milestones WHERE id=?1", params![id_str]).map_err(|e| e.to_string())?;
    Ok(())
}
pub fn list_milestones(db: &Database) -> Result<Vec<GradMilestone>, String> {
    let mut stmt = db.conn().prepare("SELECT id,title,date,milestone_type,category,description,is_key,semester,created_at,updated_at FROM grad_milestones ORDER BY date ASC").map_err(|e| e.to_string())?;
    let result: Vec<GradMilestone> = stmt.query_map([], |r| Ok(GradMilestone {
        id: r.get(0)?, title: r.get(1)?, date: r.get(2)?, milestone_type: r.get(3)?, category: r.get(4)?, description: r.get(5)?, is_key: r.get::<_, i32>(6)? != 0, semester: r.get(7)?, created_at: r.get(8)?, updated_at: r.get(9)?,
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(result)
}

pub fn generate_semester_review(db: &Database, id_str: &str, semester: &str, period_start: &str, period_end: &str) -> Result<SemesterReview, String> {
    let courses: i32 = db.conn().query_row("SELECT COUNT(*) FROM courses WHERE created_at >= ?1 AND created_at <= ?2", params![period_start, period_end], |r| r.get(0)).unwrap_or(0);
    let experiments: i32 = db.conn().query_row("SELECT COUNT(*) FROM experiments WHERE created_at >= ?1 AND created_at <= ?2", params![period_start, period_end], |r| r.get(0)).unwrap_or(0);
    let papers: i32 = db.conn().query_row("SELECT COUNT(*) FROM papers WHERE status='read' AND updated_at >= ?1 AND updated_at <= ?2", params![period_start, period_end], |r| r.get(0)).unwrap_or(0);
    let meetings: i32 = db.conn().query_row("SELECT COUNT(*) FROM advisor_meetings WHERE date >= ?1 AND date <= ?2", params![period_start, period_end], |r| r.get(0)).unwrap_or(0);
    let rate: f64 = db.conn().query_row("SELECT CASE WHEN COUNT(*) > 0 THEN CAST(SUM(CASE WHEN t.status='completed' THEN 1 ELSE 0 END) AS REAL)/COUNT(*) ELSE 0 END FROM tasks t JOIN daily_plan_tasks dpt ON t.id = dpt.task_id JOIN daily_plans dp ON dpt.daily_plan_id = dp.id WHERE dp.date >= ?1 AND dp.date <= ?2", params![period_start, period_end], |r| r.get(0)).unwrap_or(0.0);

    let review = SemesterReview {
        id: id_str.to_string(), semester: semester.to_string(),
        period_start: Some(period_start.to_string()), period_end: Some(period_end.to_string()),
        courses_count: courses, experiments_count: experiments, papers_read: papers,
        advisor_meetings: meetings, task_completion_rate: rate,
        summary: String::new(), created_at: String::new(), updated_at: String::new(),
    };

    db.conn().execute(
        "INSERT OR REPLACE INTO semester_reviews (id, semester, period_start, period_end, courses_count, experiments_count, papers_read, advisor_meetings, task_completion_rate, summary, created_at, updated_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,'',datetime('now','localtime'),datetime('now','localtime'))",
        params![id_str, semester, period_start, period_end, courses, experiments, papers, meetings, rate],
    ).map_err(|e| e.to_string())?;

    Ok(review)
}

pub fn list_reviews(db: &Database) -> Result<Vec<SemesterReview>, String> {
    let mut stmt = db.conn().prepare("SELECT id,semester,period_start,period_end,courses_count,experiments_count,papers_read,advisor_meetings,task_completion_rate,summary,created_at,updated_at FROM semester_reviews ORDER BY semester DESC").map_err(|e| e.to_string())?;
    let result: Vec<SemesterReview> = stmt.query_map([], |r| Ok(SemesterReview {
        id: r.get(0)?, semester: r.get(1)?, period_start: r.get(2)?, period_end: r.get(3)?, courses_count: r.get(4)?, experiments_count: r.get(5)?, papers_read: r.get(6)?, advisor_meetings: r.get(7)?, task_completion_rate: r.get(8)?, summary: r.get(9)?, created_at: r.get(10)?, updated_at: r.get(11)?,
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(result)
}
