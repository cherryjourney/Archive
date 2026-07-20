use crate::AppState;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Course {
    pub id: String,
    pub name: String,
    pub instructor: String,
    pub schedule: String,
    pub location: String,
    pub color: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Assignment {
    pub id: String,
    pub course_id: String,
    pub title: String,
    pub due_date: String,
    #[serde(rename = "type")]
    pub assignment_type: String,
    pub done: bool,
}

// ====== Courses ======

#[tauri::command]
pub fn list_courses(state: tauri::State<AppState>) -> Result<Vec<Course>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();
    let mut stmt = conn
        .prepare("SELECT id, name, instructor, schedule, location, color FROM courses ORDER BY created_at")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Course {
                id: row.get(0)?,
                name: row.get(1)?,
                instructor: row.get(2)?,
                schedule: row.get(3)?,
                location: row.get(4)?,
                color: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut courses = Vec::new();
    for row in rows {
        courses.push(row.map_err(|e| e.to_string())?);
    }
    Ok(courses)
}

#[tauri::command]
pub fn create_course(state: tauri::State<AppState>, course: Course) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.conn()
        .execute(
            "INSERT INTO courses (id, name, instructor, schedule, location, color) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![course.id, course.name, course.instructor, course.schedule, course.location, course.color],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_course(state: tauri::State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.conn()
        .execute("DELETE FROM courses WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ====== Assignments ======

#[tauri::command]
pub fn list_assignments(state: tauri::State<AppState>) -> Result<Vec<Assignment>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();
    let mut stmt = conn
        .prepare("SELECT id, course_id, title, due_date, type, done FROM assignments ORDER BY due_date")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Assignment {
                id: row.get(0)?,
                course_id: row.get(1)?,
                title: row.get(2)?,
                due_date: row.get(3)?,
                assignment_type: row.get(4)?,
                done: row.get::<_, i32>(5)? != 0,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut assignments = Vec::new();
    for row in rows {
        assignments.push(row.map_err(|e| e.to_string())?);
    }
    Ok(assignments)
}

#[tauri::command]
pub fn create_assignment(state: tauri::State<AppState>, assignment: Assignment) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.conn()
        .execute(
            "INSERT INTO assignments (id, course_id, title, due_date, type, done) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![assignment.id, assignment.course_id, assignment.title, assignment.due_date, assignment.assignment_type, assignment.done as i32],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_assignment(state: tauri::State<AppState>, assignment: Assignment) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.conn()
        .execute(
            "UPDATE assignments SET course_id=?1, title=?2, due_date=?3, type=?4, done=?5 WHERE id=?6",
            rusqlite::params![assignment.course_id, assignment.title, assignment.due_date, assignment.assignment_type, assignment.done as i32, assignment.id],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_assignment(state: tauri::State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.conn()
        .execute("DELETE FROM assignments WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
