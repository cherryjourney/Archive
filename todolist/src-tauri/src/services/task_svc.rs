use rusqlite::params;

use crate::db::Database;
use crate::models::task::*;
use crate::utils::date;
use crate::utils::id;

pub fn create_task(db: &Database, params: CreateTaskParams) -> Result<Task, String> {
    let id = id::generate_id();
    let now = date::now_str();

    db.conn()
        .execute(
            "INSERT INTO tasks (id, title, description, priority, estimated_minutes, due_date,
             scheduled_date, parent_task_id, completion_note, start_date, end_date, progress, color, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
            params![
                id,
                params.title,
                params.description,
                params.priority,
                params.estimated_minutes,
                params.due_date,
                params.scheduled_date,
                params.parent_task_id,
                "",  // completion_note starts empty
                params.start_date,
                params.end_date,
                params.progress,
                params.color,
                now,
                now,
            ],
        )
        .map_err(|e| e.to_string())?;

    // 如果有分类，建立关联
    if let Some(cat_id) = params.category_id {
        db.conn()
            .execute(
                "INSERT OR IGNORE INTO task_categories (task_id, category_id) VALUES (?1, ?2)",
                params![id, cat_id],
            )
            .map_err(|e| e.to_string())?;
    }

    // 设置了日期的任务自动挂到对应日期的每日计划（待安排，无时间）。
    // 前端后续如调用 add_task_to_plan 设置具体时间，会 UPSERT 覆盖此关联。
    if let Some(date_str) = &params.scheduled_date {
        if !date_str.is_empty() {
            super::plan_svc::link_task_to_plan_unscheduled(db, &id, date_str)?;
        }
    }

    get_task(db, &id)
}

pub fn update_task(db: &Database, task_id: &str, params: UpdateTaskParams) -> Result<Task, String> {
    let now = date::now_str();

    if let Some(title) = &params.title {
        db.conn()
            .execute("UPDATE tasks SET title=?1, updated_at=?2 WHERE id=?3", params![title, now, task_id])
            .map_err(|e| e.to_string())?;
    }
    if let Some(desc) = &params.description {
        db.conn()
            .execute("UPDATE tasks SET description=?1, updated_at=?2 WHERE id=?3", params![desc, now, task_id])
            .map_err(|e| e.to_string())?;
    }
    if let Some(status) = &params.status {
        let completed_at = if status == "completed" { Some(now.clone()) } else { None };
        db.conn()
            .execute(
                "UPDATE tasks SET status=?1, completed_at=?2, updated_at=?3 WHERE id=?4",
                params![status, completed_at, now, task_id],
            )
            .map_err(|e| e.to_string())?;
    }
    if let Some(priority) = params.priority {
        db.conn()
            .execute("UPDATE tasks SET priority=?1, updated_at=?2 WHERE id=?3", params![priority, now, task_id])
            .map_err(|e| e.to_string())?;
    }
    if let Some(est) = params.estimated_minutes {
        db.conn()
            .execute("UPDATE tasks SET estimated_minutes=?1, updated_at=?2 WHERE id=?3", params![est, now, task_id])
            .map_err(|e| e.to_string())?;
    }
    if let Some(act) = params.actual_minutes {
        db.conn()
            .execute("UPDATE tasks SET actual_minutes=?1, updated_at=?2 WHERE id=?3", params![act, now, task_id])
            .map_err(|e| e.to_string())?;
    }
    if let Some(due) = &params.due_date {
        db.conn()
            .execute("UPDATE tasks SET due_date=?1, updated_at=?2 WHERE id=?3", params![due, now, task_id])
            .map_err(|e| e.to_string())?;
    }
    if let Some(sd) = &params.scheduled_date {
        db.conn()
            .execute("UPDATE tasks SET scheduled_date=?1, updated_at=?2 WHERE id=?3", params![sd, now, task_id])
            .map_err(|e| e.to_string())?;
    }
    if let Some(sd) = &params.start_date {
        db.conn()
            .execute("UPDATE tasks SET start_date=?1, updated_at=?2 WHERE id=?3", params![sd, now, task_id])
            .map_err(|e| e.to_string())?;
    }
    if let Some(ed) = &params.end_date {
        db.conn()
            .execute("UPDATE tasks SET end_date=?1, updated_at=?2 WHERE id=?3", params![ed, now, task_id])
            .map_err(|e| e.to_string())?;
    }
    if let Some(progress) = params.progress {
        db.conn()
            .execute("UPDATE tasks SET progress=?1, updated_at=?2 WHERE id=?3", params![progress, now, task_id])
            .map_err(|e| e.to_string())?;
    }
    if let Some(color) = &params.color {
        db.conn()
            .execute("UPDATE tasks SET color=?1, updated_at=?2 WHERE id=?3", params![color, now, task_id])
            .map_err(|e| e.to_string())?;
    }

    if let Some(cat_id) = params.category_id {
        db.conn()
            .execute("DELETE FROM task_categories WHERE task_id=?1", params![task_id])
            .map_err(|e| e.to_string())?;
        db.conn()
            .execute("INSERT OR IGNORE INTO task_categories (task_id, category_id) VALUES (?1, ?2)", params![task_id, cat_id])
            .map_err(|e| e.to_string())?;
    }

    if let Some(note) = &params.completion_note {
        db.conn()
            .execute("UPDATE tasks SET completion_note=?1, updated_at=?2 WHERE id=?3", params![note, now, task_id])
            .map_err(|e| e.to_string())?;
    }

    get_task(db, task_id)
}

pub fn get_task(db: &Database, task_id: &str) -> Result<Task, String> {
    db.conn()
        .query_row(
            "SELECT id, title, description, status, priority, estimated_minutes, actual_minutes,
             due_date, scheduled_date, is_recurring, recurring_rule, parent_task_id,
             sort_order, is_mit, completion_note, created_at, updated_at, completed_at,
             start_date, end_date, progress, color
             FROM tasks WHERE id=?1",
            params![task_id],
            |row| {
                Ok(Task {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    description: row.get(2)?,
                    status: row.get(3)?,
                    priority: row.get(4)?,
                    estimated_minutes: row.get(5)?,
                    actual_minutes: row.get(6)?,
                    due_date: row.get(7)?,
                    scheduled_date: row.get(8)?,
                    is_recurring: row.get::<_, i32>(9)? != 0,
                    recurring_rule: row.get(10)?,
                    parent_task_id: row.get(11)?,
                    sort_order: row.get(12)?,
                    is_mit: row.get::<_, i32>(13)? != 0,
                    completion_note: row.get(14)?,
                    created_at: row.get(15)?,
                    updated_at: row.get(16)?,
                    completed_at: row.get(17)?,
                    start_date: row.get(18)?,
                    end_date: row.get(19)?,
                    progress: row.get(20)?,
                    color: row.get(21)?,
                })
            },
        )
        .map_err(|e| format!("Task not found: {}", e))
}

pub fn delete_task(db: &Database, task_id: &str) -> Result<(), String> {
    db.conn()
        .execute("DELETE FROM tasks WHERE id=?1", params![task_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn list_tasks(db: &Database, filter: TaskFilter) -> Result<TaskPage, String> {
    let mut sql = String::from(
        "SELECT id, title, description, status, priority, estimated_minutes, actual_minutes,
         due_date, scheduled_date, is_recurring, recurring_rule, parent_task_id,
         sort_order, is_mit, completion_note, created_at, updated_at, completed_at,
         start_date, end_date, progress, color
         FROM tasks WHERE 1=1",
    );
    let mut count_sql = String::from("SELECT COUNT(*) FROM tasks WHERE 1=1");
    // 简化：直接将参数拼入 SQL（生产环境应使用动态参数索引）
    if let Some(status) = &filter.status {
        let cond = format!(" AND status='{}'", status.replace('\'', "''"));
        sql.push_str(&cond);
        count_sql.push_str(&cond);
    }
    if let Some(search) = &filter.search {
        let escaped = search.replace('\'', "''");
        let cond = format!(" AND (title LIKE '%{}%' OR description LIKE '%{}%')", escaped, escaped);
        sql.push_str(&cond);
        count_sql.push_str(&cond);
    }
    if let Some(sd) = &filter.scheduled_date {
        let cond = format!(" AND scheduled_date='{}'", sd.replace('\'', "''"));
        sql.push_str(&cond);
        count_sql.push_str(&cond);
    }

    let total: i32 = db
        .conn()
        .query_row(&count_sql, [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    let offset = (filter.page - 1) * filter.page_size;
    sql.push_str(&format!(
        " ORDER BY created_at DESC LIMIT {} OFFSET {}",
        filter.page_size, offset
    ));

    let mut stmt = db.conn().prepare(&sql).map_err(|e| e.to_string())?;
    let tasks = stmt
        .query_map([], |row| {
            Ok(Task {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                status: row.get(3)?,
                priority: row.get(4)?,
                estimated_minutes: row.get(5)?,
                actual_minutes: row.get(6)?,
                due_date: row.get(7)?,
                scheduled_date: row.get(8)?,
                is_recurring: row.get::<_, i32>(9)? != 0,
                recurring_rule: row.get(10)?,
                parent_task_id: row.get(11)?,
                sort_order: row.get(12)?,
                is_mit: row.get::<_, i32>(13)? != 0,
                completion_note: row.get(14)?,
                created_at: row.get(15)?,
                updated_at: row.get(16)?,
                completed_at: row.get(17)?,
                start_date: row.get(18)?,
                end_date: row.get(19)?,
                progress: row.get(20)?,
                color: row.get(21)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(TaskPage {
        tasks,
        total,
        page: filter.page,
        page_size: filter.page_size,
    })
}

pub fn reorder_tasks(db: &Database, task_ids: Vec<String>) -> Result<(), String> {
    for (i, id) in task_ids.iter().enumerate() {
        db.conn()
            .execute("UPDATE tasks SET sort_order=?1 WHERE id=?2", params![i as i32, id])
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn get_task_library(db: &Database) -> Result<Vec<Task>, String> {
    let mut stmt = db
        .conn()
        .prepare(
            "SELECT id, title, description, status, priority, estimated_minutes, actual_minutes,
             due_date, scheduled_date, is_recurring, recurring_rule, parent_task_id,
             sort_order, is_mit, completion_note, created_at, updated_at, completed_at,
             start_date, end_date, progress, color
             FROM tasks WHERE status != 'completed' AND scheduled_date IS NULL
             ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let tasks = stmt
        .query_map([], |row| {
            Ok(Task {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                status: row.get(3)?,
                priority: row.get(4)?,
                estimated_minutes: row.get(5)?,
                actual_minutes: row.get(6)?,
                due_date: row.get(7)?,
                scheduled_date: row.get(8)?,
                is_recurring: row.get::<_, i32>(9)? != 0,
                recurring_rule: row.get(10)?,
                parent_task_id: row.get(11)?,
                sort_order: row.get(12)?,
                is_mit: row.get::<_, i32>(13)? != 0,
                completion_note: row.get(14)?,
                created_at: row.get(15)?,
                updated_at: row.get(16)?,
                completed_at: row.get(17)?,
                start_date: row.get(18)?,
                end_date: row.get(19)?,
                progress: row.get(20)?,
                color: row.get(21)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(tasks)
}

#[derive(Debug, serde::Serialize)]
pub struct CategoryStat {
    pub id: String,
    pub name: String,
    pub color: String,
    pub icon: String,
    pub sort_order: i32,
    pub task_count: i32,
}

pub fn list_categories(db: &Database, include_counts: bool) -> Result<Vec<CategoryStat>, String> {
    let sql = if include_counts {
        "SELECT c.id, c.name, c.color, c.icon, c.sort_order,
                COUNT(tc.task_id) as task_count
         FROM categories c
         LEFT JOIN task_categories tc ON c.id = tc.category_id
         GROUP BY c.id
         ORDER BY c.sort_order"
    } else {
        "SELECT c.id, c.name, c.color, c.icon, c.sort_order, 0 as task_count
         FROM categories c
         ORDER BY c.sort_order"
    };

    let mut stmt = db.conn().prepare(sql).map_err(|e| e.to_string())?;
    let cats = stmt
        .query_map([], |row| {
            Ok(CategoryStat {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                icon: row.get(3)?,
                sort_order: row.get(4)?,
                task_count: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    Ok(cats)
}

pub fn schedule_task(db: &Database, task_id: &str, date: &str) -> Result<(), String> {
    let now = date::now_str();
    db.conn()
        .execute(
            "UPDATE tasks SET scheduled_date=?1, updated_at=?2 WHERE id=?3",
            params![date, now, task_id],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}
