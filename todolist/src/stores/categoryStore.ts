import { create } from 'zustand';
import { categoryService, type CategoryStat } from '@/services/categoryService';

interface CategoryState {
  categories: CategoryStat[];
  loading: boolean;
  fetchCategories: (includeCounts?: boolean) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  loading: false,

  fetchCategories: async (includeCounts = false) => {
    set({ loading: true });
    try {
      const categories = await categoryService.listCategories(includeCounts);
      set({ categories });
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    } finally {
      set({ loading: false });
    }
  },
}));
