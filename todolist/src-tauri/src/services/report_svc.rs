use rusqlite::params;
use serde::Serialize;

use crate::db::Database;

#[derive(Debug, Serialize)]
pub struct WeeklyReport {
    pub start_date: String,
    pub end_date: String,
    pub completed_tasks: i32,
    pub total_tasks: i32,
    pub completion_rate: f64,
    pub focus_sessions: i32,
    pub focus_total_seconds: i32,
    pub streak_days: i32,
    pub category_distribution: Vec<CategorySummary>,
    pub prev_completed_tasks: i32,
    pub prev_completion_rate: f64,
    pub prev_focus_sessions: i32,
    pub prev_focus_total_seconds: i32,
}

#[derive(Debug, Serialize)]
pub struct CategorySummary {
    pub name: String,
    pub color: String,
    pub completed: i32,
    pub total: i32,
}

/// 生成周报数据
pub fn generate_weekly_report(db: &Database, start: &str, end: &str) -> Result<WeeklyReport, String> {
    // 本周完成任务
    let (completed_tasks, total_tasks): (i32, i32) = db
        .conn()
        .query_row(
            "SELECT
                SUM(CASE WHEN t.status='completed' THEN 1 ELSE 0 END),
                COUNT(*)
             FROM daily_plan_tasks dpt
             JOIN daily_plans dp ON dpt.daily_plan_id = dp.id
             JOIN tasks t ON dpt.task_id = t.id
             WHERE dp.date BETWEEN ?1 AND ?2",
            params![start, end],
            |row| {
                let c: i32 = row.get(0)?;
                let t: i32 = row.get(1)?;
                Ok((c, t))
            },
        )
        .unwrap_or((0, 0));

    let completion_rate = if total_tasks > 0 {
        completed_tasks as f64 / total_tasks as f64
    } else {
        0.0
    };

    // 专注统计 — Pomodoro feature removed
    let (focus_sessions, focus_seconds): (i32, i32) = (0, 0);

    // 连续打卡
    let streak_days: i32 = db
        .conn()
        .query_row(
            "SELECT COUNT(DISTINCT dp.date) FROM daily_plans dp
             JOIN daily_plan_tasks dpt ON dp.id = dpt.daily_plan_id
             JOIN tasks t ON dpt.task_id = t.id AND t.status = 'completed'
             WHERE dp.date BETWEEN ?1 AND ?2",
            params![start, end],
            |row| row.get(0),
        )
        .unwrap_or(0);

    // 分类分布（查询失败不影响整体报告）
    let category_distribution = get_category_summary(db, start, end).unwrap_or_default();

    // 上周同期数据（用于对比）
    let prev_start = crate::utils::date::offset_days(start, -7);
    let prev_end = crate::utils::date::offset_days(end, -7);

    let (prev_completed, prev_total): (i32, i32) = db
        .conn()
        .query_row(
            "SELECT
                SUM(CASE WHEN t.status='completed' THEN 1 ELSE 0 END),
                COUNT(*)
             FROM daily_plan_tasks dpt
             JOIN daily_plans dp ON dpt.daily_plan_id = dp.id
             JOIN tasks t ON dpt.task_id = t.id
             WHERE dp.date BETWEEN ?1 AND ?2",
            params![prev_start, prev_end],
            |row| {
                let c: i32 = row.get(0)?;
                let t: i32 = row.get(1)?;
                Ok((c, t))
            },
        )
        .unwrap_or((0, 0));

    let prev_rate = if prev_total > 0 {
        prev_completed as f64 / prev_total as f64
    } else {
        0.0
    };

    // Previous focus stats — Pomodoro feature removed
    let (prev_focus_sessions, prev_focus_seconds): (i32, i32) = (0, 0);

    Ok(WeeklyReport {
        start_date: start.to_string(),
        end_date: end.to_string(),
        completed_tasks,
        total_tasks,
        completion_rate,
        focus_sessions,
        focus_total_seconds: focus_seconds,
        streak_days,
        category_distribution,
        prev_completed_tasks: prev_completed,
        prev_completion_rate: prev_rate,
        prev_focus_sessions,
        prev_focus_total_seconds: prev_focus_seconds,
    })
}

fn get_category_summary(db: &Database, start: &str, end: &str) -> Result<Vec<CategorySummary>, String> {
    let mut stmt = db
        .conn()
        .prepare(
            "SELECT c.name, c.color,
                SUM(CASE WHEN t.status='completed' THEN 1 ELSE 0 END),
                COUNT(*)
             FROM categories c
             LEFT JOIN task_categories tc ON c.id = tc.category_id
             LEFT JOIN tasks t ON tc.task_id = t.id
             AND t.scheduled_date BETWEEN ?1 AND ?2
             GROUP BY c.id
             HAVING COUNT(*) > 0
             ORDER BY COUNT(*) DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![start, end], |row| {
            Ok(CategorySummary {
                name: row.get(0)?,
                color: row.get(1)?,
                completed: row.get(2)?,
                total: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(rows)
}

/// 生成 Markdown 格式周报
pub fn generate_markdown_report(report: &WeeklyReport) -> String {
    let focus_minutes = report.focus_total_seconds / 60;
    let prev_focus_minutes = report.prev_focus_total_seconds / 60;

    let completion_trend = if report.completion_rate > report.prev_completion_rate {
        "↑"
    } else if report.completion_rate < report.prev_completion_rate {
        "↓"
    } else {
        "→"
    };

    let focus_trend = if focus_minutes > prev_focus_minutes {
        "↑"
    } else if focus_minutes < prev_focus_minutes {
        "↓"
    } else {
        "→"
    };

    let mut md = String::new();
    md.push_str(&format!(
        "# 📊 周报 {} ~ {}\n\n",
        report.start_date, report.end_date
    ));

    md.push_str("## 📋 任务完成\n\n");
    md.push_str(&format!(
        "| 指标 | 本周 | 上周 | 趋势 |\n|------|------|------|------|\n"
    ));
    md.push_str(&format!(
        "| 完成任务 | {} | {} | — |\n",
        report.completed_tasks, report.prev_completed_tasks
    ));
    md.push_str(&format!(
        "| 完成率 | {:.0}% | {:.0}% | {} |\n",
        report.completion_rate * 100.0,
        report.prev_completion_rate * 100.0,
        completion_trend
    ));
    md.push_str(&format!(
        "| 总任务数 | {} | — | — |\n",
        report.total_tasks
    ));

    md.push_str("\n## ⏱️ 专注时间\n\n");
    md.push_str(&format!(
        "| 指标 | 本周 | 上周 | 趋势 |\n|------|------|------|------|\n"
    ));
    md.push_str(&format!(
        "| 专注次数 | {} | {} | — |\n",
        report.focus_sessions, report.prev_focus_sessions
    ));
    md.push_str(&format!(
        "| 总时长 | {}min | {}min | {} |\n",
        focus_minutes, prev_focus_minutes, focus_trend
    ));

    md.push_str(&format!(
        "\n## 🔥 连续打卡\n\n{} 天\n",
        report.streak_days
    ));

    if !report.category_distribution.is_empty() {
        md.push_str("\n## 🏷️ 分类分布\n\n");
        md.push_str("| 分类 | 完成 | 总数 | 完成率 |\n|------|------|------|------|\n");
        for cat in &report.category_distribution {
            let rate = if cat.total > 0 {
                cat.completed as f64 / cat.total as f64 * 100.0
            } else {
                0.0
            };
            md.push_str(&format!(
                "| {} | {} | {} | {:.0}% |\n",
                cat.name, cat.completed, cat.total, rate
            ));
        }
    }

    md.push_str(&format!(
        "\n---\n*由 Archive · 存迹 自动生成于 {}*",
        crate::utils::date::now_str()
    ));

    md
}
