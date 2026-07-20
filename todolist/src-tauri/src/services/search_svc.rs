use crate::db::Database;

/// Global search: search tasks by title
pub fn global_search(db: &Database, query: &str) -> Result<GlobalSearchResult, String> {
    let escaped = query.replace('\'', "''");

    let task_sql = format!(
        "SELECT id, title FROM tasks WHERE title LIKE '%{}%' LIMIT 20",
        escaped
    );
    let mut stmt = db.conn().prepare(&task_sql).map_err(|e| e.to_string())?;
    let tasks: Vec<SearchItem> = stmt
        .query_map([], |row| {
            Ok(SearchItem {
                id: row.get(0)?,
                title: row.get(1)?,
                item_type: "task".to_string(),
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(GlobalSearchResult { tasks })
}

#[derive(Debug, serde::Serialize)]
pub struct GlobalSearchResult {
    pub tasks: Vec<SearchItem>,
}

#[derive(Debug, serde::Serialize)]
pub struct SearchItem {
    pub id: String,
    pub title: String,
    pub item_type: String,
}
