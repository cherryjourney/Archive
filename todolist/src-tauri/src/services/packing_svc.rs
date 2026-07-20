use rusqlite::params;

use crate::db::Database;
use crate::models::packing::{
    PackingList, CreatePackingListParams, UpdatePackingListParams,
    PackingItem, CreatePackingItemParams, UpdatePackingItemParams, ReorderItemsParams,
    PackingListDetail,
};

/// ── PackingList CRUD ──

pub fn create_list(db: &Database, id: &str, params: &CreatePackingListParams) -> Result<(), String> {
    db.conn()
        .execute(
            "INSERT INTO packing_lists (id, title, destination, departure_date, return_date, notes, is_template)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                id,
                params.title,
                params.destination,
                params.departure_date,
                params.return_date,
                params.notes,
                params.is_template as i32,
            ],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn update_list(db: &Database, id: &str, params: &UpdatePackingListParams) -> Result<(), String> {
    let mut sets = vec!["updated_at = datetime('now','localtime')".to_string()];
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref v) = params.title { sets.push("title = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.destination { sets.push("destination = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.departure_date {
        if v.is_empty() {
            sets.push("departure_date = NULL".into());
        } else {
            sets.push("departure_date = ?".into());
            values.push(Box::new(v.clone()));
        }
    }
    if let Some(ref v) = params.return_date {
        if v.is_empty() {
            sets.push("return_date = NULL".into());
        } else {
            sets.push("return_date = ?".into());
            values.push(Box::new(v.clone()));
        }
    }
    if let Some(ref v) = params.notes { sets.push("notes = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(v) = params.is_template { sets.push("is_template = ?".into()); values.push(Box::new(v as i32)); }

    if sets.len() == 1 {
        return Ok(());
    }

    let sql = format!("UPDATE packing_lists SET {} WHERE id = ?", sets.join(", "));
    values.push(Box::new(id.to_string()));

    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
    db.conn().execute(&sql, params_refs.as_slice()).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_list(db: &Database, id: &str) -> Result<(), String> {
    db.conn()
        .execute("DELETE FROM packing_items WHERE list_id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    db.conn()
        .execute("DELETE FROM packing_lists WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_all_lists(db: &Database, is_template: bool) -> Result<Vec<PackingList>, String> {
    let sql = format!(
        "SELECT id, title, destination, departure_date, return_date, notes, is_template, created_at, updated_at
         FROM packing_lists WHERE is_template = {} ORDER BY created_at DESC",
        is_template as i32
    );

    let mut stmt = db.conn().prepare(&sql).map_err(|e| e.to_string())?;

    let lists = stmt
        .query_map([], |row| {
            Ok(PackingList {
                id: row.get(0)?,
                title: row.get(1)?,
                destination: row.get(2)?,
                departure_date: row.get(3)?,
                return_date: row.get(4)?,
                notes: row.get(5)?,
                is_template: row.get::<_, i32>(6)? != 0,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(lists)
}

pub fn get_list_by_id(db: &Database, id: &str) -> Result<PackingList, String> {
    db.conn()
        .query_row(
            "SELECT id, title, destination, departure_date, return_date, notes, is_template, created_at, updated_at
             FROM packing_lists WHERE id = ?1",
            params![id],
            |row| {
                Ok(PackingList {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    destination: row.get(2)?,
                    departure_date: row.get(3)?,
                    return_date: row.get(4)?,
                    notes: row.get(5)?,
                    is_template: row.get::<_, i32>(6)? != 0,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                })
            },
        )
        .map_err(|e| e.to_string())
}

/// Copy a template to create a new list (copies all items)
pub fn duplicate_list(db: &Database, template_id: &str, new_id: &str, new_title: &str) -> Result<(), String> {
    db.conn()
        .execute(
            "INSERT INTO packing_lists (id, title, destination, departure_date, return_date, notes, is_template)
             SELECT ?2, ?3, destination, departure_date, return_date, notes, 0
             FROM packing_lists WHERE id = ?1",
            params![template_id, new_id, new_title],
        )
        .map_err(|e| e.to_string())?;

    db.conn()
        .execute(
            "INSERT INTO packing_items (id, list_id, name, category, quantity, is_packed, sort_order, notes)
             SELECT lower(hex(randomblob(16))), ?2, name, category, quantity, 0, sort_order, notes
             FROM packing_items WHERE list_id = ?1",
            params![template_id, new_id],
        )
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// ── PackingItem CRUD ──

pub fn get_items(db: &Database, list_id: &str) -> Result<Vec<PackingItem>, String> {
    let mut stmt = db
        .conn()
        .prepare(
            "SELECT id, list_id, name, category, quantity, is_packed, sort_order, notes, created_at
             FROM packing_items WHERE list_id = ?1 ORDER BY sort_order ASC, created_at ASC",
        )
        .map_err(|e| e.to_string())?;

    let items = stmt
        .query_map(params![list_id], |row| {
            Ok(PackingItem {
                id: row.get(0)?,
                list_id: row.get(1)?,
                name: row.get(2)?,
                category: row.get(3)?,
                quantity: row.get::<_, i32>(4)?,
                is_packed: row.get::<_, i32>(5)? != 0,
                sort_order: row.get::<_, i32>(6)?,
                notes: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(items)
}

pub fn add_item(db: &Database, id: &str, params: &CreatePackingItemParams) -> Result<(), String> {
    let max_order: i32 = db
        .conn()
        .query_row(
            "SELECT COALESCE(MAX(sort_order), -1) FROM packing_items WHERE list_id = ?1",
            params![params.list_id],
            |row| row.get(0),
        )
        .unwrap_or(-1);

    db.conn()
        .execute(
            "INSERT INTO packing_items (id, list_id, name, category, quantity, is_packed, sort_order, notes)
             VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6, ?7)",
            params![
                id,
                params.list_id,
                params.name,
                params.category,
                params.quantity,
                max_order + 1,
                params.notes,
            ],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn update_item(db: &Database, id: &str, params: &UpdatePackingItemParams) -> Result<(), String> {
    let mut sets: Vec<String> = Vec::new();
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref v) = params.name { sets.push("name = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.category { sets.push("category = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(v) = params.quantity { sets.push("quantity = ?".into()); values.push(Box::new(v)); }
    if let Some(ref v) = params.notes { sets.push("notes = ?".into()); values.push(Box::new(v.clone())); }

    if sets.is_empty() {
        return Ok(());
    }

    let sql = format!("UPDATE packing_items SET {} WHERE id = ?", sets.join(", "));
    values.push(Box::new(id.to_string()));

    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
    db.conn().execute(&sql, params_refs.as_slice()).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn toggle_item_packed(db: &Database, id: &str) -> Result<bool, String> {
    db.conn()
        .execute(
            "UPDATE packing_items SET is_packed = CASE WHEN is_packed = 0 THEN 1 ELSE 0 END WHERE id = ?1",
            params![id],
        )
        .map_err(|e| e.to_string())?;

    let new_state: bool = db
        .conn()
        .query_row(
            "SELECT is_packed FROM packing_items WHERE id = ?1",
            params![id],
            |row| row.get::<_, i32>(0).map(|v| v != 0),
        )
        .map_err(|e| e.to_string())?;

    Ok(new_state)
}

pub fn delete_item(db: &Database, id: &str) -> Result<(), String> {
    db.conn()
        .execute("DELETE FROM packing_items WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn reorder_items(db: &Database, params: &ReorderItemsParams) -> Result<(), String> {
    for entry in &params.items {
        db.conn()
            .execute(
                "UPDATE packing_items SET sort_order = ?1 WHERE id = ?2",
                params![entry.sort_order, entry.id],
            )
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn reset_all_items(db: &Database, list_id: &str) -> Result<(), String> {
    db.conn()
        .execute(
            "UPDATE packing_items SET is_packed = 0 WHERE list_id = ?1",
            params![list_id],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn complete_all_items(db: &Database, list_id: &str) -> Result<(), String> {
    db.conn()
        .execute(
            "UPDATE packing_items SET is_packed = 1 WHERE list_id = ?1",
            params![list_id],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// ── List Detail (list + items) ──

pub fn get_list_detail(db: &Database, id: &str) -> Result<PackingListDetail, String> {
    let list = get_list_by_id(db, id)?;
    let items = get_items(db, id)?;
    Ok(PackingListDetail { list, items })
}

/// ── Preset Templates ──

/// Seed a single template if it doesn't already exist (checked by fixed ID)
fn seed_template(
    db: &Database,
    id: &str,
    title: &str,
    notes: &str,
    items: Vec<(&str, &str, i32)>,
) -> Result<(), String> {
    let exists: bool = db
        .conn()
        .query_row(
            "SELECT COUNT(*) FROM packing_lists WHERE id = ?1",
            params![id],
            |row| row.get::<_, i32>(0),
        )
        .map(|c| c > 0)
        .unwrap_or(false);

    if exists {
        return Ok(());
    }

    create_list(db, id, &CreatePackingListParams {
        title: title.into(),
        destination: String::new(),
        departure_date: None,
        return_date: None,
        notes: notes.into(),
        is_template: true,
    })?;

    for (i, (name, cat, qty)) in items.iter().enumerate() {
        let item_id = format!("{}-item-{}", id, i);
        db.conn().execute(
            "INSERT INTO packing_items (id, list_id, name, category, quantity, is_packed, sort_order, notes)
             VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6, '')",
            params![item_id, id, name, cat, qty, i as i32],
        ).map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn insert_preset_templates(db: &Database) -> Result<(), String> {
    // Template 1: 短途出行（1-3天）
    seed_template(db, "tpl-short-trip", "短途出行（1-3天）", "基础衣物 + 洗漱 + 证件", vec![
        ("手机", "electronics", 1),
        ("充电器", "electronics", 1),
        ("充电宝", "electronics", 1),
        ("T恤", "clothing", 2),
        ("内衣", "clothing", 2),
        ("外套", "clothing", 1),
        ("牙刷/牙膏", "toiletries", 1),
        ("洗面奶", "toiletries", 1),
        ("身份证", "documents", 1),
        ("钥匙", "other", 1),
        ("水杯", "other", 1),
        ("雨伞", "other", 1),
    ])?;

    // Template 2: 长途旅行（5-10天）
    seed_template(db, "tpl-long-trip", "长途旅行（5-10天）", "全套衣物 + 电子设备 + 药品 + 证件", vec![
        ("手机", "electronics", 1),
        ("充电器", "electronics", 1),
        ("充电宝", "electronics", 2),
        ("耳机", "electronics", 1),
        ("相机", "electronics", 1),
        ("T恤", "clothing", 4),
        ("内衣", "clothing", 4),
        ("长裤", "clothing", 2),
        ("外套", "clothing", 1),
        ("睡衣", "clothing", 1),
        ("运动鞋", "clothing", 1),
        ("拖鞋", "clothing", 1),
        ("牙刷/牙膏", "toiletries", 1),
        ("洗面奶", "toiletries", 1),
        ("防晒霜", "toiletries", 1),
        ("毛巾", "toiletries", 1),
        ("洗发水/沐浴露", "toiletries", 1),
        ("感冒药", "medicine", 1),
        ("创可贴", "medicine", 1),
        ("晕车药", "medicine", 1),
        ("身份证", "documents", 1),
        ("银行卡", "documents", 1),
        ("雨伞", "other", 1),
        ("零食", "other", 1),
    ])?;

    // Template 3: 出差办公
    seed_template(db, "tpl-biz-trip", "出差办公", "电脑/平板 + 正装 + 证件", vec![
        ("笔记本电脑", "electronics", 1),
        ("电源适配器", "electronics", 1),
        ("手机", "electronics", 1),
        ("充电宝", "electronics", 1),
        ("U盘/移动硬盘", "electronics", 1),
        ("正装", "clothing", 1),
        ("衬衫", "clothing", 2),
        ("领带", "clothing", 1),
        ("皮鞋", "clothing", 1),
        ("牙刷/牙膏", "toiletries", 1),
        ("身份证", "documents", 1),
        ("笔记本/笔", "documents", 1),
        ("合同/文件", "documents", 1),
        ("雨伞", "other", 1),
    ])?;

    // Template 4: 海边度假
    seed_template(db, "tpl-beach", "海边度假", "泳装 + 防晒 + 拖鞋，适合海岛/滨海旅行", vec![
        ("手机", "electronics", 1),
        ("充电器", "electronics", 1),
        ("防水手机袋", "electronics", 1),
        ("泳衣", "clothing", 2),
        ("泳裤", "clothing", 2),
        ("防晒衣", "clothing", 1),
        ("沙滩裤", "clothing", 2),
        ("拖鞋", "clothing", 1),
        ("T恤", "clothing", 3),
        ("遮阳帽", "clothing", 1),
        ("墨镜", "clothing", 1),
        ("防晒霜（高倍）", "toiletries", 1),
        ("晒后修复", "toiletries", 1),
        ("洗发水/沐浴露", "toiletries", 1),
        ("毛巾", "toiletries", 2),
        ("晕船药", "medicine", 1),
        ("创可贴", "medicine", 1),
        ("身份证", "documents", 1),
        ("银行卡", "documents", 1),
        ("防水包", "other", 1),
        ("零食", "other", 1),
    ])?;

    // Template 5: 冬季滑雪
    seed_template(db, "tpl-ski", "冬季滑雪", "保暖衣物 + 滑雪装备 + 防冻", vec![
        ("手机", "electronics", 1),
        ("充电宝", "electronics", 2),
        ("滑雪服", "clothing", 1),
        ("滑雪裤", "clothing", 1),
        ("保暖内衣", "clothing", 2),
        ("厚羽绒服", "clothing", 1),
        ("毛衣", "clothing", 2),
        ("防水手套", "clothing", 2),
        ("围巾", "clothing", 1),
        ("保暖帽", "clothing", 1),
        ("雪地靴", "clothing", 1),
        ("厚袜子", "clothing", 4),
        ("润肤霜", "toiletries", 1),
        ("润唇膏", "toiletries", 1),
        ("防晒霜", "toiletries", 1),
        ("感冒药", "medicine", 1),
        ("创可贴", "medicine", 1),
        ("跌打喷雾", "medicine", 1),
        ("身份证", "documents", 1),
        ("银行卡", "documents", 1),
        ("保温杯", "other", 1),
        ("暖宝宝", "other", 4),
    ])?;

    // Template 6: 户外露营
    seed_template(db, "tpl-camping", "户外露营", "帐篷 + 炊具 + 野外生存装备", vec![
        ("手机", "electronics", 1),
        ("充电宝（大容量）", "electronics", 2),
        ("手电筒/头灯", "electronics", 1),
        ("蓝牙音箱", "electronics", 1),
        ("速干T恤", "clothing", 3),
        ("冲锋衣", "clothing", 1),
        ("长裤", "clothing", 2),
        ("登山鞋", "clothing", 1),
        ("遮阳帽", "clothing", 1),
        ("防晒霜", "toiletries", 1),
        ("驱蚊液", "toiletries", 1),
        ("湿巾", "toiletries", 1),
        ("创可贴", "medicine", 1),
        ("碘伏棉签", "medicine", 1),
        ("止泻药", "medicine", 1),
        ("身份证", "documents", 1),
        ("帐篷", "other", 1),
        ("睡袋", "other", 1),
        ("防潮垫", "other", 1),
        ("炊具套装", "other", 1),
        ("打火机/火柴", "other", 1),
        ("折叠椅", "other", 1),
        ("垃圾袋", "other", 3),
    ])?;

    // Template 7: 出国旅行
    seed_template(db, "tpl-abroad", "出国旅行", "护照签证 + 转换插头 + 外币 + 翻译工具", vec![
        ("手机", "electronics", 1),
        ("充电器", "electronics", 1),
        ("充电宝", "electronics", 1),
        ("转换插头", "electronics", 1),
        ("耳机", "electronics", 1),
        ("相机", "electronics", 1),
        ("T恤", "clothing", 4),
        ("内衣", "clothing", 4),
        ("长裤", "clothing", 2),
        ("外套", "clothing", 1),
        ("睡衣", "clothing", 1),
        ("运动鞋", "clothing", 1),
        ("拖鞋", "clothing", 1),
        ("牙刷/牙膏", "toiletries", 1),
        ("洗面奶", "toiletries", 1),
        ("防晒霜", "toiletries", 1),
        ("毛巾", "toiletries", 1),
        ("感冒药", "medicine", 1),
        ("创可贴", "medicine", 1),
        ("止泻药", "medicine", 1),
        ("护照", "documents", 1),
        ("签证（如需）", "documents", 1),
        ("身份证", "documents", 1),
        ("机票/酒店确认单", "documents", 1),
        ("旅行保险单", "documents", 1),
        ("外币现金", "other", 1),
        ("信用卡", "other", 1),
        ("翻译APP下载", "other", 1),
        ("雨伞", "other", 1),
    ])?;

    // Template 8: 探亲访友
    seed_template(db, "tpl-visit", "探亲访友", "礼物 + 换洗衣物 + 家乡特产", vec![
        ("手机", "electronics", 1),
        ("充电器", "electronics", 1),
        ("充电宝", "electronics", 1),
        ("T恤", "clothing", 2),
        ("内衣", "clothing", 2),
        ("外套", "clothing", 1),
        ("牙刷/牙膏", "toiletries", 1),
        ("洗面奶", "toiletries", 1),
        ("身份证", "documents", 1),
        ("钥匙", "other", 1),
        ("礼物", "other", 2),
        ("特产/伴手礼", "other", 1),
        ("零食/水果", "other", 1),
        ("雨伞", "other", 1),
    ])?;

    Ok(())
}
