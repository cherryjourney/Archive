import { create } from 'zustand';
import { emotionService } from '@/services/emotionService';
import type { EmotionEntry, EmotionHeatmapCell } from '@/types/emotion';
import dayjs from 'dayjs';

interface EmotionState {
  todayEntry: EmotionEntry | null;
  heatmap: EmotionHeatmapCell[];
  loading: boolean;
  checkedInToday: boolean;

  fetchToday: () => Promise<void>;
  saveToday: (params: {
    emoji_1: string; emoji_2: string; emoji_3: string;
    emoji_4: string; emoji_5: string;
    control_score: number; notes: string;
    weather: string; task_completed_count: number;
  }) => Promise<void>;
  fetchHeatmap: (year: number) => Promise<void>;
  setCheckedInToday: (v: boolean) => void;
}

export const useEmotionStore = create<EmotionState>((set, get) => ({
  todayEntry: null,
  heatmap: [],
  loading: false,
  checkedInToday: false,

  fetchToday: async () => {
    set({ loading: true });
    try {
      const date = dayjs().format('YYYY-MM-DD');
      const entry = await emotionService.getDailyEmotion(date);
      set({ todayEntry: entry, loading: false });
      // Check if already filled today
      if (entry.emoji_1) {
        set({ checkedInToday: true });
      }
    } catch {
      set({ loading: false });
    }
  },

  saveToday: async (params) => {
    const date = dayjs().format('YYYY-MM-DD');
    const entry = await emotionService.saveDailyEmotion({ date, ...params });
    set({ todayEntry: entry, checkedInToday: true });
  },

  fetchHeatmap: async (year: number) => {
    try {
      const data = await emotionService.getEmotionHeatmap(year);
      set({ heatmap: data });
    } catch { /* ignore */ }
  },

  setCheckedInToday: (v: boolean) => set({ checkedInToday: v }),
}));
