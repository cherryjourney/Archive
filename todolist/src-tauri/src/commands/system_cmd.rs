use std::collections::HashMap;

use tauri::{Emitter, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use crate::services::backup_svc;
use crate::AppState;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AppConfig {
    pub data_path: String,
    pub theme: String,
    pub app_version: String,
    pub vault_path: String,
    pub export_path: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ShortcutEntry {
    pub name: String,
    pub binding: String,
    pub description: String,
}

#[tauri::command]
pub fn init_app(state: tauri::State<AppState>, data_path: String) -> Result<AppConfig, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let data_dir = state.data_dir.to_string_lossy().to_string();

    // 更新数据路径
    db.conn()
        .execute(
            "INSERT OR REPLACE INTO app_config (key, value) VALUES ('data_path', ?1)",
            rusqlite::params![data_path],
        )
        .map_err(|e| e.to_string())?;

    get_app_config_inner(&db, &data_dir)
}

#[tauri::command]
pub fn get_app_config(state: tauri::State<AppState>) -> Result<AppConfig, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let data_dir = state.data_dir.to_string_lossy().to_string();
    get_app_config_inner(&db, &data_dir)
}

fn get_app_config_inner(db: &crate::db::Database, default_data_dir: &str) -> Result<AppConfig, String> {
    let data_path: String = db
        .conn()
        .query_row(
            "SELECT value FROM app_config WHERE key='data_path'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| default_data_dir.to_string());

    let theme: String = db
        .conn()
        .query_row(
            "SELECT value FROM app_config WHERE key='theme'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| "light".to_string());

    let app_version: String = db
        .conn()
        .query_row(
            "SELECT value FROM app_config WHERE key='app_version'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| "1.0.0".to_string());

    let vault_path: String = db
        .conn()
        .query_row(
            "SELECT value FROM app_config WHERE key='vault_path'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_default();

    let export_path: String = db
        .conn()
        .query_row(
            "SELECT value FROM app_config WHERE key='export_path'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_default();

    Ok(AppConfig {
        data_path,
        theme,
        app_version,
        vault_path,
        export_path,
    })
}

#[tauri::command]
pub fn update_data_path(
    state: tauri::State<AppState>,
    new_path: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.conn()
        .execute(
            "INSERT OR REPLACE INTO app_config (key, value) VALUES ('data_path', ?1)",
            rusqlite::params![new_path],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Set the daily note export path (for non-Obsidian users).
#[tauri::command]
pub fn set_export_path(
    state: tauri::State<AppState>,
    path: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.conn()
        .execute(
            "INSERT OR REPLACE INTO app_config (key, value) VALUES ('export_path', ?1)",
            rusqlite::params![path],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Get the effective export path: vault_path if set, otherwise export_path, otherwise empty.
pub fn get_export_path(db: &crate::db::Database) -> String {
    let vault_path: String = db.conn().query_row(
        "SELECT value FROM app_config WHERE key='vault_path'",
        [], |row| row.get(0),
    ).unwrap_or_default();

    if !vault_path.is_empty() {
        return vault_path;
    }

    db.conn().query_row(
        "SELECT value FROM app_config WHERE key='export_path'",
        [], |row| row.get(0),
    ).unwrap_or_default()
}

/// Get all shortcut configurations.
#[tauri::command]
pub fn get_shortcut_config(
    state: tauri::State<AppState>,
) -> Result<Vec<ShortcutEntry>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let defaults: Vec<ShortcutEntry> = vec![
        ShortcutEntry { name: "memory".into(), binding: "Ctrl+Shift+M".into(), description: "快速记录记忆".into() },
    ];

    let mut result = Vec::new();
    for mut entry in defaults {
        let stored: Option<String> = db.conn().query_row(
            "SELECT value FROM app_config WHERE key=?1",
            rusqlite::params![format!("shortcut_{}", entry.name)],
            |row| row.get(0),
        ).ok();
        if let Some(binding) = stored {
            entry.binding = binding;
        }
        result.push(entry);
    }
    Ok(result)
}

/// Set a shortcut binding and re-register all global shortcuts.
#[tauri::command]
pub fn set_shortcut_config(
    state: tauri::State<AppState>,
    app: tauri::AppHandle,
    name: String,
    binding: String,
) -> Result<(), String> {
    // Validate the new binding
    crate::parse_shortcut_str(&binding)
        .ok_or_else(|| format!("无效的快捷键格式: {}", binding))?;

    // Save to app_config
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        db.conn().execute(
            "INSERT OR REPLACE INTO app_config (key, value) VALUES (?1, ?2)",
            rusqlite::params![format!("shortcut_{}", name), binding],
        ).map_err(|e| e.to_string())?;
    }

    // Get all shortcut bindings from config
    let defaults: Vec<(&str, &str)> = vec![
        ("memory", "Ctrl+Shift+M"),
    ];

    let mut new_bindings: HashMap<String, String> = HashMap::new();
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        for (sname, default_binding) in &defaults {
            let stored: String = db.conn().query_row(
                &format!("SELECT value FROM app_config WHERE key='shortcut_{}'", sname),
                [], |row| row.get(0),
            ).unwrap_or_else(|_| default_binding.to_string());
            new_bindings.insert(sname.to_string(), stored);
        }
    }

    // Unregister all and re-register
    let _ = app.global_shortcut().unregister_all();

    for (sname, sbinding) in &new_bindings {
        if let Some((modifiers, code)) = crate::parse_shortcut_str(sbinding) {
            let shortcut = Shortcut::new(Some(modifiers), code);
            let handle = app.clone();
            let event_name = format!("{}-shortcut-pressed", sname);
            app.global_shortcut().on_shortcut(shortcut, move |_app, _sc, event| {
                if event.state == ShortcutState::Pressed {
                    if let Some(window) = handle.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                        let _ = window.emit(&event_name, ());
                    }
                }
            }).ok();
        }
    }

    // Update in-memory state
    {
        let mut bindings = state.shortcut_bindings.lock().map_err(|e| e.to_string())?;
        *bindings = new_bindings;
    }

    Ok(())
}

#[tauri::command]
pub fn export_backup(state: tauri::State<AppState>, target_path: String) -> Result<String, String> {
    let data_dir = state.data_dir.to_string_lossy().to_string();
    let db_path = format!("{}/todolist.db", data_dir);
    backup_svc::export_backup(&db_path, &target_path, &data_dir)
}

#[tauri::command]
pub fn import_backup(state: tauri::State<AppState>, source_path: String) -> Result<(), String> {
    let data_dir = state.data_dir.to_string_lossy().to_string();
    let db_path = format!("{}/todolist.db", data_dir);
    backup_svc::import_backup(&source_path, &db_path, &data_dir)
}

#[tauri::command]
pub fn toggle_auto_start(enable: bool) -> Result<bool, String> {
    use std::fs;

    let startup_dir = if let Ok(dir) = std::env::var("APPDATA") {
        format!("{}\\Microsoft\\Windows\\Start Menu\\Programs\\Startup", dir)
    } else {
        return Err("无法获取启动目录".into());
    };

    let shortcut_path = format!("{}\\ArchiveCunji.bat", startup_dir);

    if enable {
        // 获取当前可执行文件路径（安装后指向 exe，开发时指向 target/debug）
        let exe_path = std::env::current_exe()
            .map_err(|e| format!("无法获取程序路径: {}", e))?;
        let exe_dir = exe_path.parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();

        // 创建 .bat 启动脚本指向实际 exe
        let bat_content = format!(
            "@echo off\r\ncd /d \"{}\"\r\nstart \"\" \"{}\"\r\n",
            exe_dir,
            exe_path.to_string_lossy()
        );
        fs::write(&shortcut_path, bat_content)
            .map_err(|e| format!("创建自启失败: {}", e))?;
    } else {
        if std::path::Path::new(&shortcut_path).exists() {
            fs::remove_file(&shortcut_path)
                .map_err(|e| format!("取消自启失败: {}", e))?;
        }
    }

    Ok(enable)
}

#[tauri::command]
pub fn confirm_close(app: tauri::AppHandle, action: String) -> Result<(), String> {
    use tauri::Manager;
    if action == "quit" {
        app.exit(0);
    }
    if action == "tray" {
        let window = app.get_webview_window("main")
            .ok_or("无法获取主窗口")?;
        window.hide().map_err(|e| e.to_string())?;
        return Ok(());
    }
    Err(format!("未知操作: {}", action))
}

#[tauri::command]
pub fn check_auto_start() -> Result<bool, String> {
    let startup_dir = if let Ok(dir) = std::env::var("APPDATA") {
        format!("{}\\Microsoft\\Windows\\Start Menu\\Programs\\Startup", dir)
    } else {
        return Ok(false);
    };
    Ok(std::path::Path::new(&format!("{}\\ArchiveCunji.bat", startup_dir)).exists())
}
