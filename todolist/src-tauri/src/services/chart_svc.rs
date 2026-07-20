use rusqlite::params;
use serde::Serialize;

use crate::db::Database;

#[derive(Debug, Serialize)]
pub struct DashboardStats {
    pub today_total: i32,
    pub today_completed: i32,
    pub today_completion_rate: f64,
    pub streak_days: i32,
    pub week_completion_rate: f64,
    pub total_tasks: i32,
}

#[derive(Debug, Serialize)]
pub struct DailyStat {
    pub date: String,
    pub total: i32,
    pub completed: i32,
    pub rate: f64,
    pub efficiency: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct CategoryStat {
    pub category_name: String,
    pub category_color: String,
    pub count: i32,
    pub completed: i32,
}

#[derive(Debug, Serialize)]
pub struct HeatmapCell {
    pub date: String,
    pub count: i32,
    pub level: i32, // 0-4 热力等级
}

#[derive(Debug, Serialize)]
pub struct PriorityStat {
    pub priority: i32,
    pub label: String,
    pub count: i32,
}

#[derive(Debug, Serialize)]
pub struct EstimateVsActual {
    pub date: String,
    pub estimated: f64,
    pub actual: f64,
}

#[derive(Debug, Serialize)]
pub struct StreakData {
    pub current_streak: i32,
    pub longest_streak: i32,
    pub current_week_completed: i32,
}

#[derive(Debug, Serialize)]
pub struct ProductivityPoint {
    pub date: String,
    pub completed: i32,
    pub total: i32,
    pub rate: f64,
}

#[derive(Debug, Serialize)]
pub struct GrowthPoint {
    pub period: String,
    pub count: i32,
}

pub fn get_dashboard_stats(db: &Database) -> Result<DashboardStats, String> {
    let today = crate::utils::date::today_str();

    // 今日统计
    let (today_total, today_completed): (i32, i32) = db
        .conn()
        .query_row(
            "SELECT COUNT(*), SUM(CASE WHEN t.status='completed' THEN 1 ELSE 0 END)
             FROM daily_plan_tasks dpt
             JOIN daily_plans dp ON dpt.daily_plan_id = dp.id
             JOIN tasks t ON dpt.task_id = t.id
             WHERE dp.date=?1",
            params![today],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .unwrap_or((0, 0));

    let today_rate = if today_total > 0 {
        today_completed as f64 / today_total as f64
    } else {
        0.0
    };

    // 连续打卡
    let streak = get_streak_info(db)?;

    // 本周完成率
    let week_start = crate::utils::date::start_of_week();
    let week_end = crate::utils::date::end_of_week();
    let week_stats: Vec<DailyStat> = get_weekly_trend(db, &week_start, &week_end)?;
    let week_rate = if week_stats.is_empty() {
        0.0
    } else {
        week_stats.iter().map(|s| s.rate).sum::<f64>() / week_stats.len() as f64
    };

    let total_tasks: i32 = db
        .conn()
        .query_row("SELECT COUNT(*) FROM tasks", [], |row| row.get(0))
        .unwrap_or(0);

    Ok(DashboardStats {
        today_total,
        today_completed,
        today_completion_rate: today_rate,
        streak_days: streak.current_streak,
        week_completion_rate: week_rate,
        total_tasks,
    })
}

pub fn get_weekly_trend(db: &Database, start: &str, end: &str) -> Result<Vec<DailyStat>, String> {
    let mut stmt = db
        .conn()
        .prepare(
            "SELECT date, total_tasks, completed_tasks, efficiency_rating
             FROM v_daily_stats
             WHERE date BETWEEN ?1 AND ?2
             ORDER BY date",
        )
        .map_err(|e| e.to_string())?;

    let stats = stmt
        .query_map(params![start, end], |row| {
            let total: i32 = row.get(1)?;
            let completed: i32 = row.get(2)?;
            Ok(DailyStat {
                date: row.get(0)?,
                total,
                completed,
                rate: if total > 0 { completed as f64 / total as f64 } else { 0.0 },
                efficiency: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(stats)
}

pub fn get_category_distribution(db: &Database, start: &str, end: &str) -> Result<Vec<CategoryStat>, String> {
    let mut stmt = db
        .conn()
        .prepare(
            "SELECT c.name, c.color, COUNT(tc.task_id) as cnt,
             SUM(CASE WHEN t.status='completed' THEN 1 ELSE 0 END) as done
             FROM categories c
             LEFT JOIN task_categories tc ON c.id = tc.category_id
             LEFT JOIN tasks t ON tc.task_id = t.id
             AND t.scheduled_date BETWEEN ?1 AND ?2
             GROUP BY c.id
             ORDER BY cnt DESC",
        )
        .map_err(|e| e.to_string())?;

    let stats = stmt
        .query_map(params![start, end], |row| {
            Ok(CategoryStat {
                category_name: row.get(0)?,
                category_color: row.get(1)?,
                count: row.get(2)?,
                completed: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(stats)
}

pub fn get_monthly_heatmap(db: &Database, year: i32) -> Result<Vec<HeatmapCell>, String> {
    let start = format!("{}-01-01", year);
    let end = format!("{}-12-31", year);

    let mut stmt = db
        .conn()
        .prepare(
            "SELECT dp.date, COUNT(dpt.task_id) as cnt
             FROM daily_plans dp
             LEFT JOIN daily_plan_tasks dpt ON dp.id = dpt.daily_plan_id
             WHERE dp.date BETWEEN ?1 AND ?2
             GROUP BY dp.date
             ORDER BY dp.date",
        )
        .map_err(|e| e.to_string())?;

    let cells = stmt
        .query_map(params![start, end], |row| {
            let count: i32 = row.get(1)?;
            let level = match count {
                0 => 0,
                1..=2 => 1,
                3..=5 => 2,
                6..=9 => 3,
                _ => 4,
            };
            Ok(HeatmapCell {
                date: row.get(0)?,
                count,
                level,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(cells)
}

pub fn get_priority_distribution(db: &Database, start: &str, end: &str) -> Result<Vec<PriorityStat>, String> {
    let labels = ["P0 紧急", "P1 重要", "P2 普通", "P3 低优"];

    let mut stmt = db
        .conn()
        .prepare(
            "SELECT priority, COUNT(*) FROM tasks
             WHERE scheduled_date BETWEEN ?1 AND ?2
             GROUP BY priority
             ORDER BY priority",
        )
        .map_err(|e| e.to_string())?;

    let stats = stmt
        .query_map(params![start, end], |row| {
            let p: i32 = row.get(0)?;
            Ok(PriorityStat {
                priority: p,
                label: labels.get(p as usize).unwrap_or(&"未知").to_string(),
                count: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(stats)
}

pub fn get_estimate_vs_actual(db: &Database, start: &str, end: &str) -> Result<Vec<EstimateVsActual>, String> {
    let mut stmt = db
        .conn()
        .prepare(
            "SELECT date, total_estimated, total_actual
             FROM v_daily_stats
             WHERE date BETWEEN ?1 AND ?2 AND total_estimated > 0
             ORDER BY date",
        )
        .map_err(|e| e.to_string())?;

    let data = stmt
        .query_map(params![start, end], |row| {
            Ok(EstimateVsActual {
                date: row.get(0)?,
                estimated: row.get::<_, i32>(1)? as f64 / 60.0,
                actual: row.get::<_, i32>(2)? as f64 / 60.0,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(data)
}

pub fn get_streak_info(db: &Database) -> Result<StreakData, String> {
    // 查询有完成任务的连续日期
    let mut stmt = db
        .conn()
        .prepare(
            "SELECT dp.date FROM daily_plans dp
             JOIN daily_plan_tasks dpt ON dp.id = dpt.daily_plan_id
             JOIN tasks t ON dpt.task_id = t.id AND t.status = 'completed'
             GROUP BY dp.date
             HAVING COUNT(*) > 0
             ORDER BY dp.date DESC",
        )
        .map_err(|e| e.to_string())?;

    let dates: Vec<String> = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let today = crate::utils::date::today_str();
    let today_parsed = crate::utils::date::parse_date(&today).unwrap();

    let mut current_streak = 0;
    let mut longest_streak = 0;
    let mut streak = 0;
    let mut prev_date = today_parsed;

    // 检查今天是否完成
    let today_done = dates.first().map(|d| d == &today).unwrap_or(false);
    if today_done {
        current_streak = 1;
        prev_date = today_parsed;
    }

    for (i, date_str) in dates.iter().enumerate() {
        let d = crate::utils::date::parse_date(date_str).unwrap();
        if i == 0 && today_done {
            continue;
        }
        let diff = (prev_date - d).num_days();
        if diff == 1 || (i == 0 && !today_done && d == today_parsed) {
            streak += 1;
        } else {
            longest_streak = longest_streak.max(streak);
            streak = 1;
        }
        if d <= today_parsed && current_streak == 0 {
            current_streak = 1;
        }
        prev_date = d;
    }
    longest_streak = longest_streak.max(streak);

    let this_week_completed: i32 = db
        .conn()
        .query_row(
            "SELECT COUNT(DISTINCT dp.date) FROM daily_plans dp
             JOIN daily_plan_tasks dpt ON dp.id = dpt.daily_plan_id
             JOIN tasks t ON dpt.task_id = t.id AND t.status = 'completed'
             WHERE dp.date BETWEEN ?1 AND ?2",
            params![crate::utils::date::start_of_week(), crate::utils::date::end_of_week()],
            |row| row.get(0),
        )
        .unwrap_or(0);

    Ok(StreakData {
        current_streak,
        longest_streak,
        current_week_completed: this_week_completed,
    })
}

pub fn get_productivity_data(db: &Database, start: &str, end: &str) -> Result<Vec<ProductivityPoint>, String> {
    let stats = get_weekly_trend(db, start, end)?;
    Ok(stats
        .into_iter()
        .map(|s| ProductivityPoint {
            date: s.date,
            completed: s.completed,
            total: s.total,
            rate: s.rate,
        })
        .collect())
}

