import { invoke } from '@tauri-apps/api/core';
import type { ReviewConfig, DailyReviewData, UpdateReviewConfigParams } from '@/types/review';
export const reviewService = {
  getConfig: () => invoke<ReviewConfig>('get_review_config'),
  updateConfig: (params: UpdateReviewConfigParams) => invoke<void>('update_review_config', { params }),
  getDailyReview: (date: string) => invoke<DailyReviewData>('get_daily_review', { date }),
};
