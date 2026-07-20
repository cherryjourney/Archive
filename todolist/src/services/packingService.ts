import { invoke } from '@tauri-apps/api/core';
import type {
  PackingList, CreatePackingListParams, UpdatePackingListParams,
  PackingItem, CreatePackingItemParams, UpdatePackingItemParams,
  ReorderItemsParams, PackingListDetail,
} from '@/types/packing';

export const packingService = {
  /** ── Packing Lists ── */

  async listLists(): Promise<PackingList[]> {
    return invoke('list_user_lists');
  },

  async listTemplates(): Promise<PackingList[]> {
    return invoke('list_templates');
  },

  async createList(params: CreatePackingListParams): Promise<void> {
    const id = crypto.randomUUID();
    await invoke('create_packing_list', { id, params });
  },

  async updateList(id: string, params: UpdatePackingListParams): Promise<void> {
    await invoke('update_packing_list', { id, params });
  },

  async deleteList(id: string): Promise<void> {
    await invoke('delete_packing_list', { id });
  },

  async duplicateList(templateId: string, newTitle: string): Promise<void> {
    const newId = crypto.randomUUID();
    await invoke('duplicate_packing_list', { templateId, newId, newTitle });
  },

  async getListDetail(id: string): Promise<PackingListDetail> {
    return invoke('get_packing_list_detail', { id });
  },

  /** ── Packing Items ── */

  async getItems(listId: string): Promise<PackingItem[]> {
    return invoke('get_packing_items', { listId });
  },

  async addItem(params: CreatePackingItemParams): Promise<void> {
    const id = crypto.randomUUID();
    await invoke('add_packing_item', { id, params });
  },

  async updateItem(id: string, params: UpdatePackingItemParams): Promise<void> {
    await invoke('update_packing_item', { id, params });
  },

  async toggleItemPacked(id: string): Promise<boolean> {
    return invoke('toggle_item_packed', { id });
  },

  async deleteItem(id: string): Promise<void> {
    await invoke('delete_packing_item', { id });
  },

  async reorderItems(params: ReorderItemsParams): Promise<void> {
    await invoke('reorder_packing_items', { params });
  },

  async resetAllItems(listId: string): Promise<void> {
    await invoke('reset_all_packing_items', { listId });
  },

  async completeAllItems(listId: string): Promise<void> {
    await invoke('complete_all_packing_items', { listId });
  },
};
