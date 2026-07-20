use rusqlite::params;

use crate::db::Database;
use crate::models::badge::{Badge, BadgeWithStatus, UserBadge};
use crate::utils::id;

pub fn list_badges(db: &Database) -> Result<Vec<BadgeWithStatus>, String> {
    let mut stmt = db.conn()
        .prepare(
            "SELECT b.id, b.name, b.description, b.icon, b.category, b.criteria_type, b.criteria_value, b.created_at,
                    ub.id, ub.badge_id, ub.progress, ub.unlocked, ub.unlocked_at, ub.notified
             FROM badges b
             LEFT JOIN user_badges ub ON b.id = ub.badge_id
             ORDER BY b.category, b.id",
        )
        .map_err(|e| e.to_string())?;

    let mut badges: Vec<BadgeWithStatus> = Vec::new();
    let rows = stmt
        .query_map([], |row| {
            Ok((
                Badge {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    icon: row.get(3)?,
                    category: row.get(4)?,
                    criteria_type: row.get(5)?,
                    criteria_value: row.get(6)?,
                    created_at: row.get(7)?,
                },
                row.get::<_, Option<String>>(8).ok().flatten().map(|_| UserBadge {
                    id: row.get::<_, String>(8).unwrap_or_default(),
                    badge_id: row.get::<_, String>(9).unwrap_or_default(),
                    progress: row.get::<_, f64>(10).unwrap_or(0.0),
                    unlocked: row.get::<_, i32>(11).unwrap_or(0) != 0,
                    unlocked_at: row.get::<_, Option<String>>(12).unwrap_or(None),
                    notified: row.get::<_, i32>(13).unwrap_or(0) != 0,
                }),
            ))
        })
        .map_err(|e| e.to_string())?;

    for row in rows {
        let (badge, user_badge) = row.map_err(|e| e.to_string())?;
        badges.push(BadgeWithStatus { badge, user_badge });
    }
    Ok(badges)
}

pub fn check_all_badges(db: &Database) -> Result<Vec<BadgeWithStatus>, String> {
    let mut newly_unlocked: Vec<String> = Vec::new();

    // Collect stats from various tables
    // Plan streak (consecutive days with a daily plan)
    let plan_streak = calc_plan_streak(db);

    // Papers read
    let papers_read: i32 = db.conn()
        .query_row("SELECT COUNT(*) FROM papers WHERE status = 'read'", [], |r| r.get(0))
        .unwrap_or(0);

    // Experiments count
    let experiments_count: i32 = db.conn()
        .query_row("SELECT COUNT(*) FROM experiments", [], |r| r.get(0))
        .unwrap_or(0);

    // Finance streak
    let finance_streak = calc_finance_streak(db);

    // Life events count
    let life_events_count: i32 = db.conn()
        .query_row("SELECT COUNT(*) FROM life_events", [], |r| r.get(0))
        .unwrap_or(0);

    // Tasks completed
    let tasks_completed: i32 = db.conn()
        .query_row("SELECT COUNT(*) FROM tasks WHERE status = 'completed'", [], |r| r.get(0))
        .unwrap_or(0);

    // Travel cities
    let travel_cities: i32 = db.conn()
        .query_row("SELECT COUNT(*) FROM visited_cities", [], |r| r.get(0))
        .unwrap_or(0);

    // Courses completed (assignments all done)
    let courses_completed: i32 = db.conn()
        .query_row(
            "SELECT COUNT(*) FROM courses c WHERE (SELECT COUNT(*) FROM assignments a WHERE a.course_id = c.id AND a.done = 0) = 0",
            [], |r| r.get(0),
        )
        .unwrap_or(0);

    // Assets count
    let assets_count: i32 = db.conn()
        .query_row("SELECT COUNT(*) FROM personal_assets", [], |r| r.get(0))
        .unwrap_or(0);

    // Countdowns created
    let countdowns_created: i32 = db.conn()
        .query_row("SELECT COUNT(*) FROM countdown_events", [], |r| r.get(0))
        .unwrap_or(0);

    // Advisor meetings count
    let advisor_meetings: i32 = db.conn()
        .query_row("SELECT COUNT(*) FROM advisor_meetings", [], |r| r.get(0))
        .unwrap_or(0);

    // Memories count
    let memories_count: i32 = db.conn()
        .query_row("SELECT COUNT(*) FROM memories", [], |r| r.get(0))
        .unwrap_or(0);

    // Early bird days (plans created before 8am)
    let early_bird_days: i32 = 0; // simplified

    // Contacts count
    let contacts_count: i32 = db.conn()
        .query_row("SELECT COUNT(*) FROM contacts", [], |r| r.get(0))
        .unwrap_or(0);

    // Check each badge criteria
    let badge_criteria: Vec<(&str, i32)> = vec![
        ("plan_streak_7d", plan_streak),
        ("papers_30", papers_read),
        ("experiments_50", experiments_count),
        ("finance_streak_30d", finance_streak),
        ("first_life_event", life_events_count),
        ("tasks_100", tasks_completed),
        ("first_travel_city", travel_cities),
        ("early_bird_30d", early_bird_days),
        ("course_complete_10", courses_completed),
        ("asset_collector_50", assets_count),
        ("countdown_10", countdowns_created),
        ("first_advisor_meeting", advisor_meetings),
        ("contact_network_20", contacts_count),
        ("first_memory", memories_count),
    ];

    for (badge_id, current_value) in &badge_criteria {
        // Get badge criteria value
        let criteria: Result<(i32,), _> = db.conn().query_row(
            "SELECT criteria_value FROM badges WHERE id = ?1",
            params![badge_id],
            |r| Ok((r.get(0)?,)),
        );

        if let Ok((criteria_value,)) = criteria {
            let progress = if criteria_value > 0 {
                (*current_value as f64 / criteria_value as f64).min(1.0)
            } else {
                0.0
            };

            let unlocked = *current_value >= criteria_value && criteria_value > 0;

            // Upsert user_badge
            let existing: Option<String> = db.conn()
                .query_row(
                    "SELECT id FROM user_badges WHERE badge_id = ?1",
                    params![badge_id],
                    |r| r.get(0),
                )
                .ok();

            if let Some(ub_id) = existing {
                // Check if previously unlocked
                let was_unlocked: bool = db.conn()
                    .query_row(
                        "SELECT unlocked FROM user_badges WHERE id = ?1",
                        params![ub_id],
                        |r| Ok(r.get::<_, i32>(0)? != 0),
                    )
                    .unwrap_or(false);

                db.conn().execute(
                    "UPDATE user_badges SET progress = ?1, unlocked = ?2,
                     unlocked_at = CASE WHEN ?2 = 1 AND unlocked = 0 THEN datetime('now','localtime') ELSE unlocked_at END,
                     notified = CASE WHEN ?2 = 1 AND unlocked = 0 THEN 0 ELSE notified END
                     WHERE id = ?3",
                    params![progress, unlocked as i32, ub_id],
                ).map_err(|e| e.to_string())?;

                if unlocked && !was_unlocked {
                    newly_unlocked.push(badge_id.to_string());
                }
            } else {
                let new_id = id::generate_id();
                db.conn().execute(
                    "INSERT INTO user_badges (id, badge_id, progress, unlocked, unlocked_at, notified)
                     VALUES (?1, ?2, ?3, ?4, CASE WHEN ?4 = 1 THEN datetime('now','localtime') ELSE NULL END, 0)",
                    params![new_id, badge_id, progress, unlocked as i32],
                ).map_err(|e| e.to_string())?;

                if unlocked {
                    newly_unlocked.push(badge_id.to_string());
                }
            }
        }
    }

    list_badges(db)
}

fn calc_plan_streak(db: &Database) -> i32 {
    // Calculate consecutive days with a daily plan (looking backwards from today)
    let rows: Vec<String> = db.conn()
        .prepare("SELECT date FROM daily_plans ORDER BY date DESC")
        .ok()
        .map(|mut s| {
            s.query_map([], |r| r.get(0))
                .ok()
                .map(|rows| rows.filter_map(|r| r.ok()).collect())
                .unwrap_or_default()
        })
        .unwrap_or_default();

    if rows.is_empty() { return 0; }

    let today = crate::utils::date::today_str();
    let mut expected = today.clone();
    let mut streak = 0;

    for date_str in &rows {
        if date_str == &expected {
            streak += 1;
            expected = crate::utils::date::offset_days(&expected, -1);
        } else if date_str < &expected {
            break;
        }
    }

    streak
}

fn calc_finance_streak(db: &Database) -> i32 {
    let rows: Vec<String> = db.conn()
        .prepare("SELECT DISTINCT date FROM transactions ORDER BY date DESC")
        .ok()
        .map(|mut s| {
            s.query_map([], |r| r.get(0))
                .ok()
                .map(|rows| rows.filter_map(|r| r.ok()).collect())
                .unwrap_or_default()
        })
        .unwrap_or_default();

    if rows.is_empty() { return 0; }

    let today = crate::utils::date::today_str();
    let mut expected = today.clone();
    let mut streak = 0;

    for date_str in &rows {
        if date_str == &expected {
            streak += 1;
            expected = crate::utils::date::offset_days(&expected, -1);
        } else if date_str < &expected {
            break;
        }
    }

    streak
}

pub fn get_newly_unlocked_count(db: &Database) -> Result<i32, String> {
    let count: i32 = db.conn()
        .query_row(
            "SELECT COUNT(*) FROM user_badges WHERE unlocked = 1 AND notified = 0",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);
    Ok(count)
}

pub fn mark_all_notified(db: &Database) -> Result<(), String> {
    db.conn()
        .execute("UPDATE user_badges SET notified = 1 WHERE unlocked = 1 AND notified = 0", [])
        .map_err(|e| e.to_string())?;
    Ok(())
}
