import { create } from 'zustand';
import { packingService } from '@/services/packingService';
import type {
  PackingList, PackingItem, PackingListDetail,
  CreatePackingListParams, UpdatePackingListParams,
  CreatePackingItemParams, UpdatePackingItemParams,
} from '@/types/packing';

interface PackingState {
  lists: PackingList[];
  templates: PackingList[];
  selectedListId: string | null;
  detail: PackingListDetail | null;
  loading: boolean;
  error: string | null;

  fetchLists: () => Promise<void>;
  fetchTemplates: () => Promise<void>;
  selectList: (id: string) => Promise<void>;
  createList: (params: CreatePackingListParams) => Promise<void>;
  updateList: (id: string, params: UpdatePackingListParams) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  duplicateFromTemplate: (templateId: string, newTitle: string) => Promise<void>;
  addItem: (params: CreatePackingItemParams) => Promise<void>;
  updateItem: (id: string, params: UpdatePackingItemParams) => Promise<void>;
  toggleItem: (id: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  resetAll: () => Promise<void>;
  completeAll: () => Promise<void>;
}

export const usePackingStore = create<PackingState>((set, get) => ({
  lists: [],
  templates: [],
  selectedListId: null,
  detail: null,
  loading: false,
  error: null,

  fetchLists: async () => {
    set({ loading: true, error: null });
    try {
      const lists = await packingService.listLists();
      set({ lists, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  fetchTemplates: async () => {
    try {
      const templates = await packingService.listTemplates();
      set({ templates });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  selectList: async (id) => {
    set({ selectedListId: id, detail: null });
    try {
      const detail = await packingService.getListDetail(id);
      set({ detail });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  createList: async (params) => {
    set({ error: null });
    try {
      await packingService.createList(params);
      await get().fetchLists();
      if (params.is_template) await get().fetchTemplates();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  updateList: async (id, params) => {
    set({ error: null });
    try {
      await packingService.updateList(id, params);
      await get().fetchLists();
      if (params.is_template !== undefined) await get().fetchTemplates();
      if (get().selectedListId === id) await get().selectList(id);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  deleteList: async (id) => {
    set({ error: null });
    try {
      await packingService.deleteList(id);
      if (get().selectedListId === id) set({ selectedListId: null, detail: null });
      await get().fetchLists();
      await get().fetchTemplates();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  duplicateFromTemplate: async (templateId, newTitle) => {
    set({ error: null });
    try {
      await packingService.duplicateList(templateId, newTitle);
      await get().fetchLists();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  addItem: async (params) => {
    try {
      await packingService.addItem(params);
      const sid = get().selectedListId;
      if (sid) await get().selectList(sid);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  updateItem: async (id, params) => {
    try {
      await packingService.updateItem(id, params);
      const sid = get().selectedListId;
      if (sid) await get().selectList(sid);
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  toggleItem: async (id) => {
    try {
      await packingService.toggleItemPacked(id);
      const sid = get().selectedListId;
      if (sid) await get().selectList(sid);
    } catch (e) {
      set({ error: String(e) });
    }
  },

  deleteItem: async (id) => {
    try {
      await packingService.deleteItem(id);
      const sid = get().selectedListId;
      if (sid) await get().selectList(sid);
    } catch (e) {
      set({ error: String(e) });
    }
  },

  resetAll: async () => {
    const sid = get().selectedListId;
    if (!sid) return;
    try {
      await packingService.resetAllItems(sid);
      await get().selectList(sid);
    } catch (e) {
      set({ error: String(e) });
    }
  },

  completeAll: async () => {
    const sid = get().selectedListId;
    if (!sid) return;
    try {
      await packingService.completeAllItems(sid);
      await get().selectList(sid);
    } catch (e) {
      set({ error: String(e) });
    }
  },
}));
