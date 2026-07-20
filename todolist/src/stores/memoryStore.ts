import { create } from 'zustand';
import dayjs from 'dayjs';
import { memoryService } from '@/services/memoryService';
import type { Memory } from '@/types/memory';

interface MemoryState {
  memories: Memory[];
  loading: boolean;
  saving: boolean;
  fetchAll: (limit?: number, offset?: number) => Promise<void>;
  create: (content: string, context: string) => Promise<Memory | null>;
  update: (id: string, content: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  memories: [],
  loading: false,
  saving: false,

  fetchAll: async (limit = 100, offset = 0) => {
    set({ loading: true });
    try {
      const memories = await memoryService.list(limit, offset);
      set({ memories, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  create: async (content, context) => {
    set({ saving: true });
    try {
      const date = dayjs().format('YYYY-MM-DD');
      const memory = await memoryService.create({ date, content, context });
      set({ memories: [memory, ...get().memories], saving: false });
      return memory;
    } catch {
      set({ saving: false });
      return null;
    }
  },

  update: async (id, content) => {
    try {
      const updated = await memoryService.update(id, { content });
      set({
        memories: get().memories.map((m) => (m.id === id ? updated : m)),
      });
    } catch {
      // ignore
    }
  },

  remove: async (id) => {
    try {
      await memoryService.delete(id);
      set({ memories: get().memories.filter((m) => m.id !== id) });
    } catch {
      // ignore
    }
  },
}));
