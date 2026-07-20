import { invoke } from '@tauri-apps/api/core';
import type { Memory, CreateMemoryParams, UpdateMemoryParams } from '@/types/memory';

export const memoryService = {
  create: (params: CreateMemoryParams) => invoke<Memory>('create_memory', { params }),

  update: (id: string, params: UpdateMemoryParams) =>
    invoke<Memory>('update_memory', { id, params }),

  delete: (id: string) => invoke<void>('delete_memory', { id }),

  getByDate: (date: string) => invoke<Memory[]>('get_memories_by_date', { date }),

  list: (limit: number, offset: number) =>
    invoke<Memory[]>('list_memories', { limit, offset }),
};
