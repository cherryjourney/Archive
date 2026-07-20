-- ======================================================
-- TodoList+ v1 初始数据库迁移
-- ======================================================

-- ====== 任务主表 ======
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    priority INTEGER DEFAULT 2,
    estimated_minutes INTEGER,
    actual_minutes INTEGER,
    due_date TEXT,
    scheduled_date TEXT,
    is_recurring INTEGER DEFAULT 0,
    recurring_rule TEXT,
    parent_task_id TEXT,
    sort_order INTEGER DEFAULT 0,
    is_mit INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    completed_at TEXT,
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);

-- ====== 分类表 ======
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#4A90D9',
    icon TEXT DEFAULT '📋',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- ====== 任务-分类关联 ======
CREATE TABLE IF NOT EXISTS task_categories (
    task_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    PRIMARY KEY (task_id, category_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- ====== 标签表 ======
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_tag_id TEXT,
    color TEXT DEFAULT '#8B8B8B',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (parent_tag_id) REFERENCES tags(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tags_parent ON tags(parent_tag_id);

-- ====== 任务-标签关联 ======
CREATE TABLE IF NOT EXISTS task_tags (
    task_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (task_id, tag_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- ====== 每日计划表 ======
CREATE TABLE IF NOT EXISTS daily_plans (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    morning_plan_md TEXT DEFAULT '',
    evening_review_md TEXT DEFAULT '',
    efficiency_rating INTEGER,
    mood_rating INTEGER,
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- ====== 每日计划-任务关联 ======
CREATE TABLE IF NOT EXISTS daily_plan_tasks (
    daily_plan_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_mit INTEGER DEFAULT 0,
    start_time TEXT,  -- HH:MM format, e.g. "09:00"
    end_time TEXT,    -- HH:MM format, calculated from estimated_minutes
    added_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    PRIMARY KEY (daily_plan_id, task_id),
    FOREIGN KEY (daily_plan_id) REFERENCES daily_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- ====== 文件夹 ======
CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_folder_id TEXT,
    sort_order INTEGER DEFAULT 0,
    icon TEXT DEFAULT '📁',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (parent_folder_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_folder_id);

-- ====== 知识库文档 ======
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    folder_id TEXT,
    document_type TEXT NOT NULL DEFAULT 'note',
    is_pinned INTEGER DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_updated ON documents(updated_at DESC);

-- ====== 文献元数据 ======
CREATE TABLE IF NOT EXISTS literature_meta (
    document_id TEXT PRIMARY KEY,
    authors TEXT DEFAULT '[]',
    year INTEGER,
    journal TEXT,
    conference TEXT,
    doi TEXT,
    abstract TEXT DEFAULT '',
    keywords TEXT DEFAULT '[]',
    citation_count INTEGER,
    source_url TEXT,
    bibtex TEXT DEFAULT '',
    my_understanding TEXT DEFAULT '',
    key_points TEXT DEFAULT '',
    reading_status TEXT DEFAULT 'unread',
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_literature_doi ON literature_meta(doi);
CREATE INDEX IF NOT EXISTS idx_literature_year ON literature_meta(year);

-- ====== 文档-标签关联 ======
CREATE TABLE IF NOT EXISTS document_tags (
    document_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (document_id, tag_id),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- ====== 双向链接 ======
CREATE TABLE IF NOT EXISTS document_links (
    id TEXT PRIMARY KEY,
    source_document_id TEXT NOT NULL,
    target_document_id TEXT NOT NULL,
    link_context TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (source_document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (target_document_id) REFERENCES documents(id) ON DELETE CASCADE,
    UNIQUE(source_document_id, target_document_id)
);

-- ====== 全文搜索 FTS5 ======
CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
    title,
    content,
    tokenize='unicode61'
);

-- ====== 应用配置 ======
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- ====== 每日完成统计视图 ======
DROP VIEW IF EXISTS v_daily_stats;
CREATE VIEW v_daily_stats AS
SELECT
    dp.date,
    COUNT(dpt.task_id) AS total_tasks,
    SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
    SUM(t.estimated_minutes) AS total_estimated,
    SUM(CASE WHEN t.status = 'completed' THEN t.actual_minutes ELSE 0 END) AS total_actual,
    dp.efficiency_rating,
    dp.mood_rating
FROM daily_plans dp
LEFT JOIN daily_plan_tasks dpt ON dp.id = dpt.daily_plan_id
LEFT JOIN tasks t ON dpt.task_id = t.id
GROUP BY dp.date;

-- ====== 初始配置 ======
INSERT OR IGNORE INTO app_config (key, value) VALUES ('data_path', 'F:/sql/todolist-plus');
INSERT OR IGNORE INTO app_config (key, value) VALUES ('theme', 'light');
INSERT OR IGNORE INTO app_config (key, value) VALUES ('app_version', '1.0.0');
