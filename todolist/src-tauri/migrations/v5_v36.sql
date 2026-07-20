-- V3.6: 通知提醒 + 番茄钟 + 周报

-- 通知配置
CREATE TABLE notification_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    daily_reminder_enabled INTEGER DEFAULT 1,
    daily_reminder_time TEXT DEFAULT '08:00',
    deadline_reminder_enabled INTEGER DEFAULT 1,
    deadline_30min_enabled INTEGER DEFAULT 1,
    deadline_1hour_enabled INTEGER DEFAULT 1,
    deadline_1day_enabled INTEGER DEFAULT 1,
    task_reminder_enabled INTEGER DEFAULT 1,
    task_reminder_advance_minutes INTEGER DEFAULT 5,
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- 通知发送日志（防重复）
CREATE TABLE notification_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    notification_type TEXT NOT NULL,
    reference_id TEXT,
    sent_at TEXT NOT NULL,
    date TEXT NOT NULL
);

-- 番茄钟会话
CREATE TABLE pomodoro_sessions (
    id TEXT PRIMARY KEY,
    task_id TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT,
    duration_seconds INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- 番茄钟配置
CREATE TABLE pomodoro_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- 周报订阅（暂留空，后续扩展）
CREATE TABLE report_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL DEFAULT 'weekly',
    enabled INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- 初始化默认配置
INSERT OR IGNORE INTO notification_config (id) VALUES (1);
INSERT OR IGNORE INTO pomodoro_config (id) VALUES (1);
