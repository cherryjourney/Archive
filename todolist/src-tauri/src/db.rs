use rusqlite::{Connection, Result as SqliteResult};

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(path: &str) -> SqliteResult<Self> {
        let conn = Connection::open(path)?;

        // 启用 WAL 模式提升并发性能
        conn.execute_batch("PRAGMA journal_mode=WAL;")?;
        conn.execute_batch("PRAGMA foreign_keys=ON;")?;

        let db = Database { conn };
        db.run_migrations()?;
        Ok(db)
    }

    pub fn conn(&self) -> &Connection {
        &self.conn
    }

    fn run_migrations(&self) -> SqliteResult<()> {
        // 创建迁移记录表
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS migrations (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                description TEXT NOT NULL
            )",
            [],
        )?;

        let current_version: i32 = self
            .conn
            .query_row(
                "SELECT COALESCE(MAX(version), 0) FROM migrations",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        if current_version < 1 {
            self.migrate_v1()?;
        }
        if current_version < 2 {
            self.migrate_v2()?;
        }
        if current_version < 3 {
            self.migrate_v3()?;
        }
        if current_version < 4 {
            self.migrate_v4()?;
        }
        if current_version < 5 {
            self.migrate_v5()?;
        }
        if current_version < 6 {
            self.migrate_v6()?;
        }
        if current_version < 7 {
            self.migrate_v7()?;
        }
        if current_version < 8 {
            self.migrate_v8()?;
        }
        if current_version < 9 {
            self.migrate_v9()?;
        }
        if current_version < 10 {
            self.migrate_v10()?;
        }
        if current_version < 11 {
            self.migrate_v11()?;
        }
        if current_version < 12 {
            self.migrate_v12()?;
        }
        if current_version < 13 {
            self.migrate_v13()?;
        }
        if current_version < 14 {
            self.migrate_v14()?;
        }
        if current_version < 15 {
            self.migrate_v15()?;
        }
        if current_version < 16 {
            self.migrate_v16()?;
        }
        if current_version < 17 {
            self.migrate_v17()?;
        }
        if current_version < 18 {
            self.migrate_v18()?;
        }
        if current_version < 19 {
            self.migrate_v19()?;
        }
        if current_version < 20 {
            self.migrate_v20()?;
        }
        if current_version < 21 {
            self.migrate_v21()?;
        }
        if current_version < 22 {
            self.migrate_v22()?;
        }
        if current_version < 23 {
            self.migrate_v23()?;
        }
        if current_version < 24 {
            self.migrate_v24()?;
        }
        if current_version < 25 {
            self.migrate_v25()?;
        }
        if current_version < 26 {
            self.migrate_v26()?;
        }
        if current_version < 27 {
            self.migrate_v27()?;
        }
        if current_version < 28 {
            self.migrate_v28()?;
        }
        if current_version < 29 {
            self.migrate_v29()?;
        }
        if current_version < 30 {
            self.migrate_v30()?;
        }
        if current_version < 31 {
            self.migrate_v31()?;
        }
        if current_version < 32 {
            self.migrate_v32()?;
        }
        if current_version < 33 {
            self.migrate_v33()?;
        }
        if current_version < 34 {
            self.migrate_v34()?;
        }
        if current_version < 35 {
            self.migrate_v35()?;
        }
        Ok(())
    }

    fn migrate_v2(&self) -> SqliteResult<()> {
        // Add time fields to daily_plan_tasks for timeline support
        self.conn.execute_batch(
            "ALTER TABLE daily_plan_tasks ADD COLUMN start_time TEXT;
             ALTER TABLE daily_plan_tasks ADD COLUMN end_time TEXT;",
        ).ok(); // Ignore error if columns already exist

        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (2, 'Add start_time/end_time to daily_plan_tasks for timeline view')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v3(&self) -> SqliteResult<()> {
        // Add completion_note for task review/reflection on completion
        self.conn.execute_batch(
            "ALTER TABLE tasks ADD COLUMN completion_note TEXT DEFAULT '';",
        ).ok(); // Ignore error if column already exists

        // Add 运动 category and adjust sort orders
        self.conn.execute_batch(
            "INSERT OR IGNORE INTO categories (id, name, color, icon, sort_order) VALUES ('cat-sport', '运动', '#12B886', '🏃', 2);
             UPDATE categories SET sort_order = 3 WHERE id = 'cat-work';
             UPDATE categories SET sort_order = 4 WHERE id = 'cat-life';
             UPDATE categories SET sort_order = 5 WHERE id = 'cat-health';
             UPDATE categories SET sort_order = 6 WHERE id = 'cat-other';",
        )?;

        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (3, 'Add completion_note to tasks and sport category')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v4(&self) -> SqliteResult<()> {
        let sql = include_str!("../migrations/v4_courses.sql");
        self.conn.execute_batch(sql)?;
        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (4, 'Add courses and assignments tables')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v5(&self) -> SqliteResult<()> {
        let sql = include_str!("../migrations/v5_v36.sql");
        self.conn.execute_batch(sql)?;
        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (5, 'V3.6: notifications, pomodoro sessions, report subscriptions')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v6(&self) -> SqliteResult<()> {
        let sql = include_str!("../migrations/v6_project.sql");
        self.conn.execute_batch(sql)?;
        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (6, 'V3.7: projects, task relationships, kanban columns, task date ranges and progress')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v7(&self) -> SqliteResult<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS gantt_tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                status TEXT NOT NULL DEFAULT 'pending',
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                progress INTEGER DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
            );
            CREATE INDEX IF NOT EXISTS idx_gantt_tasks_status ON gantt_tasks(status);
            CREATE TABLE IF NOT EXISTS gantt_task_relationships (
                id TEXT PRIMARY KEY,
                source_task_id TEXT NOT NULL,
                target_task_id TEXT NOT NULL,
                relationship_type TEXT NOT NULL DEFAULT 'depends_on',
                is_blocking INTEGER DEFAULT 0,
                label TEXT DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                FOREIGN KEY (source_task_id) REFERENCES gantt_tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (target_task_id) REFERENCES gantt_tasks(id) ON DELETE CASCADE,
                UNIQUE(source_task_id, target_task_id)
            );
            CREATE INDEX IF NOT EXISTS idx_gantt_rel_source ON gantt_task_relationships(source_task_id);
            CREATE INDEX IF NOT EXISTS idx_gantt_rel_target ON gantt_task_relationships(target_task_id);",
        )?;
        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (7, 'Gantt tasks and relationships — independent from daily tasks')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v8(&self) -> SqliteResult<()> {
        let sql = include_str!("../migrations/v8_tags_papers_goals_experiments.sql");
        self.conn.execute_batch(sql)?;
        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (8, 'V4.0: tags, backlinks, papers, OKR goals, experiments')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v9(&self) -> SqliteResult<()> {
        // Add source column to tags (obsidian / manual)
        self.conn
            .execute_batch(
                "ALTER TABLE tags ADD COLUMN source TEXT DEFAULT 'manual';
                 ALTER TABLE tags ADD COLUMN vault_path TEXT DEFAULT '';",
            )
            .ok(); // Ignore if columns already exist

        // Add vault_path to app_config
        self.conn
            .execute(
                "INSERT OR IGNORE INTO app_config (key, value) VALUES ('vault_path', '')",
                [],
            )
            .ok();

        self.conn
            .execute(
                "INSERT OR IGNORE INTO migrations (version, description) VALUES (9, 'V4.1: tags source column + vault_path config')",
                [],
            )?;
        Ok(())
    }

    fn migrate_v10(&self) -> SqliteResult<()> {
        // Drop legacy knowledge base tables (replaced by Obsidian)
        self.conn.execute_batch(
            "DROP TABLE IF EXISTS document_tags;
             DROP TABLE IF EXISTS literature_meta;
             DROP TABLE IF EXISTS document_links;
             DROP TABLE IF EXISTS documents_fts;
             DROP TABLE IF EXISTS documents;
             DROP TABLE IF EXISTS folders;",
        )?;
        // Drop project/kanban tables (unused)
        self.conn.execute_batch(
            "DROP TABLE IF EXISTS task_relationships;
             DROP TABLE IF EXISTS kanban_columns;
             DROP TABLE IF EXISTS project_tasks;
             DROP TABLE IF EXISTS projects;",
        )?;
        // Drop OKR goals tables (unused)
        self.conn.execute_batch(
            "DROP TABLE IF EXISTS key_results;
             DROP TABLE IF EXISTS goals;",
        )?;
        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (10, 'V4.2: Remove legacy tables — knowledge base, projects, gantt, kanban, OKR goals')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v11(&self) -> SqliteResult<()> {
        self.conn.execute_batch(
            "ALTER TABLE gantt_tasks ADD COLUMN color TEXT;"
        )?;
        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (11, 'V4.3: Add color column to gantt_tasks')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v12(&self) -> SqliteResult<()> {
        // Add color column to tasks (was gantt_tasks only)
        self.conn
            .execute_batch("ALTER TABLE tasks ADD COLUMN color TEXT;")
            .ok(); // Ignore if column already exists

        // Create new generic task_relationships table
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS task_relationships (
                id TEXT PRIMARY KEY,
                source_task_id TEXT NOT NULL,
                target_task_id TEXT NOT NULL,
                relationship_type TEXT NOT NULL DEFAULT 'depends_on',
                is_blocking INTEGER NOT NULL DEFAULT 0,
                label TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                FOREIGN KEY (source_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (target_task_id) REFERENCES tasks(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_task_rel_source ON task_relationships(source_task_id);
            CREATE INDEX IF NOT EXISTS idx_task_rel_target ON task_relationships(target_task_id);",
        )?;

        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (12, 'V4.4: Add color to tasks + create task_relationships table')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v13(&self) -> SqliteResult<()> {
        // Migrate gantt_tasks → tasks (only insert if id doesn't already exist in tasks)
        self.conn.execute_batch(
            "INSERT OR IGNORE INTO tasks (id, title, description, status, start_date, end_date, progress, color, created_at, updated_at)
             SELECT id, title, description,
                 CASE status
                     WHEN 'pending' THEN 'pending'
                     WHEN 'in_progress' THEN 'in_progress'
                     WHEN 'near_complete' THEN 'in_progress'
                     WHEN 'completed' THEN 'completed'
                     WHEN 'incomplete' THEN 'cancelled'
                 END,
                 start_date, end_date, progress, color, created_at, updated_at
             FROM gantt_tasks;",
        )?;

        // Migrate gantt_task_relationships → task_relationships
        self.conn.execute_batch(
            "INSERT OR IGNORE INTO task_relationships (id, source_task_id, target_task_id, relationship_type, is_blocking, label, created_at)
             SELECT id, source_task_id, target_task_id, relationship_type,
                 CASE WHEN is_blocking THEN 1 ELSE 0 END, label, created_at
             FROM gantt_task_relationships;",
        )?;

        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (13, 'V4.4: Migrate gantt_tasks/relationships → tasks/task_relationships')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v14(&self) -> SqliteResult<()> {
        // Drop old gantt tables
        self.conn.execute_batch(
            "DROP TABLE IF EXISTS gantt_task_relationships;
             DROP TABLE IF EXISTS gantt_tasks;",
        )?;

        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (14, 'V4.4: Drop legacy gantt tables')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v15(&self) -> SqliteResult<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS app_sessions (
                id TEXT PRIMARY KEY,
                start_time TEXT NOT NULL,
                end_time TEXT,
                duration_seconds INTEGER,
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
            );
            CREATE INDEX IF NOT EXISTS idx_app_sessions_start ON app_sessions(start_time);",
        )?;

        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (15, 'V4.5: Add app_sessions table for usage duration tracking')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v16(&self) -> SqliteResult<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS countdown_events (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                target_date TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT '其他',
                repeat_yearly INTEGER NOT NULL DEFAULT 0,
                show_on_dashboard INTEGER NOT NULL DEFAULT 1,
                color TEXT,
                notes TEXT DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
            );
            CREATE INDEX IF NOT EXISTS idx_countdown_target ON countdown_events(target_date);",
        )?;

        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (16, 'V4.5: Add countdown_events table for countdown/day tracking')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v17(&self) -> SqliteResult<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS life_events (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                start_date TEXT NOT NULL,
                end_date TEXT,
                category TEXT NOT NULL DEFAULT 'other',
                color TEXT,
                is_highlighted INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
            );
            CREATE TABLE IF NOT EXISTS life_event_links (
                id TEXT PRIMARY KEY,
                life_event_id TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id TEXT NOT NULL,
                label TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                FOREIGN KEY (life_event_id) REFERENCES life_events(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_le_links_event ON life_event_links(life_event_id);",
        )?;

        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (17, 'V4.6: Add life_events and life_event_links tables for life stage tracking')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v18(&self) -> SqliteResult<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS user_profile (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            INSERT OR IGNORE INTO user_profile (key, value) VALUES ('birth_date', '');
            ALTER TABLE life_events ADD COLUMN start_precision TEXT NOT NULL DEFAULT 'month';
            ALTER TABLE life_events ADD COLUMN end_precision TEXT NOT NULL DEFAULT 'month';",
        )?;

        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (18, 'V4.6.1: Add user_profile table and life_events precision columns')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v19(&self) -> SqliteResult<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS visited_cities (
                id TEXT PRIMARY KEY,
                city_name TEXT NOT NULL,
                country TEXT NOT NULL DEFAULT '中国',
                province TEXT NOT NULL DEFAULT '',
                lat REAL NOT NULL,
                lng REAL NOT NULL,
                visit_date TEXT,
                rating INTEGER DEFAULT 0,
                is_highlighted INTEGER NOT NULL DEFAULT 0,
                color TEXT DEFAULT '#3B82F6',
                notes TEXT NOT NULL DEFAULT '',
                travel_guide TEXT NOT NULL DEFAULT '',
                photos TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
            );
            CREATE TABLE IF NOT EXISTS city_notes (
                id TEXT PRIMARY KEY,
                city_id TEXT NOT NULL,
                title TEXT NOT NULL DEFAULT '',
                content TEXT NOT NULL DEFAULT '',
                note_date TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                FOREIGN KEY (city_id) REFERENCES visited_cities(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_city_notes_city ON city_notes(city_id);",
        )?;

        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (19, 'V4.7: Add visited_cities and city_notes tables for travel map')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v20(&self) -> SqliteResult<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS packing_lists (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                destination TEXT NOT NULL DEFAULT '',
                departure_date TEXT,
                return_date TEXT,
                notes TEXT NOT NULL DEFAULT '',
                is_template INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
            );
            CREATE TABLE IF NOT EXISTS packing_items (
                id TEXT PRIMARY KEY,
                list_id TEXT NOT NULL,
                name TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'other',
                quantity INTEGER NOT NULL DEFAULT 1,
                is_packed INTEGER NOT NULL DEFAULT 0,
                sort_order INTEGER NOT NULL DEFAULT 0,
                notes TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                FOREIGN KEY (list_id) REFERENCES packing_lists(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_packing_items_list ON packing_items(list_id);",
        )?;

        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (20, 'V4.8: Add packing_lists and packing_items tables for packing checklist')",
            [],
        )?;

        Ok(())
    }

    fn migrate_v21(&self) -> SqliteResult<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS personal_assets (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'other',
                purchase_date TEXT NOT NULL,
                price REAL NOT NULL DEFAULT 0,
                currency TEXT NOT NULL DEFAULT 'CNY',
                quantity INTEGER NOT NULL DEFAULT 1,
                brand TEXT NOT NULL DEFAULT '',
                model TEXT NOT NULL DEFAULT '',
                warranty_expiry TEXT,
                status TEXT NOT NULL DEFAULT 'in_use',
                condition TEXT NOT NULL DEFAULT 'good',
                notes TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
            );",
        )?;

        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (21, 'V4.9: Add personal_assets table for asset management')",
            [],
        )?;

        Ok(())
    }

    fn migrate_v22(&self) -> SqliteResult<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS transaction_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                icon TEXT NOT NULL,
                color TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
            );
            CREATE TABLE IF NOT EXISTS accounts (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                balance REAL NOT NULL DEFAULT 0,
                is_savings INTEGER NOT NULL DEFAULT 0,
                color TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
            );
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                amount REAL NOT NULL,
                category_id INTEGER NOT NULL,
                account_id TEXT NOT NULL,
                target_account_id TEXT,
                transfer_id TEXT,
                date TEXT NOT NULL,
                note TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                FOREIGN KEY (category_id) REFERENCES transaction_categories(id),
                FOREIGN KEY (account_id) REFERENCES accounts(id),
                FOREIGN KEY (target_account_id) REFERENCES accounts(id)
            );
            CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
            CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
            CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
            CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);"
        )?;

        // 插入 12 个预设分类（颜色随机分配）
        self.conn.execute_batch(
            "INSERT OR IGNORE INTO transaction_categories (id, name, icon, color) VALUES
             (1, '学习', 'ReadOutlined', '#4C6EF5'),
             (2, '餐饮', 'ShopOutlined', '#F76707'),
             (3, '购物', 'ShoppingCartOutlined', '#E03131'),
             (4, '交通', 'CarOutlined', '#12B886'),
             (5, '娱乐', 'SmileOutlined', '#7950F2'),
             (6, '医疗', 'MedicineBoxOutlined', '#F06595'),
             (7, '服务', 'ToolOutlined', '#15AABF'),
             (8, '转账', 'SwapOutlined', '#74B816'),
             (9, '借款', 'HandshakeOutlined', '#FD7E14'),
             (10, '红包', 'GiftOutlined', '#BE4BDB'),
             (11, '生活缴费', 'ThunderboltOutlined', '#FCC419'),
             (12, '其他', 'EllipsisOutlined', '#868E96');"
        )?;

        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (22, 'V5.1: Add finance tables — transaction_categories, accounts, transactions')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v23(&self) -> SqliteResult<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS task_obsidian_meta (
                task_id TEXT PRIMARY KEY,
                obsidian_synced_at TEXT,
                obsidian_checked_at TEXT,
                obsidian_source_path TEXT,
                obsidian_source_line INTEGER,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS vault_daily_notes (
                plan_date TEXT PRIMARY KEY,
                note_path TEXT NOT NULL,
                exported_at TEXT NOT NULL,
                last_synced_at TEXT
            );
            CREATE TABLE IF NOT EXISTS obsidian_sync_log (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                direction TEXT NOT NULL,
                action TEXT NOT NULL,
                synced_at TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'success',
                error TEXT DEFAULT '',
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS obsidian_todo_capture_log (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                note_path TEXT NOT NULL,
                line_number INTEGER NOT NULL,
                captured_at TEXT NOT NULL,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            );"
        )?;

        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (23, 'V5.2: Add Obsidian integration tables — task_obsidian_meta, vault_daily_notes, obsidian_sync_log, obsidian_todo_capture_log')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v24(&self) -> SqliteResult<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS journal_entries (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                note_path TEXT NOT NULL,
                first_line TEXT NOT NULL DEFAULT '',
                word_count INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);"
        )?;

        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (24, 'V5.5: Journal system — journal_entries table for Obsidian daily note integration')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v25(&self) -> SqliteResult<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS daily_meals (
                date TEXT PRIMARY KEY,
                breakfast TEXT NOT NULL DEFAULT '',
                lunch TEXT NOT NULL DEFAULT '',
                dinner TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
            );"
        )?;

        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (25, 'V5.5: Daily meals — daily_meals table for tracking breakfast/lunch/dinner')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v26(&self) -> SqliteResult<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                content TEXT NOT NULL DEFAULT '',
                context TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
            );
            CREATE INDEX IF NOT EXISTS idx_memories_date ON memories(date);"
        )?;

        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (26, 'V5.5: Memories — memories table for quick capture notes (unified journal + inspiration)')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v27(&self) -> SqliteResult<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS emotion_entries (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL UNIQUE,
                emoji_1 TEXT NOT NULL DEFAULT '',
                emoji_2 TEXT NOT NULL DEFAULT '',
                emoji_3 TEXT NOT NULL DEFAULT '',
                emoji_4 TEXT NOT NULL DEFAULT '',
                emoji_5 TEXT NOT NULL DEFAULT '',
                control_score INTEGER DEFAULT 0,
                notes TEXT NOT NULL DEFAULT '',
                weather TEXT NOT NULL DEFAULT '',
                task_completed_count INTEGER DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
            );
            CREATE INDEX IF NOT EXISTS idx_emotion_entries_date ON emotion_entries(date);"
        )?;

        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (27, 'V5.6: Emotion diary — emotion_entries table for daily mood tracking')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v28(&self) -> SqliteResult<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS badges (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                icon TEXT NOT NULL DEFAULT '🏅',
                category TEXT NOT NULL DEFAULT 'general',
                criteria_type TEXT NOT NULL,
                criteria_value INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
            );
            CREATE TABLE IF NOT EXISTS user_badges (
                id TEXT PRIMARY KEY,
                badge_id TEXT NOT NULL,
                progress REAL NOT NULL DEFAULT 0,
                unlocked INTEGER NOT NULL DEFAULT 0,
                unlocked_at TEXT,
                notified INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (badge_id) REFERENCES badges(id)
            );
            CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);"
        )?;

        // Seed 15 preset badges
        self.conn.execute_batch(
            "INSERT OR IGNORE INTO badges (id, name, description, icon, category, criteria_type, criteria_value) VALUES
             ('pomodoro_100h', '番茄大师', '累计番茄钟100小时', '🍅', '专注', 'pomodoro_minutes', 6000),
             ('plan_streak_7d', '规划达人', '连续7天制定每日计划', '📋', '习惯', 'plan_streak_days', 7),
             ('papers_30', '文献猎手', '已读论文30篇', '📄', '学术', 'papers_read', 30),
             ('experiments_50', '实验狂人', '实验记录超50条', '🔬', '学术', 'experiments_count', 50),
             ('finance_streak_30d', '记账标兵', '连续记账30天', '💰', '习惯', 'finance_streak_days', 30),
             ('first_life_event', '记忆起点', '首次添加人生事件', '🌟', '里程碑', 'life_events_count', 1),
             ('tasks_100', '任务收割机', '完成任务100个', '✅', '成就', 'tasks_completed', 100),
             ('first_travel_city', '旅行者', '首次标记旅行城市', '🗺️', '探索', 'travel_cities_count', 1),
             ('early_bird_30d', '早鸟达人', '早上8点前开始计划累计30天', '🌅', '习惯', 'early_bird_days', 30),
             ('course_complete_10', '课程终结者', '完成10门课程', '📚', '学术', 'courses_completed', 10),
             ('asset_collector_50', '物品收藏家', '记录50件物品', '📦', '收集', 'assets_count', 50),
             ('countdown_10', '时间守望者', '创建10个倒数日', '⏳', '收集', 'countdowns_created', 10),
             ('first_advisor_meeting', '导师首谈', '首次记录导师沟通', '👨‍🏫', '里程碑', 'advisor_meetings_count', 1),
             ('contact_network_20', '社交达人', '人脉图谱超过20人', '🤝', '社交', 'contacts_count', 20),
             ('first_memory', '灵感捕手', '首次记录灵感速写', '💡', '里程碑', 'memories_count', 1);"
        )?;

        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (28, 'V5.6: Achievement badges — badges + user_badges tables with 15 presets')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v29(&self) -> SqliteResult<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS review_config (
                id INTEGER PRIMARY KEY DEFAULT 1,
                enabled INTEGER NOT NULL DEFAULT 1,
                review_time TEXT NOT NULL DEFAULT '21:00',
                position TEXT NOT NULL DEFAULT 'bottom-right'
            );
            INSERT OR IGNORE INTO review_config (id, enabled, review_time, position) VALUES (1, 1, '21:00', 'bottom-right');

            CREATE TABLE IF NOT EXISTS encouragement_quotes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                quote TEXT NOT NULL
            );"
        )?;
        // Seed quotes
        self.conn.execute_batch(
            "INSERT OR IGNORE INTO encouragement_quotes (id, quote) VALUES
             (1, '今天的努力是明天的基石 🌱'),
             (2, '科研是一场马拉松，不是短跑 🏃'),
             (3, '每一个实验都在让你离答案更近一步 🔬'),
             (4, '失败是成功的实验报告 📝'),
             (5, '今天也是充实的一天 ✨'),
             (6, '保持好奇心，保持探索欲 🚀'),
             (7, '学术之路，一步一个脚印 👣'),
             (8, '数据不会说谎，它会告诉你答案 📊'),
             (9, '灵感总在深夜降临，别忘记记录 💡'),
             (10, '你比昨天更博学了 📚');"
        )?;
        self.conn.execute("INSERT OR IGNORE INTO migrations (version, description) VALUES (29, 'V5.6: Cyber review — review_config + encouragement_quotes tables')", [])?;
        Ok(())
    }

    fn migrate_v30(&self) -> SqliteResult<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS advisor_meetings (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                summary TEXT NOT NULL DEFAULT '',
                feedback TEXT NOT NULL DEFAULT '',
                action_items TEXT NOT NULL DEFAULT '[]',
                next_goals TEXT NOT NULL DEFAULT '',
                related_task_ids TEXT NOT NULL DEFAULT '[]',
                related_experiment_ids TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
            );
            CREATE INDEX IF NOT EXISTS idx_advisor_meetings_date ON advisor_meetings(date);

            CREATE TABLE IF NOT EXISTS advisor_config (
                id INTEGER PRIMARY KEY DEFAULT 1,
                meeting_pattern TEXT NOT NULL DEFAULT 'weekly',
                meeting_day_of_week INTEGER NOT NULL DEFAULT 1,
                last_meeting_date TEXT
            );
            INSERT OR IGNORE INTO advisor_config (id, meeting_pattern, meeting_day_of_week) VALUES (1, 'weekly', 1);"
        )?;
        self.conn.execute("INSERT OR IGNORE INTO migrations (version, description) VALUES (30, 'V5.6: Advisor meetings — advisor_meetings + advisor_config tables')", [])?;
        Ok(())
    }

    fn migrate_v31(&self) -> SqliteResult<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS contacts (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                contact_info TEXT NOT NULL DEFAULT '',
                relationship_type TEXT NOT NULL DEFAULT '友情',
                custom_tags TEXT NOT NULL DEFAULT '[]',
                met_date TEXT,
                important_dates TEXT NOT NULL DEFAULT '[]',
                common_experiences TEXT NOT NULL DEFAULT '',
                notes TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
            );
            CREATE TABLE IF NOT EXISTS contact_links (
                id TEXT PRIMARY KEY,
                contact_id TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id TEXT NOT NULL,
                label TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_contact_links_contact ON contact_links(contact_id);"
        )?;
        self.conn.execute("INSERT OR IGNORE INTO migrations (version, description) VALUES (31, 'V5.6: Contact network — contacts + contact_links tables')", [])?;
        Ok(())
    }

    fn migrate_v32(&self) -> SqliteResult<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS grad_milestones (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                date TEXT NOT NULL,
                milestone_type TEXT NOT NULL DEFAULT 'manual',
                category TEXT NOT NULL DEFAULT 'other',
                description TEXT NOT NULL DEFAULT '',
                is_key INTEGER NOT NULL DEFAULT 0,
                semester TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
            );
            CREATE TABLE IF NOT EXISTS semester_reviews (
                id TEXT PRIMARY KEY,
                semester TEXT NOT NULL UNIQUE,
                period_start TEXT,
                period_end TEXT,
                courses_count INTEGER NOT NULL DEFAULT 0,
                experiments_count INTEGER NOT NULL DEFAULT 0,
                papers_read INTEGER NOT NULL DEFAULT 0,
                advisor_meetings INTEGER NOT NULL DEFAULT 0,
                task_completion_rate REAL NOT NULL DEFAULT 0,
                summary TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
            );"
        )?;
        self.conn.execute("INSERT OR IGNORE INTO migrations (version, description) VALUES (32, 'V5.6: Grad panorama — grad_milestones + semester_reviews tables')", [])?;
        Ok(())
    }

    fn migrate_v33(&self) -> SqliteResult<()> {
        // Emotional asset columns
        self.conn.execute_batch(
            "ALTER TABLE personal_assets ADD COLUMN is_sentimental INTEGER NOT NULL DEFAULT 0;
             ALTER TABLE personal_assets ADD COLUMN origin TEXT NOT NULL DEFAULT '';
             ALTER TABLE personal_assets ADD COLUMN related_people TEXT NOT NULL DEFAULT '';
             ALTER TABLE personal_assets ADD COLUMN related_stories TEXT NOT NULL DEFAULT '';
             ALTER TABLE personal_assets ADD COLUMN retired_at TEXT;
             ALTER TABLE personal_assets ADD COLUMN farewell_message TEXT NOT NULL DEFAULT '';"
        ).ok();

        // Travel wishlist
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS travel_wishlist (
                id TEXT PRIMARY KEY,
                city_name TEXT NOT NULL,
                country TEXT NOT NULL DEFAULT '中国',
                province TEXT NOT NULL DEFAULT '',
                lat REAL, lng REAL,
                reason TEXT NOT NULL DEFAULT '',
                best_season TEXT NOT NULL DEFAULT '',
                budget REAL NOT NULL DEFAULT 0,
                companions TEXT NOT NULL DEFAULT '',
                is_visited INTEGER NOT NULL DEFAULT 0,
                visited_date TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
            );"
        )?;

        self.conn.execute("INSERT OR IGNORE INTO migrations (version, description) VALUES (33, 'V5.6: Emotional asset fields + travel wishlist table')", [])?;
        Ok(())
    }

    fn migrate_v34(&self) -> SqliteResult<()> {
        // Add payment tracking columns to daily_meals
        self.conn.execute_batch(
            "ALTER TABLE daily_meals ADD COLUMN breakfast_cost REAL NOT NULL DEFAULT 0;
             ALTER TABLE daily_meals ADD COLUMN breakfast_account_id TEXT NOT NULL DEFAULT '';
             ALTER TABLE daily_meals ADD COLUMN breakfast_txn_id TEXT NOT NULL DEFAULT '';
             ALTER TABLE daily_meals ADD COLUMN lunch_cost REAL NOT NULL DEFAULT 0;
             ALTER TABLE daily_meals ADD COLUMN lunch_account_id TEXT NOT NULL DEFAULT '';
             ALTER TABLE daily_meals ADD COLUMN lunch_txn_id TEXT NOT NULL DEFAULT '';
             ALTER TABLE daily_meals ADD COLUMN dinner_cost REAL NOT NULL DEFAULT 0;
             ALTER TABLE daily_meals ADD COLUMN dinner_account_id TEXT NOT NULL DEFAULT '';
             ALTER TABLE daily_meals ADD COLUMN dinner_txn_id TEXT NOT NULL DEFAULT '';"
        ).ok(); // ok(): columns may already exist from partial migration

        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (34, 'V5.7: Meal payment tracking — cost/account/txn columns on daily_meals')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v35(&self) -> SqliteResult<()> {
        // Add drinks (饮料) columns to daily_meals
        self.conn.execute_batch(
            "ALTER TABLE daily_meals ADD COLUMN drinks TEXT NOT NULL DEFAULT '';
             ALTER TABLE daily_meals ADD COLUMN drinks_cost REAL NOT NULL DEFAULT 0;
             ALTER TABLE daily_meals ADD COLUMN drinks_account_id TEXT NOT NULL DEFAULT '';
             ALTER TABLE daily_meals ADD COLUMN drinks_txn_id TEXT NOT NULL DEFAULT '';"
        ).ok(); // ok(): columns may already exist from partial migration

        self.conn.execute(
            "INSERT OR IGNORE INTO migrations (version, description) VALUES (35, 'V5.8: Meal drinks — drinks/cost/account/txn columns on daily_meals')",
            [],
        )?;
        Ok(())
    }

    fn migrate_v1(&self) -> SqliteResult<()> {
        let sql = include_str!("../migrations/v1_init.sql");
        self.conn.execute_batch(sql)?;

        self.conn.execute(
            "INSERT INTO migrations (version, description) VALUES (1, 'Initial schema: tasks, categories, tags, daily_plans, folders, documents, literature_meta, document_links, FTS')",
            [],
        )?;

        // 插入预设分类
        self.conn.execute_batch(
            "INSERT OR IGNORE INTO categories (id, name, color, icon, sort_order) VALUES
             ('cat-study',  '学习',   '#4C6EF5', '📖', 0),
             ('cat-research','科研',   '#7950F2', '🔬', 1),
             ('cat-work',    '工作',   '#F76707', '💼', 2),
             ('cat-life',    '生活',   '#40C057', '🏠', 3),
             ('cat-health',  '健康',   '#E03131', '💪', 4),
             ('cat-other',   '其他',   '#868E96', '📌', 5);",
        )?;

        // 插入预设文件夹结构
        self.conn.execute_batch(
            "INSERT OR IGNORE INTO folders (id, name, parent_folder_id, icon, sort_order) VALUES
             ('root',              '知识库',     NULL, '📚', 0),
             ('folder-papers',     '论文阅读',   'root', '📄', 1),
             ('folder-papers-read','├ 已读',     'folder-papers', '✅', 0),
             ('folder-papers-todo','├ 待读',     'folder-papers', '📥', 1),
             ('folder-papers-note','├ 精读笔记', 'folder-papers', '⭐', 2),
             ('folder-blog',       '技术博客',   'root', '📝', 2),
             ('folder-projects',   '项目实践',   'root', '💻', 3);",
        )?;

        Ok(())
    }
}
