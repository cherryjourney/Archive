import { create } from 'zustand';
import dayjs from 'dayjs';
import { mealService } from '@/services/mealService';
import type { DailyMeal, MealPaymentInput, SaveMealParams } from '@/types/meal';

interface MealState {
  todayMeal: DailyMeal | null;
  currentMeal: DailyMeal | null; // meal for the currently browsed date
  mealDates: string[];
  loading: boolean;
  saving: boolean;

  // Today (Dashboard)
  fetchToday: () => Promise<void>;
  saveToday: (
    breakfast: string, lunch: string, dinner: string, drinks: string,
    breakfastPayment?: MealPaymentInput,
    lunchPayment?: MealPaymentInput,
    dinnerPayment?: MealPaymentInput,
    drinksPayment?: MealPaymentInput,
  ) => Promise<void>;

  // Any date
  fetchByDate: (date: string) => Promise<void>;
  saveMeal: (
    date: string, breakfast: string, lunch: string, dinner: string, drinks: string,
    breakfastPayment?: MealPaymentInput,
    lunchPayment?: MealPaymentInput,
    dinnerPayment?: MealPaymentInput,
    drinksPayment?: MealPaymentInput,
  ) => Promise<void>;
  deleteMeal: (date: string) => Promise<void>;
  fetchMealDates: () => Promise<void>;
}

export const useMealStore = create<MealState>((set, get) => ({
  todayMeal: null,
  currentMeal: null,
  mealDates: [],
  loading: false,
  saving: false,

  fetchToday: async () => {
    set({ loading: true });
    try {
      const date = dayjs().format('YYYY-MM-DD');
      const meal = await mealService.getDailyMeal(date);
      set({ todayMeal: meal, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  saveToday: async (breakfast, lunch, dinner, drinks, breakfastPayment, lunchPayment, dinnerPayment, drinksPayment) => {
    set({ saving: true });
    try {
      const date = dayjs().format('YYYY-MM-DD');
      const params: SaveMealParams = {
        date, breakfast, lunch, dinner, drinks,
        breakfast_payment: breakfastPayment,
        lunch_payment: lunchPayment,
        dinner_payment: dinnerPayment,
        drinks_payment: drinksPayment,
      };
      const meal = await mealService.saveDailyMeal(params);
      set({ todayMeal: meal, saving: false });
      // Refresh meal dates list
      get().fetchMealDates();
    } catch {
      set({ saving: false });
    }
  },

  fetchByDate: async (date: string) => {
    set({ loading: true });
    try {
      const meal = await mealService.getDailyMeal(date);
      set({ currentMeal: meal, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  saveMeal: async (date, breakfast, lunch, dinner, drinks, breakfastPayment, lunchPayment, dinnerPayment, drinksPayment) => {
    set({ saving: true });
    try {
      const params: SaveMealParams = {
        date, breakfast, lunch, dinner, drinks,
        breakfast_payment: breakfastPayment,
        lunch_payment: lunchPayment,
        dinner_payment: dinnerPayment,
        drinks_payment: drinksPayment,
      };
      const meal = await mealService.saveDailyMeal(params);
      set({ currentMeal: meal, saving: false });
      // Also update todayMeal if saving today
      if (date === dayjs().format('YYYY-MM-DD')) {
        set({ todayMeal: meal });
      }
      // Refresh meal dates list
      get().fetchMealDates();
    } catch {
      set({ saving: false });
    }
  },

  deleteMeal: async (date: string) => {
    await mealService.deleteDailyMeal(date);
    set({ currentMeal: null });
    // Also clear todayMeal if deleting today
    if (date === dayjs().format('YYYY-MM-DD')) {
      set({ todayMeal: null });
    }
    get().fetchMealDates();
  },

  fetchMealDates: async () => {
    try {
      const dates = await mealService.listMealDates();
      set({ mealDates: dates });
    } catch { /* ignore */ }
  },
}));
