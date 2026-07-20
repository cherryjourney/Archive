use std::collections::HashSet;

use rusqlite::params;
use serde::Deserialize;

use crate::db::Database;
use crate::models::daily_plan::*;
use crate::models::task::Task;
use crate::utils::date;
use crate::utils::id;

#[derive(Debug, Deserialize)]
pub struct ImportFocusRecord {
    pub date: String,
    pub todo_name: String,
    pub start_time: String,
    pub end_time: String,
    pub duration_minutes: i32,
}

pub fn get_or_create_daily_plan(db: &Database, date_str: &str) -> Result<DailyPlan, String> {
    // 尝试获取已有计划
    let existing = db.conn().query_row(
        "SELECT id, date, morning_plan_md, evening_review_md, efficiency_rating, mood_rating, notes,
         created_at, updated_at FROM daily_plans WHERE date=?1",
        params![date_str],
        |row| {
            Ok(DailyPlan {
                id: row.get(0)?,
                date: row.get(1)?,
                morning_plan_md: row.get(2)?,
                evening_review_md: row.get(3)?,
                efficiency_rating: row.get(4)?,
                mood_rating: row.get(5)?,
                notes: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
                tasks: Vec::new(),
            })
        },
    );

    let plan = match existing {
        Ok(p) => p,
        Err(_) => {
            let id = id::generate_id();
            let now = date::now_str();
            db.conn()
                .execute(
                    "INSERT INTO daily_plans (id, date, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
                    params![id, date_str, now, now],
                )
                .map_err(|e| e.to_string())?;
            DailyPlan {
                id,
                date: date_str.to_string(),
                morning_plan_md: String::new(),
                evening_review_md: String::new(),
                efficiency_rating: None,
                mood_rating: None,
                notes: String::new(),
                created_at: now.clone(),
                updated_at: now,
                tasks: Vec::new(),
            }
        }
    };

    // 加载该计划关联的任务
    let tasks = load_plan_tasks(db, &plan.id)?;

    Ok(DailyPlan { tasks, ..plan })
}

fn load_plan_tasks(db: &Database, plan_id: &str) -> Result<Vec<PlanTask>, String> {
    let mut stmt = db
        .conn()
        .prepare(
            "SELECT dpt.task_id, dpt.sort_order, dpt.is_mit, dpt.added_at,
             dpt.start_time, dpt.end_time,
             t.id, t.title, t.description, t.status, t.priority, t.estimated_minutes,
             t.actual_minutes, t.due_date, t.scheduled_date, t.is_recurring, t.recurring_rule,
             t.parent_task_id, t.sort_order, t.is_mit, t.completion_note,
             t.created_at, t.updated_at, t.completed_at,
             t.start_date, t.end_date, t.progress, t.color
             FROM daily_plan_tasks dpt
             JOIN tasks t ON dpt.task_id = t.id
             WHERE dpt.daily_plan_id=?1
             ORDER BY dpt.start_time, dpt.sort_order",
        )
        .map_err(|e| e.to_string())?;

    let tasks = stmt
        .query_map(params![plan_id], |row| {
            Ok(PlanTask {
                task_id: row.get(0)?,
                sort_order: row.get(1)?,
                is_mit: row.get::<_, i32>(2)? != 0,
                added_at: row.get(3)?,
                start_time: row.get(4)?,
                end_time: row.get(5)?,
                task: Task {
                    id: row.get(6)?,
                    title: row.get(7)?,
                    description: row.get(8)?,
                    status: row.get(9)?,
                    priority: row.get(10)?,
                    estimated_minutes: row.get(11)?,
                    actual_minutes: row.get(12)?,
                    due_date: row.get(13)?,
                    scheduled_date: row.get(14)?,
                    is_recurring: row.get::<_, i32>(15)? != 0,
                    recurring_rule: row.get(16)?,
                    parent_task_id: row.get(17)?,
                    sort_order: row.get(18)?,
                    is_mit: row.get::<_, i32>(19)? != 0,
                    completion_note: row.get(20)?,
                    created_at: row.get(21)?,
                    updated_at: row.get(22)?,
                    completed_at: row.get(23)?,
                    start_date: row.get(24)?,
                    end_date: row.get(25)?,
                    progress: row.get(26)?,
                    color: row.get(27)?,
                },
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(tasks)
}

pub fn update_morning_plan(db: &Database, plan_id: &str, markdown: &str) -> Result<(), String> {
    let now = date::now_str();
    db.conn()
        .execute(
            "UPDATE daily_plans SET morning_plan_md=?1, updated_at=?2 WHERE id=?3",
            params![markdown, now, plan_id],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// 将任务以「待安排」（无时间）方式挂到指定日期的每日计划。
/// 已存在关联时不做任何修改（不覆盖已设置的时间）。
pub fn link_task_to_plan_unscheduled(db: &Database, task_id: &str, date_str: &str) -> Result<(), String> {
    let plan = get_or_create_daily_plan(db, date_str)?;
    let now = date::now_str();
    db.conn()
        .execute(
            "INSERT INTO daily_plan_tasks (daily_plan_id, task_id, sort_order, is_mit, start_time, end_time, added_at)
             VALUES (?1, ?2, 0, 0, NULL, NULL, ?3)
             ON CONFLICT(daily_plan_id, task_id) DO NOTHING",
            params![plan.id, task_id, now],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn add_task_to_plan(
    db: &Database, plan_id: &str, task_id: &str,
    is_mit: bool, start_time: Option<&str>, end_time: Option<&str>,
) -> Result<(), String> {
    let now = date::now_str();

    db.conn()
        .execute(
            "INSERT INTO daily_plan_tasks (daily_plan_id, task_id, sort_order, is_mit, start_time, end_time, added_at)
             VALUES (?1, ?2, 0, ?3, ?4, ?5, ?6)
             ON CONFLICT(daily_plan_id, task_id) DO UPDATE SET
             is_mit = excluded.is_mit,
             start_time = excluded.start_time,
             end_time = excluded.end_time,
             added_at = excluded.added_at",
            params![plan_id, task_id, is_mit as i32, start_time, end_time, now],
        )
        .map_err(|e| e.to_string())?;

    // Update task scheduled_date
    let plan_date: String = db
        .conn()
        .query_row("SELECT date FROM daily_plans WHERE id=?1", params![plan_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    // 仅在 scheduled_date 为空时才设置为计划日期，避免覆盖用户手动设置的未来日期
    db.conn()
        .execute(
            "UPDATE tasks SET scheduled_date=?1, updated_at=?2 WHERE id=?3 AND scheduled_date IS NULL",
            params![plan_date, now, task_id],
        )
        .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn update_plan_task_time(
    db: &Database, plan_id: &str, task_id: &str,
    start_time: &str, end_time: &str,
) -> Result<(), String> {
    db.conn()
        .execute(
            "UPDATE daily_plan_tasks SET start_time=?1, end_time=?2 WHERE daily_plan_id=?3 AND task_id=?4",
            params![start_time, end_time, plan_id, task_id],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn remove_task_from_plan(db: &Database, plan_id: &str, task_id: &str) -> Result<(), String> {
    db.conn()
        .execute(
            "DELETE FROM daily_plan_tasks WHERE daily_plan_id=?1 AND task_id=?2",
            params![plan_id, task_id],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn reorder_plan_tasks(db: &Database, plan_id: &str, task_ids: Vec<String>) -> Result<(), String> {
    for (i, task_id) in task_ids.iter().enumerate() {
        db.conn()
            .execute(
                "UPDATE daily_plan_tasks SET sort_order=?1 WHERE daily_plan_id=?2 AND task_id=?3",
                params![i as i32, plan_id, task_id],
            )
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn complete_task_in_plan(
    db: &Database,
    _plan_id: &str,
    task_id: &str,
    actual_minutes: Option<i32>,
    completion_note: Option<&str>,
) -> Result<(), String> {
    let now = date::now_str();
    let conn = db.conn();

    // 完成当前任务
    conn.execute(
        "UPDATE tasks SET status='completed', actual_minutes=?1, completion_note=?2, completed_at=?3, updated_at=?4 WHERE id=?5",
        params![actual_minutes, completion_note.unwrap_or(""), now, now, task_id],
    )
    .map_err(|e| e.to_string())?;

    // 检查是否需要生成重复任务的下一个实例
    let recurring_info: Option<(bool, Option<String>, Option<String>)> = conn
        .query_row(
            "SELECT is_recurring, recurring_rule, scheduled_date FROM tasks WHERE id=?1",
            params![task_id],
            |row| {
                let is_recurring: i32 = row.get(0)?;
                let recurring_rule: Option<String> = row.get(1)?;
                let scheduled_date: Option<String> = row.get(2)?;
                Ok((is_recurring != 0, recurring_rule, scheduled_date))
            },
        )
        .ok();

    if let Some((true, Some(rule), scheduled_date)) = recurring_info {
        // 使用 scheduled_date 或 due_date 作为当前日期
        let base_date = scheduled_date.unwrap_or_else(|| date::today_str());
        if let Some(next_date) = super::recurring::get_next_date(&base_date, &rule) {
            // 克隆原任务并更新日期
            let new_id = format!("task-{}", uuid::Uuid::new_v4());

            conn.execute(
                "INSERT INTO tasks (id, title, description, status, priority, estimated_minutes,
                 due_date, scheduled_date, is_recurring, recurring_rule, sort_order, is_mit, created_at, updated_at)
                 SELECT ?1, title, description, 'pending', priority, estimated_minutes,
                 due_date, ?2, is_recurring, recurring_rule, sort_order, is_mit, ?3, ?3
                 FROM tasks WHERE id=?4",
                params![new_id, next_date, now, task_id],
            )
            .map_err(|e| e.to_string())?;

            // 下一个实例同样挂到对应日期计划的「待安排」
            link_task_to_plan_unscheduled(db, &new_id, &next_date)?;
        }
    }

    Ok(())
}

pub fn postpone_task(db: &Database, task_id: &str, from_date: &str, to_date: &str) -> Result<(), String> {
    let now = date::now_str();
    // 从原计划中移除
    db.conn()
        .execute(
            "DELETE FROM daily_plan_tasks WHERE task_id=?1 AND daily_plan_id IN
             (SELECT id FROM daily_plans WHERE date=?2)",
            params![task_id, from_date],
        )
        .map_err(|e| e.to_string())?;

    // 更新任务日期
    db.conn()
        .execute(
            "UPDATE tasks SET scheduled_date=?1, updated_at=?2 WHERE id=?3",
            params![to_date, now, task_id],
        )
        .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn update_evening_review(db: &Database, plan_id: &str, params: EveningReviewParams) -> Result<(), String> {
    let now = date::now_str();

    if let Some(rating) = params.efficiency_rating {
        db.conn()
            .execute("UPDATE daily_plans SET efficiency_rating=?1, updated_at=?2 WHERE id=?3", params![rating, now, plan_id])
            .map_err(|e| e.to_string())?;
    }
    if let Some(mood) = params.mood_rating {
        db.conn()
            .execute("UPDATE daily_plans SET mood_rating=?1, updated_at=?2 WHERE id=?3", params![mood, now, plan_id])
            .map_err(|e| e.to_string())?;
    }
    if let Some(review) = &params.evening_review_md {
        db.conn()
            .execute("UPDATE daily_plans SET evening_review_md=?1, updated_at=?2 WHERE id=?3", params![review, now, plan_id])
            .map_err(|e| e.to_string())?;
    }
    if let Some(notes) = &params.notes {
        db.conn()
            .execute("UPDATE daily_plans SET notes=?1, updated_at=?2 WHERE id=?3", params![notes, now, plan_id])
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Import focus records from external sources (e.g. 番茄ToDo).
/// Each Excel row becomes its own task — no merging, no reuse.
/// This preserves exact start time, end time, and duration for every session.
/// Idempotent: clears previously-imported tasks in the same date range first.
pub fn import_focus_records(db: &Database, records: Vec<ImportFocusRecord>) -> Result<String, String> {
    let now = date::now_str();

    // ── Collect the date range being imported ──
    let unique_dates: HashSet<String> = records.iter().map(|r| r.date.clone()).collect();
    let mut sorted_dates: Vec<&String> = unique_dates.iter().collect();
    sorted_dates.sort();
    let first_date = sorted_dates.first().map(|s| s.as_str()).unwrap_or("");
    let last_date = sorted_dates.last().map(|s| s.as_str()).unwrap_or("");

    // ── Clear previously-imported tasks in this date range ──
    // Identify them: completed, 学习 category, scheduled_date within range
    let deleted_tasks = db
        .conn()
        .execute(
            "DELETE FROM tasks WHERE id IN (
                SELECT tc.task_id FROM task_categories tc
                JOIN tasks t ON t.id = tc.task_id
                WHERE tc.category_id = 'cat-study'
                  AND t.status = 'completed'
                  AND t.scheduled_date >= ?1
                  AND t.scheduled_date <= ?2
            )",
            params![first_date, last_date],
        )
        .map_err(|e| e.to_string())?;
    // daily_plan_tasks and task_categories auto-delete via CASCADE

    let default_colors: &[(&str, &str)] = &[
        ("408计算机专业基础", "#4C6EF5"),
        ("数学", "#F76707"),
        ("政治", "#E03131"),
        ("英语", "#059669"),
        ("睡眠", "#7950F2"),
    ];

    let mut new_task_count = 0u32;
    let mut new_plan_count = 0u32;

    for r in &records {
        let color = default_colors
            .iter()
            .find(|(n, _)| n == &r.todo_name)
            .map(|(_, c)| *c)
            .unwrap_or("#4C6EF5");

        // ── Create a new task for every single session ──
        let task_id = id::generate_id();
        db.conn()
            .execute(
                "INSERT INTO tasks (id, title, description, status, priority,
                 estimated_minutes, actual_minutes, scheduled_date,
                 progress, color, completed_at, created_at, updated_at)
                 VALUES (?1, ?2, '', 'completed', 2, ?3, ?3, ?4, 100, ?5, ?6, ?6, ?6)",
                params![task_id, r.todo_name, r.duration_minutes, r.date, color, now],
            )
            .map_err(|e| e.to_string())?;

        // Assign to 学习 category
        db.conn()
            .execute(
                "INSERT OR IGNORE INTO task_categories (task_id, category_id) VALUES (?1, 'cat-study')",
                params![task_id],
            )
            .map_err(|e| e.to_string())?;

        new_task_count += 1;

        // ── Link to the date's daily plan ──
        let plan = get_or_create_daily_plan(db, &r.date)?;
        let is_new_plan = plan.tasks.is_empty()
            && plan.morning_plan_md.is_empty()
            && plan.evening_review_md.is_empty()
            && plan.notes.is_empty();
        if is_new_plan {
            new_plan_count += 1;
        }

        db.conn()
            .execute(
                "INSERT INTO daily_plan_tasks (daily_plan_id, task_id, sort_order, is_mit, start_time, end_time, added_at)
                 VALUES (?1, ?2, 0, 0, ?3, ?4, ?5)
                 ON CONFLICT(daily_plan_id, task_id) DO UPDATE SET
                 start_time = excluded.start_time,
                 end_time = excluded.end_time",
                params![plan.id, task_id, r.start_time, r.end_time, now],
            )
            .map_err(|e| e.to_string())?;
    }

    Ok(format!(
        "导入完成：{} 条记录 → {} 个新任务 + {} 个新计划（{} 个日期）{}",
        records.len(), new_task_count, new_plan_count, unique_dates.len(),
        if deleted_tasks > 0 { format!("，清理了 {} 条旧记录", deleted_tasks) } else { String::new() },
    ))
}
