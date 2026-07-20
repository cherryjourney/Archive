import { invoke } from '@tauri-apps/api/core';
import type { VaultNote, VaultConfig, SyncResult } from '@/types/vault';
import type { BatchSyncResult, CapturedTodo } from '@/types/obsidianSync';

export const vaultService = {
  // ── Vault config ──
  setVaultPath: (vaultPath: string) =>
    invoke<VaultConfig>('set_vault_path', { vaultPath }),

  getVaultConfig: () =>
    invoke<VaultConfig>('get_vault_config'),

  // ── Tag sync (existing) ──
  syncVaultTags: () =>
    invoke<SyncResult>('sync_vault_tags'),

  findRelatedNotes: (tags: string[]) =>
    invoke<VaultNote[]>('find_related_notes', { tags }),

  scanVaultNotes: () =>
    invoke<VaultNote[]>('scan_vault_notes'),

  readVaultNote: (notePath: string) =>
    invoke<string>('read_vault_note', { notePath }),

  updateTagColor: (tagId: string, color: string) =>
    invoke<void>('update_tag_color', { tagId, color }),

  // ── Daily Note export (Feature 1) ──
  generateDailyNote: (date: string) =>
    invoke<string>('generate_daily_note', { date }),

  // ── Bidirectional sync (Feature 2) ──
  syncTaskToObsidianNote: (taskId: string) =>
    invoke<void>('sync_task_to_obsidian_note', { taskId }),

  fullBidirectionalSync: (date?: string) =>
    invoke<BatchSyncResult>('full_bidirectional_sync', { date: date || null }),

  // ── Capture & Settle (Feature 4) ──
  captureTodosFromVault: () =>
    invoke<CapturedTodo[]>('capture_todos_from_vault'),

  importCapturedTodos: (indices: number[], todos: CapturedTodo[]) =>
    invoke<number>('import_captured_todos', { indices, todos }),

  settleTaskToNote: (taskId: string) =>
    invoke<void>('settle_task_to_note', { taskId }),

  // ── Calendar sync (Feature 5) ──
  generateCalendarNote: (date: string) =>
    invoke<string>('generate_calendar_note', { date }),

  syncAllPlansToCalendar: () =>
    invoke<number>('sync_all_plans_to_calendar'),
};
