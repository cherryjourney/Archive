use rusqlite::params;
use crate::db::Database;
use crate::models::contact::*;

pub fn create(db: &Database, id_str: &str, params: &CreateContactParams) -> Result<(), String> {
    db.conn().execute("INSERT INTO contacts (id,name,contact_info,relationship_type,custom_tags,met_date,important_dates,common_experiences,notes,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,datetime('now','localtime'),datetime('now','localtime'))",
        params![id_str, params.name, params.contact_info, params.relationship_type, params.custom_tags, params.met_date, params.important_dates, params.common_experiences, params.notes]).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn update(db: &Database, id_str: &str, params: &UpdateContactParams) -> Result<(), String> {
    let mut sets: Vec<String> = vec!["updated_at = datetime('now','localtime')".into()];
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
    if let Some(ref v) = params.name { sets.push("name = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.contact_info { sets.push("contact_info = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.relationship_type { sets.push("relationship_type = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.custom_tags { sets.push("custom_tags = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.met_date { if v.is_empty() { sets.push("met_date = NULL".into()); } else { sets.push("met_date = ?".into()); values.push(Box::new(v.clone())); } }
    if let Some(ref v) = params.important_dates { sets.push("important_dates = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.common_experiences { sets.push("common_experiences = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.notes { sets.push("notes = ?".into()); values.push(Box::new(v.clone())); }
    if sets.len() == 1 { return Ok(()); }
    let sql = format!("UPDATE contacts SET {} WHERE id = ?", sets.join(", "));
    values.push(Box::new(id_str.to_string()));
    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
    db.conn().execute(&sql, params_refs.as_slice()).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete(db: &Database, id_str: &str) -> Result<(), String> {
    db.conn().execute("DELETE FROM contacts WHERE id = ?1", params![id_str]).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get(db: &Database, id_str: &str) -> Result<Contact, String> {
    db.conn().query_row("SELECT id,name,contact_info,relationship_type,custom_tags,met_date,important_dates,common_experiences,notes,created_at,updated_at FROM contacts WHERE id=?1", params![id_str], |r| Ok(Contact {
        id: r.get(0)?, name: r.get(1)?, contact_info: r.get(2)?, relationship_type: r.get(3)?, custom_tags: r.get(4)?, met_date: r.get(5)?, important_dates: r.get(6)?, common_experiences: r.get(7)?, notes: r.get(8)?, created_at: r.get(9)?, updated_at: r.get(10)?,
    })).map_err(|e| e.to_string())
}

pub fn list_all(db: &Database) -> Result<Vec<Contact>, String> {
    let mut stmt = db.conn().prepare("SELECT id,name,contact_info,relationship_type,custom_tags,met_date,important_dates,common_experiences,notes,created_at,updated_at FROM contacts ORDER BY name ASC").map_err(|e| e.to_string())?;
    let result: Vec<Contact> = stmt.query_map([], |r| Ok(Contact {
        id: r.get(0)?, name: r.get(1)?, contact_info: r.get(2)?, relationship_type: r.get(3)?, custom_tags: r.get(4)?, met_date: r.get(5)?, important_dates: r.get(6)?, common_experiences: r.get(7)?, notes: r.get(8)?, created_at: r.get(9)?, updated_at: r.get(10)?,
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(result)
}

pub fn create_link(db: &Database, id_str: &str, params: &CreateContactLinkParams) -> Result<(), String> {
    db.conn().execute("INSERT INTO contact_links (id,contact_id,entity_type,entity_id,label,created_at) VALUES (?1,?2,?3,?4,?5,datetime('now','localtime'))",
        params![id_str, params.contact_id, params.entity_type, params.entity_id, params.label]).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_link(db: &Database, id_str: &str) -> Result<(), String> {
    db.conn().execute("DELETE FROM contact_links WHERE id = ?1", params![id_str]).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_links_for_contact(db: &Database, contact_id: &str) -> Result<Vec<ContactLink>, String> {
    let mut stmt = db.conn().prepare("SELECT id,contact_id,entity_type,entity_id,label,created_at FROM contact_links WHERE contact_id=?1").map_err(|e| e.to_string())?;
    let result: Vec<ContactLink> = stmt.query_map(params![contact_id], |r| Ok(ContactLink { id: r.get(0)?, contact_id: r.get(1)?, entity_type: r.get(2)?, entity_id: r.get(3)?, label: r.get(4)?, created_at: r.get(5)? })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(result)
}

pub fn get_graph(db: &Database) -> Result<ContactGraphData, String> {
    let contacts = list_all(db)?;

    // Nodes: contacts + "我" node
    let mut nodes = vec![GraphNode {
        id: "__me__".into(),
        name: "我".into(),
        relationship_type: "self".into(),
        custom_tags: "[]".into(),
    }];
    for c in &contacts {
        nodes.push(GraphNode {
            id: c.id.clone(), name: c.name.clone(),
            relationship_type: c.relationship_type.clone(),
            custom_tags: c.custom_tags.clone(),
        });
    }

    let mut edges: Vec<GraphEdge> = Vec::new();
    let mut seen = std::collections::HashSet::new();

    // 1. Direct edges: entity_type='contact' links (person-to-person)
    {
        let mut stmt = db.conn().prepare(
            "SELECT contact_id, entity_id, label FROM contact_links WHERE entity_type = 'contact'"
        ).map_err(|e| e.to_string())?;
        let direct_links: Vec<(String, String, String)> = stmt
            .query_map([], |r| Ok((r.get(0)?, r.get(1)?, r.get::<_, String>(2).unwrap_or_default())))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        for (source, target, label) in &direct_links {
            let key = if source < target {
                (source.clone(), target.clone())
            } else {
                (target.clone(), source.clone())
            };
            if !seen.contains(&key) && source != target {
                seen.insert(key.clone());
                edges.push(GraphEdge {
                    source: key.0,
                    target: key.1,
                    label: if label.is_empty() { "认识".into() } else { label.clone() },
                    edge_type: "direct".into(),
                });
            }
        }
    }

    // 2. "Me" edges: explicit links to "我" (entity_type='__me__')
    {
        let mut stmt = db.conn().prepare(
            "SELECT contact_id, label FROM contact_links WHERE entity_type = '__me__'"
        ).map_err(|e| e.to_string())?;
        let me_links: Vec<(String, String)> = stmt
            .query_map([], |r| Ok((r.get(0)?, r.get::<_, String>(1).unwrap_or_default())))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        for (contact_id, label) in &me_links {
            edges.push(GraphEdge {
                source: "__me__".into(),
                target: contact_id.clone(),
                label: if label.is_empty() { String::new() } else { label.clone() },
                edge_type: "default".into(),
            });
        }
    }

    // 3. Shared-entity edges: contacts linked to same entity
    {
        let mut stmt = db.conn().prepare(
            "SELECT contact_id, entity_type, entity_id FROM contact_links WHERE entity_type != 'contact' AND entity_type != '__me__'"
        ).map_err(|e| e.to_string())?;
        let links: Vec<(String, String, String)> = stmt
            .query_map([], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        for i in 0..links.len() {
            for j in i + 1..links.len() {
                if links[i].1 == links[j].1   // same entity_type
                    && links[i].2 == links[j].2 // same entity_id
                    && links[i].0 != links[j].0
                {
                    let key = if links[i].0 < links[j].0 {
                        (links[i].0.clone(), links[j].0.clone())
                    } else {
                        (links[j].0.clone(), links[i].0.clone())
                    };
                    if !seen.contains(&key) {
                        seen.insert(key.clone());
                        edges.push(GraphEdge {
                            source: key.0,
                            target: key.1,
                            label: links[i].1.clone(),
                            edge_type: "shared".into(),
                        });
                    }
                }
            }
        }
    }

    // 4. Family tree links: father, mother, spouse
    {
        let mut stmt = db.conn().prepare(
            "SELECT contact_id, entity_type, entity_id FROM contact_links WHERE entity_type IN ('father','mother','spouse')"
        ).map_err(|e| e.to_string())?;
        let fam_links: Vec<(String, String, String)> = stmt
            .query_map([], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        for (child_id, rel_type, parent_id) in &fam_links {
            let key = if child_id < parent_id {
                (child_id.clone(), parent_id.clone())
            } else {
                (parent_id.clone(), child_id.clone())
            };
            // Avoid duplicate edges (spouse links are bidirectional)
            if !seen.contains(&key) {
                seen.insert(key.clone());
                edges.push(GraphEdge {
                    source: child_id.clone(),
                    target: parent_id.clone(),
                    label: rel_type.clone(),
                    edge_type: "family".into(),
                });
            }
        }
    }

    Ok(ContactGraphData { nodes, edges })
}

pub fn create_relation(db: &Database, params: &CreateContactRelationParams) -> Result<(), String> {
    if params.target_id == "__me__" || params.source_id == "__me__" {
        // Link to "me": single record (not bidirectional)
        let contact_id = if params.source_id == "__me__" { &params.target_id } else { &params.source_id };
        let id = crate::utils::id::generate_id();
        db.conn().execute(
            "INSERT INTO contact_links (id, contact_id, entity_type, entity_id, label) VALUES (?1, ?2, '__me__', ?3, ?4)",
            params![id, contact_id, contact_id, params.label],
        ).map_err(|e| e.to_string())?;
    } else {
        // Bidirectional: A→B and B→A
        let id1 = crate::utils::id::generate_id();
        let id2 = crate::utils::id::generate_id();
        db.conn().execute(
            "INSERT INTO contact_links (id, contact_id, entity_type, entity_id, label) VALUES (?1, ?2, 'contact', ?3, ?4)",
            params![id1, params.source_id, params.target_id, params.label],
        ).map_err(|e| e.to_string())?;
        db.conn().execute(
            "INSERT INTO contact_links (id, contact_id, entity_type, entity_id, label) VALUES (?1, ?2, 'contact', ?3, ?4)",
            params![id2, params.target_id, params.source_id, params.label],
        ).map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn delete_relation(db: &Database, params: &DeleteContactRelationParams) -> Result<(), String> {
    if params.target_id == "__me__" || params.source_id == "__me__" {
        let contact_id = if params.source_id == "__me__" { &params.target_id } else { &params.source_id };
        db.conn().execute(
            "DELETE FROM contact_links WHERE entity_type='__me__' AND contact_id=?1",
            params![contact_id],
        ).map_err(|e| e.to_string())?;
    } else {
        db.conn().execute(
            "DELETE FROM contact_links WHERE entity_type='contact' AND ((contact_id=?1 AND entity_id=?2) OR (contact_id=?2 AND entity_id=?1))",
            params![params.source_id, params.target_id],
        ).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Set a family tree link: father, mother, or spouse.
/// Deletes any existing link of that type for `contact_id`, then creates a new one.
/// For spouse, creates bidirectional links.
pub fn set_family_link(db: &Database, contact_id: &str, relation_type: &str, target_id: Option<&str>) -> Result<(), String> {
    // Delete existing links of this type for this contact
    db.conn().execute(
        "DELETE FROM contact_links WHERE contact_id=?1 AND entity_type=?2",
        params![contact_id, relation_type],
    ).map_err(|e| e.to_string())?;

    // If spouse, also delete reverse link from old spouse
    if relation_type == "spouse" {
        if let Ok(old) = db.conn().query_row(
            "SELECT entity_id FROM contact_links WHERE contact_id=?1 AND entity_type='spouse'",
            params![contact_id], |r| r.get::<_, String>(0),
        ) {
            // old spouse link was just deleted above; delete its reverse too
            db.conn().execute(
                "DELETE FROM contact_links WHERE contact_id=?1 AND entity_type='spouse' AND entity_id=?2",
                params![old, contact_id],
            ).map_err(|e| e.to_string())?;
        }
    }

    if let Some(target) = target_id {
        if target.is_empty() { return Ok(()); }
        let id = crate::utils::id::generate_id();
        db.conn().execute(
            "INSERT INTO contact_links (id, contact_id, entity_type, entity_id, label) VALUES (?1, ?2, ?3, ?4, '')",
            params![id, contact_id, relation_type, target],
        ).map_err(|e| e.to_string())?;

        // For spouse, also create reverse
        if relation_type == "spouse" {
            let id2 = crate::utils::id::generate_id();
            db.conn().execute(
                "INSERT INTO contact_links (id, contact_id, entity_type, entity_id, label) VALUES (?1, ?2, 'spouse', ?3, '')",
                params![id2, target, contact_id],
            ).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}
