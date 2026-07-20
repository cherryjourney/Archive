import { invoke } from '@tauri-apps/api/core';
import type { DailyMeal, SaveMealParams } from '@/types/meal';

export const mealService = {
  getDailyMeal: (date: string) => invoke<DailyMeal>('get_daily_meal', { date }),

  saveDailyMeal: (params: SaveMealParams) =>
    invoke<DailyMeal>('save_daily_meal', { params }),

  deleteDailyMeal: (date: string) =>
    invoke<void>('delete_daily_meal', { date }),

  listMealDates: () =>
    invoke<string[]>('list_meal_dates'),
};
