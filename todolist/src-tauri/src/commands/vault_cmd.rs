use crate::models::obsidian_sync::{BatchSyncResult, CapturedTodo};
use crate::models::vault::*;
use crate::services::vault_svc;
use crate::AppState;
use tauri::Emitter;

#[tauri::command]
pub fn set_vault_path(
    state: tauri::State<AppState>,
    app: tauri::AppHandle,
    vault_path: String,
) -> Result<VaultConfig, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let data_dir = state.data_dir.to_string_lossy().to_string();

    // Validate vault path
    if !vault_path.is_empty() {
        let obsidian_dir = std::path::Path::new(&vault_path).join(".obsidian");
        if !obsidian_dir.exists() {
            return Err("所选文件夹不是有效的 Obsidian Vault（未找到 .obsidian 目录）".into());
        }
    }

    // Store vault_path in app_config
    db.conn()
        .execute(
            "INSERT OR REPLACE INTO app_config (key, value) VALUES ('vault_path', ?1)",
            rusqlite::params![vault_path],
        )
        .map_err(|e| e.to_string())?;

    let is_configured = !vault_path.is_empty();

    if is_configured {
        // Initial tag sync
        match vault_svc::sync_tags_from_vault(&db, &vault_path) {
            Ok(result) => {
                let _ = app.emit("vault-tags-changed", &result);
            }
            Err(e) => {
                eprintln!("[vault] Initial sync error: {}", e);
            }
        }

        // Start file watcher (tag sync)
        let db_path = format!("{}/todolist.db", data_dir);
        vault_svc::start_vault_watcher(vault_path.clone(), db_path.clone(), app.clone());

        // Start sync watcher (bidirectional task status)
        vault_svc::start_sync_watcher(vault_path.clone(), db_path, app.clone());
    }

    Ok(VaultConfig {
        vault_path,
        is_configured,
    })
}

#[tauri::command]
pub fn get_vault_config(state: tauri::State<AppState>) -> Result<VaultConfig, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let vault_path: String = db
        .conn()
        .query_row(
            "SELECT value FROM app_config WHERE key='vault_path'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_default();

    Ok(VaultConfig {
        is_configured: !vault_path.is_empty(),
        vault_path,
    })
}

#[tauri::command]
pub fn sync_vault_tags(
    state: tauri::State<AppState>,
    app: tauri::AppHandle,
) -> Result<SyncResult, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let vault_path: String = db
        .conn()
        .query_row(
            "SELECT value FROM app_config WHERE key='vault_path'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_default();

    if vault_path.is_empty() {
        return Err("Vault 路径未配置".into());
    }

    let result = vault_svc::sync_tags_from_vault(&db, &vault_path)?;
    let _ = app.emit("vault-tags-changed", &result);
    Ok(result)
}

#[tauri::command]
pub fn find_related_notes(
    state: tauri::State<AppState>,
    tags: Vec<String>,
) -> Result<Vec<VaultNote>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let vault_path: String = db
        .conn()
        .query_row(
            "SELECT value FROM app_config WHERE key='vault_path'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_default();

    if vault_path.is_empty() {
        return Ok(Vec::new());
    }

    vault_svc::find_related_notes(&vault_path, &tags)
}

#[tauri::command]
pub fn scan_vault_notes(
    state: tauri::State<AppState>,
) -> Result<Vec<VaultNote>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let vault_path: String = db
        .conn()
        .query_row(
            "SELECT value FROM app_config WHERE key='vault_path'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_default();

    if vault_path.is_empty() {
        return Ok(Vec::new());
    }

    vault_svc::scan_vault_notes(&vault_path)
}

#[tauri::command]
pub fn read_vault_note(
    state: tauri::State<AppState>,
    note_path: String,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let vault_path: String = db
        .conn()
        .query_row(
            "SELECT value FROM app_config WHERE key='vault_path'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_default();

    if vault_path.is_empty() {
        return Err("Vault 路径未配置".into());
    }

    vault_svc::read_note_content(&vault_path, &note_path)
}

#[tauri::command]
pub fn update_tag_color(
    state: tauri::State<AppState>,
    tag_id: String,
    color: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.conn()
        .execute(
            "UPDATE tags SET color = ?1 WHERE id = ?2",
            rusqlite::params![color, tag_id],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ══════════════════════════════════════════════════════════════════
// Feature 1: Daily Plan → Obsidian Daily Note
// ══════════════════════════════════════════════════════════════════

#[tauri::command]
pub fn generate_daily_note(
    state: tauri::State<AppState>,
    date: String,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let vault_path: String = db
        .conn()
        .query_row(
            "SELECT value FROM app_config WHERE key='vault_path'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_default();

    if vault_path.is_empty() {
        return Err("Vault 路径未配置，请先到设置中连接 Obsidian Vault".into());
    }

    vault_svc::generate_and_write_daily_note(&db, &vault_path, &date)
}

// ══════════════════════════════════════════════════════════════════
// Feature 4: Think → Act → Settle Pipeline
// ══════════════════════════════════════════════════════════════════

#[tauri::command]
pub fn capture_todos_from_vault(
    state: tauri::State<AppState>,
) -> Result<Vec<CapturedTodo>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let vault_path: String = db
        .conn()
        .query_row(
            "SELECT value FROM app_config WHERE key='vault_path'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_default();

    if vault_path.is_empty() {
        return Err("Vault 路径未配置".into());
    }

    vault_svc::capture_todos_from_vault(&vault_path, &db)
}

#[tauri::command]
pub fn import_captured_todos(
    state: tauri::State<AppState>,
    indices: Vec<usize>,
    todos: Vec<CapturedTodo>,
) -> Result<usize, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let vault_path: String = db
        .conn()
        .query_row(
            "SELECT value FROM app_config WHERE key='vault_path'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_default();

    if vault_path.is_empty() {
        return Err("Vault 路径未配置".into());
    }

    vault_svc::import_captured_todos(&db, &vault_path, &indices, &todos)
}

#[tauri::command]
pub fn settle_task_to_note(
    state: tauri::State<AppState>,
    task_id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let vault_path: String = db
        .conn()
        .query_row(
            "SELECT value FROM app_config WHERE key='vault_path'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_default();

    if vault_path.is_empty() {
        return Err("Vault 路径未配置".into());
    }

    vault_svc::settle_task_to_note(&db, &vault_path, &task_id)
}

// ══════════════════════════════════════════════════════════════════
// Feature 2: Bidirectional Sync
// ══════════════════════════════════════════════════════════════════

#[tauri::command]
pub fn sync_task_to_obsidian_note(
    state: tauri::State<AppState>,
    task_id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let vault_path: String = db
        .conn()
        .query_row(
            "SELECT value FROM app_config WHERE key='vault_path'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_default();

    if vault_path.is_empty() {
        return Err("Vault 路径未配置".into());
    }

    vault_svc::sync_task_to_obsidian_note(&db, &vault_path, &task_id)
}

#[tauri::command]
pub fn full_bidirectional_sync(
    state: tauri::State<AppState>,
    app: tauri::AppHandle,
    date: Option<String>,
) -> Result<BatchSyncResult, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let vault_path: String = db
        .conn()
        .query_row(
            "SELECT value FROM app_config WHERE key='vault_path'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_default();

    if vault_path.is_empty() {
        return Err("Vault 路径未配置".into());
    }

    let sync_date = date.unwrap_or_else(|| crate::utils::date::today_str());
    let result = vault_svc::full_bidirectional_sync(&db, &vault_path, &sync_date)?;

    if result.synced_from_obsidian > 0 || result.conflicts > 0 {
        let _ = app.emit("vault-sync-changed", &result);
    }

    Ok(result)
}

// ══════════════════════════════════════════════════════════════════
// Feature 5: Calendar Skin
// ══════════════════════════════════════════════════════════════════

#[tauri::command]
pub fn generate_calendar_note(
    state: tauri::State<AppState>,
    date: String,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let vault_path: String = db
        .conn()
        .query_row(
            "SELECT value FROM app_config WHERE key='vault_path'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_default();

    if vault_path.is_empty() {
        return Err("Vault 路径未配置".into());
    }

    vault_svc::generate_calendar_note(&db, &vault_path, &date)
}

#[tauri::command]
pub fn sync_all_plans_to_calendar(
    state: tauri::State<AppState>,
) -> Result<usize, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let vault_path: String = db
        .conn()
        .query_row(
            "SELECT value FROM app_config WHERE key='vault_path'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_default();

    if vault_path.is_empty() {
        return Err("Vault 路径未配置".into());
    }

    vault_svc::sync_all_plans_to_calendar(&db, &vault_path)
}
