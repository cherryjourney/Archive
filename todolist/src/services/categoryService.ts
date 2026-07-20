import { invoke } from '@tauri-apps/api/core';

export interface CategoryStat {
  id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  task_count: number;
}

export const categoryService = {
  listCategories(includeCounts?: boolean): Promise<CategoryStat[]> {
    return invoke('list_categories', { includeCounts: includeCounts || false });
  },
};
