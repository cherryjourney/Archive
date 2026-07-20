use rusqlite::params;
use crate::db::Database;
use crate::models::tags::*;
use crate::utils::date;
use crate::utils::id;

// ── Tags ────────────────────────────────────────

pub fn create_tag(db: &Database, params: CreateTagParams) -> Result<Tag, String> {
    let id = id::generate_id();
    let now = date::now_str();
    db.conn().execute(
        "INSERT INTO tags (id, name, color, source, created_at) VALUES (?1, ?2, ?3, 'manual', ?4)",
        params![id, params.name, params.color, now],
    ).map_err(|e| e.to_string())?;
    Ok(Tag { id, name: params.name, color: params.color, created_at: now, source: "manual".into(), vault_path: String::new() })
}

pub fn delete_tag(db: &Database, tag_id: &str) -> Result<(), String> {
    db.conn().execute("DELETE FROM tags WHERE id=?1", params![tag_id]).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn list_tags(db: &Database) -> Result<Vec<Tag>, String> {
    let mut stmt = db.conn().prepare(
        "SELECT id, name, color, created_at, COALESCE(source, 'manual'), COALESCE(vault_path, '') FROM tags ORDER BY name"
    ).map_err(|e| e.to_string())?;
    let tags = stmt.query_map([], |row| Ok(Tag {
        id: row.get(0)?, name: row.get(1)?, color: row.get(2)?, created_at: row.get(3)?,
        source: row.get(4)?, vault_path: row.get(5)?,
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(tags)
}

pub fn add_tag_to_entity(db: &Database, tag_id: &str, entity_type: &str, entity_id: &str) -> Result<(), String> {
    db.conn().execute(
        "INSERT OR IGNORE INTO entity_tags (tag_id, entity_type, entity_id) VALUES (?1, ?2, ?3)",
        params![tag_id, entity_type, entity_id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn remove_tag_from_entity(db: &Database, tag_id: &str, entity_type: &str, entity_id: &str) -> Result<(), String> {
    db.conn().execute(
        "DELETE FROM entity_tags WHERE tag_id=?1 AND entity_type=?2 AND entity_id=?3",
        params![tag_id, entity_type, entity_id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_tags_for_entity(db: &Database, entity_type: &str, entity_id: &str) -> Result<Vec<Tag>, String> {
    let mut stmt = db.conn().prepare(
        "SELECT t.id, t.name, t.color, t.created_at, COALESCE(t.source, 'manual'), COALESCE(t.vault_path, '') FROM tags t
         JOIN entity_tags et ON t.id = et.tag_id
         WHERE et.entity_type=?1 AND et.entity_id=?2 ORDER BY t.name"
    ).map_err(|e| e.to_string())?;
    let tags = stmt.query_map(params![entity_type, entity_id], |row| Ok(Tag {
        id: row.get(0)?, name: row.get(1)?, color: row.get(2)?, created_at: row.get(3)?,
        source: row.get(4)?, vault_path: row.get(5)?,
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(tags)
}

pub fn get_entities_by_tag(db: &Database, tag_id: &str) -> Result<Vec<(String, String)>, String> {
    let mut stmt = db.conn().prepare(
        "SELECT entity_type, entity_id FROM entity_tags WHERE tag_id=?1"
    ).map_err(|e| e.to_string())?;
    let entities = stmt.query_map(params![tag_id], |row| Ok((
        row.get::<_, String>(0)?, row.get::<_, String>(1)?,
    ))).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(entities)
}

// ── Entity Links (Backlinks) ────────────────────

pub fn create_entity_link(db: &Database, params: CreateEntityLinkParams) -> Result<EntityLink, String> {
    let id = id::generate_id();
    let now = date::now_str();
    db.conn().execute(
        "INSERT OR IGNORE INTO entity_links (id, source_type, source_id, target_type, target_id, link_text, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![id, params.source_type, params.source_id, params.target_type, params.target_id, params.link_text, now],
    ).map_err(|e| e.to_string())?;
    Ok(EntityLink { id, source_type: params.source_type, source_id: params.source_id,
        target_type: params.target_type, target_id: params.target_id, link_text: params.link_text, created_at: now })
}

pub fn delete_entity_link(db: &Database, link_id: &str) -> Result<(), String> {
    db.conn().execute("DELETE FROM entity_links WHERE id=?1", params![link_id]).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_backlinks(db: &Database, target_type: &str, target_id: &str) -> Result<Vec<EntityLink>, String> {
    let mut stmt = db.conn().prepare(
        "SELECT id, source_type, source_id, target_type, target_id, link_text, created_at
         FROM entity_links WHERE target_type=?1 AND target_id=?2 ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;
    let links = stmt.query_map(params![target_type, target_id], |row| Ok(EntityLink {
        id: row.get(0)?, source_type: row.get(1)?, source_id: row.get(2)?,
        target_type: row.get(3)?, target_id: row.get(4)?, link_text: row.get(5)?, created_at: row.get(6)?,
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(links)
}

pub fn get_forward_links(db: &Database, source_type: &str, source_id: &str) -> Result<Vec<EntityLink>, String> {
    let mut stmt = db.conn().prepare(
        "SELECT id, source_type, source_id, target_type, target_id, link_text, created_at
         FROM entity_links WHERE source_type=?1 AND source_id=?2 ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;
    let links = stmt.query_map(params![source_type, source_id], |row| Ok(EntityLink {
        id: row.get(0)?, source_type: row.get(1)?, source_id: row.get(2)?,
        target_type: row.get(3)?, target_id: row.get(4)?, link_text: row.get(5)?, created_at: row.get(6)?,
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(links)
}
