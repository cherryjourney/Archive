use chrono::{Datelike, Local, NaiveDate};

pub fn today_str() -> String {
    Local::now().format("%Y-%m-%d").to_string()
}

pub fn now_str() -> String {
    Local::now().format("%Y-%m-%dT%H:%M:%S").to_string()
}

pub fn parse_date(s: &str) -> Option<NaiveDate> {
    NaiveDate::parse_from_str(s, "%Y-%m-%d").ok()
}

pub fn start_of_week() -> String {
    let today = Local::now().date_naive();
    let weekday = today.weekday().num_days_from_monday();
    let monday = today - chrono::Duration::days(weekday as i64);
    monday.format("%Y-%m-%d").to_string()
}

pub fn end_of_week() -> String {
    let today = Local::now().date_naive();
    let weekday = today.weekday().num_days_from_monday();
    let sunday = today + chrono::Duration::days(6 - weekday as i64);
    sunday.format("%Y-%m-%d").to_string()
}

pub fn offset_days(base_date: &str, days: i64) -> String {
    if let Some(date) = parse_date(base_date) {
        (date + chrono::Duration::days(days))
            .format("%Y-%m-%d")
            .to_string()
    } else {
        base_date.to_string()
    }
}

pub fn start_of_month() -> String {
    let today = Local::now().date_naive();
    NaiveDate::from_ymd_opt(today.year(), today.month(), 1)
        .unwrap()
        .format("%Y-%m-%d")
        .to_string()
}
