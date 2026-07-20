use rusqlite::params;
use uuid::Uuid;

use crate::db::Database;
use crate::models::travel::{
    VisitedCity, CreateVisitedCityParams, UpdateVisitedCityParams,
    WishlistItem, CreateWishlistParams, UpdateWishlistParams,
    CityNote, CreateCityNoteParams, UpdateCityNoteParams, CityDetail,
};

/// ── VisitedCity CRUD ──

pub fn create_city(db: &Database, id: &str, params: &CreateVisitedCityParams) -> Result<(), String> {
    db.conn()
        .execute(
            "INSERT INTO visited_cities (id, city_name, country, province, lat, lng, visit_date, rating, is_highlighted, color, notes, travel_guide, photos)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                id,
                params.city_name,
                params.country,
                params.province,
                params.lat,
                params.lng,
                params.visit_date,
                params.rating,
                params.is_highlighted as i32,
                params.color,
                params.notes,
                params.travel_guide,
                params.photos,
            ],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn update_city(db: &Database, id: &str, params: &UpdateVisitedCityParams) -> Result<(), String> {
    let mut sets = vec!["updated_at = datetime('now','localtime')".to_string()];
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref v) = params.city_name { sets.push("city_name = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.country { sets.push("country = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.province { sets.push("province = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(v) = params.lat { sets.push("lat = ?".into()); values.push(Box::new(v)); }
    if let Some(v) = params.lng { sets.push("lng = ?".into()); values.push(Box::new(v)); }
    if let Some(ref v) = params.visit_date {
        if v.is_empty() {
            sets.push("visit_date = NULL".into());
        } else {
            sets.push("visit_date = ?".into());
            values.push(Box::new(v.clone()));
        }
    }
    if let Some(v) = params.rating { sets.push("rating = ?".into()); values.push(Box::new(v)); }
    if let Some(v) = params.is_highlighted { sets.push("is_highlighted = ?".into()); values.push(Box::new(v as i32)); }
    if let Some(ref v) = params.color { sets.push("color = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.notes { sets.push("notes = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.travel_guide { sets.push("travel_guide = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.photos { sets.push("photos = ?".into()); values.push(Box::new(v.clone())); }

    if sets.len() == 1 {
        return Ok(());
    }

    let sql = format!("UPDATE visited_cities SET {} WHERE id = ?", sets.join(", "));
    values.push(Box::new(id.to_string()));

    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
    db.conn().execute(&sql, params_refs.as_slice()).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_city(db: &Database, id: &str) -> Result<(), String> {
    db.conn()
        .execute("DELETE FROM city_notes WHERE city_id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    db.conn()
        .execute("DELETE FROM visited_cities WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_all_cities(db: &Database) -> Result<Vec<VisitedCity>, String> {
    let mut stmt = db
        .conn()
        .prepare(
            "SELECT id, city_name, country, province, lat, lng, visit_date, rating, is_highlighted, color, notes, travel_guide, photos, created_at, updated_at
             FROM visited_cities ORDER BY visit_date DESC",
        )
        .map_err(|e| e.to_string())?;

    let cities = stmt
        .query_map([], |row| {
            Ok(VisitedCity {
                id: row.get(0)?,
                city_name: row.get(1)?,
                country: row.get(2)?,
                province: row.get(3)?,
                lat: row.get(4)?,
                lng: row.get(5)?,
                visit_date: row.get(6)?,
                rating: row.get::<_, i32>(7)?,
                is_highlighted: row.get::<_, i32>(8)? != 0,
                color: row.get(9)?,
                notes: row.get(10)?,
                travel_guide: row.get(11)?,
                photos: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(cities)
}

pub fn get_city_by_id(db: &Database, id: &str) -> Result<VisitedCity, String> {
    db.conn()
        .query_row(
            "SELECT id, city_name, country, province, lat, lng, visit_date, rating, is_highlighted, color, notes, travel_guide, photos, created_at, updated_at
             FROM visited_cities WHERE id = ?1",
            params![id],
            |row| {
                Ok(VisitedCity {
                    id: row.get(0)?,
                    city_name: row.get(1)?,
                    country: row.get(2)?,
                    province: row.get(3)?,
                    lat: row.get(4)?,
                    lng: row.get(5)?,
                    visit_date: row.get(6)?,
                    rating: row.get::<_, i32>(7)?,
                    is_highlighted: row.get::<_, i32>(8)? != 0,
                    color: row.get(9)?,
                    notes: row.get(10)?,
                    travel_guide: row.get(11)?,
                    photos: row.get(12)?,
                    created_at: row.get(13)?,
                    updated_at: row.get(14)?,
                })
            },
        )
        .map_err(|e| e.to_string())
}

/// ── CityNote CRUD ──

pub fn create_note(db: &Database, id: &str, params: &CreateCityNoteParams) -> Result<(), String> {
    db.conn()
        .execute(
            "INSERT INTO city_notes (id, city_id, title, content, note_date)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                id,
                params.city_id,
                params.title,
                params.content,
                params.note_date,
            ],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn update_note(db: &Database, id: &str, params: &UpdateCityNoteParams) -> Result<(), String> {
    let mut sets = vec!["updated_at = datetime('now','localtime')".to_string()];
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref v) = params.title { sets.push("title = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.content { sets.push("content = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.note_date {
        if v.is_empty() {
            sets.push("note_date = NULL".into());
        } else {
            sets.push("note_date = ?".into());
            values.push(Box::new(v.clone()));
        }
    }

    if sets.len() == 1 {
        return Ok(());
    }

    let sql = format!("UPDATE city_notes SET {} WHERE id = ?", sets.join(", "));
    values.push(Box::new(id.to_string()));

    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
    db.conn().execute(&sql, params_refs.as_slice()).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_note(db: &Database, id: &str) -> Result<(), String> {
    db.conn()
        .execute("DELETE FROM city_notes WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_notes_by_city(db: &Database, city_id: &str) -> Result<Vec<CityNote>, String> {
    let mut stmt = db
        .conn()
        .prepare(
            "SELECT id, city_id, title, content, note_date, created_at, updated_at
             FROM city_notes WHERE city_id = ?1 ORDER BY note_date DESC",
        )
        .map_err(|e| e.to_string())?;

    let notes = stmt
        .query_map(params![city_id], |row| {
            Ok(CityNote {
                id: row.get(0)?,
                city_id: row.get(1)?,
                title: row.get(2)?,
                content: row.get(3)?,
                note_date: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(notes)
}

/// ── City Detail (city + notes) ──

pub fn get_city_detail(db: &Database, id: &str) -> Result<CityDetail, String> {
    let city = get_city_by_id(db, id)?;
    let notes = get_notes_by_city(db, id)?;
    Ok(CityDetail { city, notes })
}

// ── Travel Wishlist ──

pub fn list_wishlist(db: &Database) -> Result<Vec<WishlistItem>, String> {
    let mut stmt = db.conn().prepare(
        "SELECT id, city_name, country, province, lat, lng, reason, best_season, budget, companions, is_visited, visited_date, created_at, updated_at FROM travel_wishlist ORDER BY country, city_name"
    ).map_err(|e| e.to_string())?;
    let result: Vec<WishlistItem> = stmt.query_map([], |r| Ok(WishlistItem {
        id: r.get(0)?, city_name: r.get(1)?, country: r.get(2)?, province: r.get(3)?,
        lat: r.get(4)?, lng: r.get(5)?, reason: r.get(6)?, best_season: r.get(7)?,
        budget: r.get(8)?, companions: r.get(9)?, is_visited: r.get::<_, i32>(10)? != 0,
        visited_date: r.get(11)?, created_at: r.get(12)?, updated_at: r.get(13)?,
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(result)
}

pub fn create_wishlist(db: &Database, id: &str, params: &CreateWishlistParams) -> Result<(), String> {
    db.conn().execute(
        "INSERT INTO travel_wishlist (id, city_name, country, province, lat, lng, reason, best_season, budget, companions, created_at, updated_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,datetime('now','localtime'),datetime('now','localtime'))",
        params![id, params.city_name, params.country, params.province, params.lat, params.lng, params.reason, params.best_season, params.budget, params.companions],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn update_wishlist(db: &Database, id: &str, params: &UpdateWishlistParams) -> Result<(), String> {
    let mut sets: Vec<String> = vec!["updated_at = datetime('now','localtime')".into()];
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
    if let Some(ref v) = params.city_name { sets.push("city_name = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.country { sets.push("country = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.province { sets.push("province = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(v) = params.lat { sets.push("lat = ?".into()); values.push(Box::new(v)); }
    if let Some(v) = params.lng { sets.push("lng = ?".into()); values.push(Box::new(v)); }
    if let Some(ref v) = params.reason { sets.push("reason = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.best_season { sets.push("best_season = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(v) = params.budget { sets.push("budget = ?".into()); values.push(Box::new(v)); }
    if let Some(ref v) = params.companions { sets.push("companions = ?".into()); values.push(Box::new(v.clone())); }
    if sets.len() == 1 { return Ok(()); }
    let sql = format!("UPDATE travel_wishlist SET {} WHERE id = ?", sets.join(", "));
    values.push(Box::new(id.to_string()));
    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
    db.conn().execute(&sql, params_refs.as_slice()).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_wishlist(db: &Database, id: &str) -> Result<(), String> {
    db.conn().execute("DELETE FROM travel_wishlist WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn mark_wishlist_visited(db: &Database, id: &str, visited_date: &str) -> Result<(), String> {
    db.conn().execute(
        "UPDATE travel_wishlist SET is_visited = 1, visited_date = ?1, updated_at = datetime('now','localtime') WHERE id = ?2",
        params![visited_date, id],
    ).map_err(|e| e.to_string())?;

    // Auto-create a VisitedCity record so it appears on the travel map
    let wishlist = db.conn().query_row(
        "SELECT city_name, country, province, lat, lng FROM travel_wishlist WHERE id = ?1",
        params![id],
        |row| Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, Option<f64>>(3)?,
            row.get::<_, Option<f64>>(4)?,
        )),
    ).map_err(|e| e.to_string())?;

    let city_id = Uuid::new_v4().to_string();
    db.conn().execute(
        "INSERT INTO visited_cities (id, city_name, country, province, lat, lng, visit_date, rating, is_highlighted, color, notes, travel_guide, photos)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 0, 0, '#3B82F6', '', '', '[]')",
        params![city_id, wishlist.0, wishlist.1, wishlist.2, wishlist.3, wishlist.4, visited_date],
    ).map_err(|e| e.to_string())?;

    Ok(())
}
