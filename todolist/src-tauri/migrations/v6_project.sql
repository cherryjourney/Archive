-- ======================================================
-- TodoList+ V3.7: 项目管理 — 时间线 + 看板 + 任务连线
-- ======================================================

-- ====== 扩展 tasks 表 ======
ALTER TABLE tasks ADD COLUMN start_date TEXT;
ALTER TABLE tasks ADD COLUMN end_date TEXT;
ALTER TABLE tasks ADD COLUMN progress INTEGER DEFAULT 0;

-- ====== 项目表 ======
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    color TEXT DEFAULT '#6c5ce7',
    status TEXT DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- ====== 项目-任务关联 ======
CREATE TABLE IF NOT EXISTS project_tasks (
    project_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    added_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    PRIMARY KEY (project_id, task_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON project_tasks(project_id);

-- ====== 任务关系/连线 ======
CREATE TABLE IF NOT EXISTS task_relationships (
    id TEXT PRIMARY KEY,
    source_task_id TEXT NOT NULL,
    target_task_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL DEFAULT 'depends_on',
    is_blocking INTEGER DEFAULT 0,
    label TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (source_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (target_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE(source_task_id, target_task_id)
);

CREATE INDEX IF NOT EXISTS idx_relationships_source ON task_relationships(source_task_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON task_relationships(target_task_id);

-- ====== 看板列定义 ======
CREATE TABLE IF NOT EXISTS kanban_columns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status_value TEXT NOT NULL,
    color TEXT DEFAULT '#6c5ce7',
    sort_order INTEGER DEFAULT 0,
    is_default INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- ====== 初始化默认看板列 ======
INSERT OR IGNORE INTO kanban_columns (id, name, status_value, color, sort_order, is_default) VALUES
    ('col-pending',      '📥 待办',   'pending',      '#868E96', 0, 1),
    ('col-in-progress',  '🚀 进行中', 'in_progress',  '#4C6EF5', 1, 1),
    ('col-completed',    '✅ 已完成', 'completed',    '#10B981', 2, 1);
