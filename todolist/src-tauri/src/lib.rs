mod api;
mod commands;
mod db;
mod models;
mod services;
mod utils;

use db::Database;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{Emitter, Manager, WindowEvent};
use tauri::tray::{TrayIconBuilder, MouseButton, MouseButtonState, TrayIconEvent};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

pub struct AppState {
    pub db: Mutex<Database>,
    pub data_dir: PathBuf,
    pub shortcut_bindings: Mutex<HashMap<String, String>>,
}

/// Parse "Ctrl+Shift+M" into (Modifiers, Code).
pub fn parse_shortcut_str(s: &str) -> Option<(Modifiers, Code)> {
    let parts: Vec<&str> = s.trim().split('+').map(|p| p.trim()).collect();
    if parts.is_empty() { return None; }

    let mut modifiers = Modifiers::empty();
    let code_str = parts.last()?.to_uppercase();

    for part in &parts[..parts.len()-1] {
        match part.to_lowercase().as_str() {
            "ctrl" | "control" => modifiers |= Modifiers::CONTROL,
            "shift" => modifiers |= Modifiers::SHIFT,
            "alt" => modifiers |= Modifiers::ALT,
            "meta" | "win" | "super" => modifiers |= Modifiers::META,
            _ => {}
        }
    }

    let code = match code_str.as_str() {
        "A" => Code::KeyA, "B" => Code::KeyB, "C" => Code::KeyC, "D" => Code::KeyD,
        "E" => Code::KeyE, "F" => Code::KeyF, "G" => Code::KeyG, "H" => Code::KeyH,
        "I" => Code::KeyI, "J" => Code::KeyJ, "K" => Code::KeyK, "L" => Code::KeyL,
        "M" => Code::KeyM, "N" => Code::KeyN, "O" => Code::KeyO, "P" => Code::KeyP,
        "Q" => Code::KeyQ, "R" => Code::KeyR, "S" => Code::KeyS, "T" => Code::KeyT,
        "U" => Code::KeyU, "V" => Code::KeyV, "W" => Code::KeyW, "X" => Code::KeyX,
        "Y" => Code::KeyY, "Z" => Code::KeyZ,
        "0" => Code::Digit0, "1" => Code::Digit1, "2" => Code::Digit2,
        "3" => Code::Digit3, "4" => Code::Digit4, "5" => Code::Digit5,
        "6" => Code::Digit6, "7" => Code::Digit7, "8" => Code::Digit8, "9" => Code::Digit9,
        "SPACE" => Code::Space,
        "ESCAPE" | "ESC" => Code::Escape,
        "ENTER" | "RETURN" => Code::Enter,
        "TAB" => Code::Tab,
        "BACKSPACE" => Code::Backspace,
        "DELETE" => Code::Delete,
        "F1" => Code::F1, "F2" => Code::F2, "F3" => Code::F3,
        "F4" => Code::F4, "F5" => Code::F5, "F6" => Code::F6,
        "F7" => Code::F7, "F8" => Code::F8, "F9" => Code::F9,
        "F10" => Code::F10, "F11" => Code::F11, "F12" => Code::F12,
        _ => return None,
    };

    Some((modifiers, code))
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // 优先使用 AppData 目录（安装后的默认路径）
            // 如果旧路径 D:/TODO/sql 已存在则继续使用（开发环境兼容）
            let legacy_dir = std::path::Path::new("D:/TODO/sql");
            let data_dir: PathBuf = if legacy_dir.exists() {
                legacy_dir.to_path_buf()
            } else {
                let app_data = app.path().app_data_dir()
                    .expect("无法获取应用数据目录");
                app_data
            };

            let db_path = data_dir.join("todolist.db");

            if !data_dir.exists() {
                std::fs::create_dir_all(&data_dir)
                    .expect("Failed to create data directory");
            }

            let database =
                Database::new(db_path.to_str().unwrap()).expect("Failed to initialize database");

            // Seed preset packing templates (idempotent)
            crate::services::packing_svc::insert_preset_templates(&database)
                .expect("Failed to seed packing templates");

            // 创建 Tauri AppState
            app.manage(AppState {
                db: Mutex::new(database),
                data_dir: data_dir.clone(),
                shortcut_bindings: Mutex::new(HashMap::new()),
            });

            // 为 HTTP API 打开独立的数据库连接
            let api_db = Database::new(db_path.to_str().unwrap())
                .expect("Failed to open DB for API server");
            let api_state = api::ApiState {
                db: Arc::new(Mutex::new(api_db)),
                data_dir: data_dir.to_str().unwrap_or("").to_string(),
            };
            api::start(api_state);
            let _tray = TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Archive · 存迹")
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // 启动通知调度器（后台线程，每 30 秒检查一次）
            let app_handle = app.handle().clone();
            std::thread::spawn(move || {
                crate::services::notification_svc::run_scheduler(app_handle);
            });

            // 注册全局快捷键（从配置读取，默认值可通过设置修改）
            {
                let state = app.state::<AppState>();
                let db = state.db.lock().unwrap();
                let defaults: Vec<(&str, &str, &str)> = vec![
                    ("memory", "Ctrl+Shift+M", "memory-shortcut-pressed"),
                ];
                let mut bindings_map = HashMap::new();
                for (name, default_binding, event_name) in &defaults {
                    let binding: String = db.conn().query_row(
                        &format!("SELECT value FROM app_config WHERE key='shortcut_{}'", name),
                        [], |row| row.get(0),
                    ).unwrap_or_else(|_| default_binding.to_string());

                    if let Some((modifiers, code)) = parse_shortcut_str(&binding) {
                        let shortcut = Shortcut::new(Some(modifiers), code);
                        let handle = app.handle().clone();
                        let evt = event_name.to_string();
                        app.global_shortcut().on_shortcut(shortcut, move |_app, _sc, event| {
                            if event.state == ShortcutState::Pressed {
                                if let Some(window) = handle.get_webview_window("main") {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                    let _ = window.emit(&evt, ());
                                }
                            }
                        }).ok();
                    }
                    bindings_map.insert(name.to_string(), binding);
                }
                drop(db);
                let mut bindings = state.shortcut_bindings.lock().unwrap();
                *bindings = bindings_map;
            }

            Ok(())
        })
        .on_window_event(|_window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            // 任务命令
            commands::task_cmd::create_task,
            commands::task_cmd::update_task,
            commands::task_cmd::delete_task,
            commands::task_cmd::get_task,
            commands::task_cmd::list_tasks,
            commands::task_cmd::reorder_tasks,
            commands::task_cmd::get_task_library,
            commands::task_cmd::schedule_task,
            commands::task_cmd::list_categories,
            commands::task_cmd::global_search,
            // 每日计划命令
            commands::plan_cmd::get_daily_plan,
            commands::plan_cmd::update_morning_plan,
            commands::plan_cmd::add_task_to_plan,
            commands::plan_cmd::update_plan_task_time,
            commands::plan_cmd::remove_task_from_plan,
            commands::plan_cmd::reorder_plan_tasks,
            commands::plan_cmd::complete_task_in_plan,
            commands::plan_cmd::postpone_task,
            commands::plan_cmd::update_evening_review,
            commands::plan_cmd::import_focus_records,
            // 图表命令
            commands::chart_cmd::get_dashboard_stats,
            commands::chart_cmd::get_weekly_trend,
            commands::chart_cmd::get_category_distribution,
            commands::chart_cmd::get_monthly_heatmap,
            commands::chart_cmd::get_priority_distribution,
            commands::chart_cmd::get_estimate_vs_actual,
            commands::chart_cmd::get_streak_info,
            commands::chart_cmd::get_productivity_data,

            // 系统命令
            commands::system_cmd::init_app,
            commands::system_cmd::get_app_config,
            commands::system_cmd::update_data_path,
            commands::system_cmd::set_export_path,
            commands::system_cmd::get_shortcut_config,
            commands::system_cmd::set_shortcut_config,
            commands::system_cmd::export_backup,
            commands::system_cmd::import_backup,
            commands::system_cmd::toggle_auto_start,
            commands::system_cmd::check_auto_start,
            commands::system_cmd::confirm_close,
            // 课程管理命令
            commands::course_cmd::list_courses,
            commands::course_cmd::create_course,
            commands::course_cmd::delete_course,
            commands::course_cmd::list_assignments,
            commands::course_cmd::create_assignment,
            commands::course_cmd::update_assignment,
            commands::course_cmd::delete_assignment,
            // 通知命令
            commands::notification_cmd::get_notification_config,
            commands::notification_cmd::update_notification_config,
            commands::notification_cmd::send_test_notification,
            commands::notification_cmd::send_timeline_reminder_notification,
            // 周报命令
            commands::report_cmd::generate_weekly_report,
            commands::report_cmd::export_weekly_report_markdown,
            // 时间线任务关系命令
            commands::task_relationship_cmd::create_task_relationship,
            commands::task_relationship_cmd::delete_task_relationship,
            commands::task_relationship_cmd::list_task_relationships,
            // 全局标签命令
            commands::tag_cmd::create_tag,
            commands::tag_cmd::delete_tag,
            commands::tag_cmd::list_tags,
            commands::tag_cmd::add_tag_to_entity,
            commands::tag_cmd::remove_tag_from_entity,
            commands::tag_cmd::get_tags_for_entity,
            commands::tag_cmd::get_entities_by_tag,
            commands::tag_cmd::create_entity_link,
            commands::tag_cmd::delete_entity_link,
            commands::tag_cmd::get_backlinks,
            // 论文库命令
            commands::paper_cmd::create_paper,
            commands::paper_cmd::update_paper,
            commands::paper_cmd::delete_paper,
            commands::paper_cmd::get_paper,
            commands::paper_cmd::list_papers,
            // 实验追踪命令
            commands::experiment_cmd::create_experiment,
            commands::experiment_cmd::update_experiment,
            commands::experiment_cmd::delete_experiment,
            commands::experiment_cmd::get_experiment,
            commands::experiment_cmd::list_experiments,
            // Obsidian Vault 集成命令
            commands::vault_cmd::set_vault_path,
            commands::vault_cmd::get_vault_config,
            commands::vault_cmd::sync_vault_tags,
            commands::vault_cmd::find_related_notes,
            commands::vault_cmd::scan_vault_notes,
            commands::vault_cmd::read_vault_note,
            commands::vault_cmd::update_tag_color,
            commands::vault_cmd::generate_daily_note,
            commands::vault_cmd::capture_todos_from_vault,
            commands::vault_cmd::import_captured_todos,
            commands::vault_cmd::settle_task_to_note,
            commands::vault_cmd::sync_task_to_obsidian_note,
            commands::vault_cmd::full_bidirectional_sync,
            commands::vault_cmd::generate_calendar_note,
            commands::vault_cmd::sync_all_plans_to_calendar,
            // 知识图谱命令
            commands::knowledge_graph_cmd::build_knowledge_graph,
            commands::knowledge_graph_cmd::get_task_knowledge_context,
            // 倒数日命令
            commands::countdown_cmd::create_countdown_event,
            commands::countdown_cmd::update_countdown_event,
            commands::countdown_cmd::delete_countdown_event,
            commands::countdown_cmd::get_all_countdown_events,
            commands::countdown_cmd::get_dashboard_countdown_events,
            // 人生事件命令
            commands::life_event_cmd::create_life_event,
            commands::life_event_cmd::update_life_event,
            commands::life_event_cmd::delete_life_event,
            commands::life_event_cmd::get_all_life_events,
            commands::life_event_cmd::get_life_event,
            commands::life_event_cmd::create_life_event_link,
            commands::life_event_cmd::delete_life_event_link,
            commands::life_event_cmd::get_life_event_links,
            commands::life_event_cmd::get_life_event_stats,

            // 旅行地图命令
            commands::travel_cmd::create_visited_city,
            commands::travel_cmd::update_visited_city,
            commands::travel_cmd::delete_visited_city,
            commands::travel_cmd::get_all_visited_cities,
            commands::travel_cmd::get_city_detail,
            commands::travel_cmd::add_city_note,
            commands::travel_cmd::update_city_note,
            commands::travel_cmd::delete_city_note,
            commands::travel_cmd::get_city_notes,

            // 出行清单命令
            commands::packing_cmd::list_user_lists,
            commands::packing_cmd::list_templates,
            commands::packing_cmd::create_packing_list,
            commands::packing_cmd::update_packing_list,
            commands::packing_cmd::delete_packing_list,
            commands::packing_cmd::duplicate_packing_list,
            commands::packing_cmd::get_packing_list_detail,
            commands::packing_cmd::get_packing_items,
            commands::packing_cmd::add_packing_item,
            commands::packing_cmd::update_packing_item,
            commands::packing_cmd::toggle_item_packed,
            commands::packing_cmd::delete_packing_item,
            commands::packing_cmd::reorder_packing_items,
            commands::packing_cmd::reset_all_packing_items,
            commands::packing_cmd::complete_all_packing_items,

            // 物品管理命令
            commands::asset_cmd::create_asset,
            commands::asset_cmd::update_asset,
            commands::asset_cmd::delete_asset,
            commands::asset_cmd::get_asset,
            commands::asset_cmd::list_assets,
            commands::asset_cmd::get_asset_stats,
            commands::asset_cmd::get_expiring_warranties,

            // 用户配置命令
            commands::user_profile_cmd::get_user_profile,
            commands::user_profile_cmd::set_user_profile,

            // 会话命令
            commands::session_cmd::start_app_session,
            commands::session_cmd::end_app_session,
            commands::session_cmd::get_app_usage_heatmap,

            // 记账命令
            commands::finance_cmd::list_transaction_categories,
            commands::finance_cmd::create_account,
            commands::finance_cmd::update_account,
            commands::finance_cmd::delete_account,
            commands::finance_cmd::list_accounts,
            commands::finance_cmd::create_transaction,
            commands::finance_cmd::update_transaction,
            commands::finance_cmd::delete_transaction,
            commands::finance_cmd::list_transactions,
            commands::finance_cmd::get_transaction,
            commands::finance_cmd::get_finance_stats,
            commands::finance_cmd::get_monthly_chart,
            commands::finance_cmd::get_category_stats,
            commands::finance_cmd::get_daily_heatmap,
            commands::finance_cmd::get_net_worth_trend,

            // 一日三餐命令
            commands::meal_cmd::get_daily_meal,
            commands::meal_cmd::save_daily_meal,
            commands::meal_cmd::delete_daily_meal,
            commands::meal_cmd::list_meal_dates,

            // 记忆速记命令
            commands::memory_cmd::create_memory,
            commands::memory_cmd::update_memory,
            commands::memory_cmd::delete_memory,
            commands::memory_cmd::get_memories_by_date,
            commands::memory_cmd::list_memories,

            // 科研情绪日记命令
            commands::emotion_cmd::get_daily_emotion,
            commands::emotion_cmd::save_daily_emotion,
            commands::emotion_cmd::get_emotion_heatmap,

            // 成就勋章命令
            commands::badge_cmd::list_badges,
            commands::badge_cmd::check_badges,
            commands::badge_cmd::get_new_badge_count,
            commands::badge_cmd::mark_badges_notified,

            // 赛博复盘会命令
            commands::review_cmd::get_review_config,
            commands::review_cmd::update_review_config,
            commands::review_cmd::get_daily_review,

            // 导师沟通日志命令
            commands::advisor_cmd::create_advisor_meeting,
            commands::advisor_cmd::update_advisor_meeting,
            commands::advisor_cmd::delete_advisor_meeting,
            commands::advisor_cmd::get_advisor_meeting,
            commands::advisor_cmd::list_advisor_meetings,
            commands::advisor_cmd::get_advisor_config,
            commands::advisor_cmd::update_advisor_config,
            commands::advisor_cmd::get_next_meeting,
            commands::advisor_cmd::batch_create_tasks_from_meeting,

            // 人脉图谱命令
            commands::contact_cmd::create_contact,
            commands::contact_cmd::update_contact,
            commands::contact_cmd::delete_contact,
            commands::contact_cmd::get_contact,
            commands::contact_cmd::list_contacts,
            commands::contact_cmd::create_contact_link,
            commands::contact_cmd::delete_contact_link,
            commands::contact_cmd::get_contact_links,
            commands::contact_cmd::get_contact_graph,
            commands::contact_cmd::create_contact_relation,
            commands::contact_cmd::delete_contact_relation,
            commands::contact_cmd::set_family_link,

            // 读研全景命令
            commands::grad_cmd::create_milestone,
            commands::grad_cmd::update_milestone,
            commands::grad_cmd::delete_milestone,
            commands::grad_cmd::list_milestones,
            commands::grad_cmd::generate_semester_review,
            commands::grad_cmd::list_semester_reviews,

            // 旅行心愿单命令
            commands::travel_cmd::list_wishlist,
            commands::travel_cmd::create_wishlist,
            commands::travel_cmd::update_wishlist,
            commands::travel_cmd::delete_wishlist,
            commands::travel_cmd::mark_wishlist_visited,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Archive · 存迹 application");
}
