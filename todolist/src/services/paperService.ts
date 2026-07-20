import { invoke } from '@tauri-apps/api/core';
import type { Paper, CreatePaperParams, UpdatePaperParams } from '@/types/paper';

export const paperService = {
  create: (params: CreatePaperParams) => invoke<Paper>('create_paper', { params }),
  update: (paperId: string, params: UpdatePaperParams) => invoke<Paper>('update_paper', { paperId, params }),
  delete: (paperId: string) => invoke<void>('delete_paper', { paperId }),
  get: (paperId: string) => invoke<Paper>('get_paper', { paperId }),
  list: () => invoke<Paper[]>('list_papers'),
};
