-- ======================================================
-- TodoList+ V4.0: 标签系统 + 双链 + 论文 + OKR目标 + 实验追踪
-- ======================================================

-- ====== 全局标签 ======
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#4C6EF5',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS entity_tags (
    tag_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    PRIMARY KEY (tag_id, entity_type, entity_id),
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_entity_tags_entity ON entity_tags(entity_type, entity_id);

-- 默认标签
INSERT OR IGNORE INTO tags (id, name, color) VALUES
    ('tag-transformer', 'Transformer', '#4C6EF5'),
    ('tag-nlp', 'NLP', '#7950F2'),
    ('tag-cv', 'CV', '#F76707'),
    ('tag-rl', 'RL', '#E03131'),
    ('tag-gnn', 'GNN', '#12B886'),
    ('tag-baseline', 'Baseline', '#868E96'),
    ('tag-ablation', '消融实验', '#F59F00'),
    ('tag-urgent', '紧急', '#E03131'),
    ('tag-meeting', '组会汇报', '#4C6EF5');

-- ====== 实体双链 ======
CREATE TABLE IF NOT EXISTS entity_links (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    link_text TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    UNIQUE(source_type, source_id, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS idx_entity_links_target ON entity_links(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_entity_links_source ON entity_links(source_type, source_id);

-- ====== 论文库 ======
CREATE TABLE IF NOT EXISTS papers (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    authors TEXT DEFAULT '',
    year INTEGER,
    venue TEXT DEFAULT '',
    doi TEXT DEFAULT '',
    arxiv_id TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'to_read',
    contribution TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    rating INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_papers_status ON papers(status);
CREATE INDEX IF NOT EXISTS idx_papers_year ON papers(year);

-- ====== OKR 目标 ======
CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    start_date TEXT,
    end_date TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS key_results (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL,
    title TEXT NOT NULL,
    target_value REAL DEFAULT 100,
    current_value REAL DEFAULT 0,
    unit TEXT DEFAULT '%',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_kr_goal ON key_results(goal_id);

-- ====== 实验追踪 ======
CREATE TABLE IF NOT EXISTS experiments (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    model TEXT DEFAULT '',
    dataset TEXT DEFAULT '',
    hyperparams TEXT DEFAULT '{}',
    metrics TEXT DEFAULT '{}',
    notes TEXT DEFAULT '',
    is_baseline INTEGER DEFAULT 0,
    project_id TEXT,
    paper_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_experiments_model ON experiments(model);
CREATE INDEX IF NOT EXISTS idx_experiments_paper ON experiments(paper_id);
