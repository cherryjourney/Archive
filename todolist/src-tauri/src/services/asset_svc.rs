use rusqlite::params;
use crate::db::Database;
use crate::models::asset::{Asset, CreateAssetParams, UpdateAssetParams, AssetStats};

const COLS: &str = "id, name, category, purchase_date, price, currency, quantity, brand, model, warranty_expiry, status, condition, notes, is_sentimental, origin, related_people, related_stories, retired_at, farewell_message, created_at, updated_at";

fn row_to_asset(row: &rusqlite::Row) -> rusqlite::Result<Asset> {
    Ok(Asset {
        id: row.get(0)?, name: row.get(1)?, category: row.get(2)?, purchase_date: row.get(3)?,
        price: row.get(4)?, currency: row.get(5)?, quantity: row.get(6)?, brand: row.get(7)?,
        model: row.get(8)?, warranty_expiry: row.get(9)?, status: row.get(10)?, condition: row.get(11)?,
        notes: row.get(12)?, is_sentimental: row.get::<_, i32>(13)? != 0, origin: row.get(14)?,
        related_people: row.get(15)?, related_stories: row.get(16)?, retired_at: row.get(17)?,
        farewell_message: row.get(18)?, created_at: row.get(19)?, updated_at: row.get(20)?,
    })
}

pub fn create_asset(db: &Database, id: &str, params: &CreateAssetParams) -> Result<(), String> {
    db.conn().execute(
        "INSERT INTO personal_assets (id, name, category, purchase_date, price, currency, quantity, brand, model, warranty_expiry, status, condition, notes, is_sentimental, origin, related_people, related_stories, retired_at, farewell_message, created_at, updated_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,datetime('now','localtime'),datetime('now','localtime'))",
        params![id, params.name, params.category, params.purchase_date, params.price, params.currency, params.quantity, params.brand, params.model, params.warranty_expiry, params.status, params.condition, params.notes, params.is_sentimental as i32, params.origin, params.related_people, params.related_stories, params.retired_at, params.farewell_message],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn update_asset(db: &Database, id: &str, params: &UpdateAssetParams) -> Result<(), String> {
    let mut sets = vec!["updated_at = datetime('now','localtime')".to_string()];
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
    if let Some(ref v) = params.name { sets.push("name = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.category { sets.push("category = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.purchase_date { sets.push("purchase_date = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(v) = params.price { sets.push("price = ?".into()); values.push(Box::new(v)); }
    if let Some(ref v) = params.currency { sets.push("currency = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(v) = params.quantity { sets.push("quantity = ?".into()); values.push(Box::new(v)); }
    if let Some(ref v) = params.brand { sets.push("brand = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.model { sets.push("model = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.warranty_expiry { if v.is_empty() { sets.push("warranty_expiry = NULL".into()); } else { sets.push("warranty_expiry = ?".into()); values.push(Box::new(v.clone())); } }
    if let Some(ref v) = params.status { sets.push("status = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.condition { sets.push("condition = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.notes { sets.push("notes = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(v) = params.is_sentimental { sets.push("is_sentimental = ?".into()); values.push(Box::new(v as i32)); }
    if let Some(ref v) = params.origin { sets.push("origin = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.related_people { sets.push("related_people = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.related_stories { sets.push("related_stories = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.retired_at { if v.is_empty() { sets.push("retired_at = NULL".into()); } else { sets.push("retired_at = ?".into()); values.push(Box::new(v.clone())); } }
    if let Some(ref v) = params.farewell_message { sets.push("farewell_message = ?".into()); values.push(Box::new(v.clone())); }
    if sets.len() == 1 { return Ok(()); }
    let sql = format!("UPDATE personal_assets SET {} WHERE id = ?", sets.join(", "));
    values.push(Box::new(id.to_string()));
    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
    db.conn().execute(&sql, params_refs.as_slice()).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_asset(db: &Database, id: &str) -> Result<(), String> {
    db.conn().execute("DELETE FROM personal_assets WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_asset(db: &Database, id: &str) -> Result<Asset, String> {
    db.conn().query_row(&format!("SELECT {} FROM personal_assets WHERE id = ?1", COLS), params![id], row_to_asset).map_err(|e| e.to_string())
}

pub fn list_assets(db: &Database, category: Option<String>, status: Option<String>, search: Option<String>, sort_by: Option<String>, sort_dir: Option<String>) -> Result<Vec<Asset>, String> {
    let mut sql = format!("SELECT {} FROM personal_assets WHERE 1=1", COLS);
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
    if let Some(ref cat) = category { if !cat.is_empty() { sql.push_str(&format!(" AND category = ?{}", values.len()+1)); values.push(Box::new(cat.clone())); } }
    if let Some(ref s) = status { if !s.is_empty() { sql.push_str(&format!(" AND status = ?{}", values.len()+1)); values.push(Box::new(s.clone())); } }
    if let Some(ref q) = search { if !q.is_empty() { sql.push_str(&format!(" AND name LIKE ?{}", values.len()+1)); values.push(Box::new(format!("%{}%", q))); } }
    let sort_col = match sort_by.as_deref() { Some("name") => "name", Some("price") => "price", Some("purchase_date") => "purchase_date", _ => "purchase_date" };
    let dir = match sort_dir.as_deref() { Some("asc")|Some("ASC") => "ASC", _ => "DESC" };
    sql.push_str(&format!(" ORDER BY {} {}", sort_col, dir));
    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
    let mut stmt = db.conn().prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params_refs.as_slice(), row_to_asset).map_err(|e| e.to_string())?;
    Ok(rows.filter_map(|r| r.ok()).collect())
}

pub fn get_asset_stats(db: &Database) -> Result<AssetStats, String> {
    db.conn().query_row("SELECT COALESCE(SUM(price * quantity), 0), COUNT(*) FROM personal_assets", [], |row| Ok(AssetStats { total_value: row.get(0)?, total_count: row.get(1)? })).map_err(|e| e.to_string())
}

pub fn get_expiring_warranties(db: &Database, days: i32) -> Result<Vec<Asset>, String> {
    let sql = format!("SELECT {} FROM personal_assets WHERE warranty_expiry IS NOT NULL AND date(warranty_expiry) BETWEEN date('now') AND date('now', '+{} days') AND status = 'in_use' ORDER BY warranty_expiry ASC", COLS, days);
    let mut stmt = db.conn().prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], row_to_asset).map_err(|e| e.to_string())?;
    Ok(rows.filter_map(|r| r.ok()).collect())
}
