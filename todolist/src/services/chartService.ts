import { invoke } from '@tauri-apps/api/core';
import type {
  DashboardStats,
  DailyStat,
  CategoryStat,
  HeatmapCell,
  PriorityStat,
  EstimateVsActual,
  StreakData,
  ProductivityPoint,
} from '@/types/chart';

export const chartService = {
  getDashboardStats(): Promise<DashboardStats> {
    return invoke('get_dashboard_stats');
  },

  getWeeklyTrend(startDate: string, endDate: string): Promise<DailyStat[]> {
    return invoke('get_weekly_trend', { startDate, endDate });
  },

  getCategoryDistribution(startDate: string, endDate: string): Promise<CategoryStat[]> {
    return invoke('get_category_distribution', { startDate, endDate });
  },

  getMonthlyHeatmap(year: number): Promise<HeatmapCell[]> {
    return invoke('get_monthly_heatmap', { year });
  },

  getPriorityDistribution(startDate: string, endDate: string): Promise<PriorityStat[]> {
    return invoke('get_priority_distribution', { startDate, endDate });
  },

  getEstimateVsActual(startDate: string, endDate: string): Promise<EstimateVsActual[]> {
    return invoke('get_estimate_vs_actual', { startDate, endDate });
  },

  getStreakInfo(): Promise<StreakData> {
    return invoke('get_streak_info');
  },

  getProductivityData(startDate: string, endDate: string): Promise<ProductivityPoint[]> {
    return invoke('get_productivity_data', { startDate, endDate });
  },

  getAppUsageHeatmap(year: number): Promise<HeatmapCell[]> {
    return invoke('get_app_usage_heatmap', { year });
  },
};
