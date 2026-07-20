import { create } from 'zustand';
import { reviewService } from '@/services/reviewService';
import type { ReviewConfig, DailyReviewData } from '@/types/review';

interface ReviewState {
  config: ReviewConfig | null;
  todayReview: DailyReviewData | null;
  loading: boolean;
  fetchConfig: () => Promise<void>;
  updateConfig: (params: { enabled?: boolean; review_time?: string; position?: string }) => Promise<void>;
  fetchToday: () => Promise<void>;
}

export const useReviewStore = create<ReviewState>((set) => ({
  config: null, todayReview: null, loading: false,
  fetchConfig: async () => {
    try { const c = await reviewService.getConfig(); set({ config: c }); } catch {}
  },
  updateConfig: async (params) => {
    await reviewService.updateConfig(params);
    const c = await reviewService.getConfig();
    set({ config: c });
  },
  fetchToday: async () => {
    const date = new Date().toISOString().slice(0, 10);
    try { const r = await reviewService.getDailyReview(date); set({ todayReview: r }); } catch {}
  },
}));
