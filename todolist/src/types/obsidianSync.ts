/** Parsed task status from an Obsidian daily note */
export interface ObsidianTaskStatus {
  task_id: string;
  is_checked: boolean;
  note_date: string;
  line_number: number;
  raw_text: string;
}

/** A task status change event from bidirectional sync */
export interface TaskStatusChange {
  task_id: string;
  direction: 'to_obsidian' | 'from_obsidian';
  old_status: string;
  new_is_checked: boolean;
  conflict: boolean;
}

/** Generated daily note markdown */
export interface DailyNoteMd {
  frontmatter: string;
  body: string;
  full_markdown: string;
}

/** A TODO item captured from an Obsidian vault markdown file */
export interface CapturedTodo {
  text: string;
  source_note_path: string;
  line_number: number;
  context: string;
  todo_type: 'checklist' | 'blockquote_todo';
  is_already_imported: boolean;
}

/** Result of a full bidirectional sync operation */
export interface BatchSyncResult {
  synced_to_obsidian: number;
  synced_from_obsidian: number;
  conflicts: number;
  errors: string[];
}
