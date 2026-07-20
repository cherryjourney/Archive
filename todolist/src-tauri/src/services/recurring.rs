use chrono::{Datelike, Duration, NaiveDate, Months};

/// Parse recurring_rule JSON and calculate the next occurrence date.
/// Rule format: {"frequency": "daily"|"weekly"|"monthly"|"yearly"|"weekdays", "interval": N}
pub fn get_next_date(current_date: &str, recurring_rule: &str) -> Option<String> {
    let rule: serde_json::Value = serde_json::from_str(recurring_rule).ok()?;
    let frequency = rule.get("frequency")?.as_str()?;
    let interval = rule
        .get("interval")
        .and_then(|v| v.as_i64())
        .unwrap_or(1);

    let date = NaiveDate::parse_from_str(current_date, "%Y-%m-%d").ok()?;

    let next = match frequency {
        "daily" => date + Duration::days(interval),
        "weekly" => date + Duration::days(7 * interval),
        "monthly" => date.checked_add_months(Months::new(interval as u32))?,
        "yearly" => date.checked_add_months(Months::new(12 * interval as u32))?,
        "weekdays" => {
            let mut next = date + Duration::days(1);
            // Saturday or Sunday → jump to Monday
            if next.weekday().number_from_monday() >= 6 {
                let days_until_monday = 8 - next.weekday().number_from_monday() as i64;
                next += Duration::days(days_until_monday);
            }
            next
        }
        _ => return None,
    };

    Some(next.format("%Y-%m-%d").to_string())
}
