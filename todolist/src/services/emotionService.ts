import { invoke } from '@tauri-apps/api/core';
import type { EmotionEntry, SaveEmotionParams, EmotionHeatmapCell } from '@/types/emotion';

export const emotionService = {
  getDailyEmotion: (date: string) =>
    invoke<EmotionEntry>('get_daily_emotion', { date }),

  saveDailyEmotion: (params: SaveEmotionParams) =>
    invoke<EmotionEntry>('save_daily_emotion', { params }),

  getEmotionHeatmap: (year: number) =>
    invoke<EmotionHeatmapCell[]>('get_emotion_heatmap', { year }),
};
