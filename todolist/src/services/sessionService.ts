import { invoke } from '@tauri-apps/api/core';
import type { HeatmapCell } from '@/types/chart';

export const sessionService = {
  startSession(id: string): Promise<void> {
    return invoke('start_app_session', { id });
  },

  endSession(id: string): Promise<void> {
    return invoke('end_app_session', { id });
  },

  getAppUsageHeatmap(year: number): Promise<HeatmapCell[]> {
    return invoke('get_app_usage_heatmap', { year });
  },
};
