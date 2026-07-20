import { create } from 'zustand';
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
import { chartService } from '@/services/chartService';
import { startOfWeek, endOfWeek, startOfMonth, currentYear } from '@/utils/date';

interface ChartState {
  dashboard: DashboardStats | null;
  weeklyTrend: DailyStat[];
  categoryDistribution: CategoryStat[];
  monthlyHeatmap: HeatmapCell[];
  priorityDistribution: PriorityStat[];
  estimateVsActual: EstimateVsActual[];
  streak: StreakData | null;
  productivity: ProductivityPoint[];
  usageHeatmap: HeatmapCell[];

  loading: boolean;

  fetchDashboard: () => Promise<void>;
  fetchWeeklyTrend: () => Promise<void>;
  fetchCategoryDistribution: () => Promise<void>;
  fetchMonthlyHeatmap: (year?: number) => Promise<void>;
  fetchPriorityDistribution: () => Promise<void>;
  fetchEstimateVsActual: () => Promise<void>;
  fetchStreak: () => Promise<void>;
  fetchProductivity: () => Promise<void>;
  fetchUsageHeatmap: (year?: number) => Promise<void>;

  fetchAll: () => Promise<void>;
}

export const useChartStore = create<ChartState>((set) => ({
  dashboard: null,
  weeklyTrend: [],
  categoryDistribution: [],
  monthlyHeatmap: [],
  priorityDistribution: [],
  estimateVsActual: [],
  streak: null,
  productivity: [],
  usageHeatmap: [],

  loading: false,

  fetchDashboard: async () => {
    const data = await chartService.getDashboardStats();
    set({ dashboard: data });
  },

  fetchWeeklyTrend: async () => {
    const data = await chartService.getWeeklyTrend(startOfWeek(), endOfWeek());
    set({ weeklyTrend: data });
  },

  fetchCategoryDistribution: async () => {
    const data = await chartService.getCategoryDistribution(startOfMonth(), endOfWeek());
    set({ categoryDistribution: data });
  },

  fetchMonthlyHeatmap: async (year) => {
    const data = await chartService.getMonthlyHeatmap(year || currentYear());
    set({ monthlyHeatmap: data });
  },

  fetchPriorityDistribution: async () => {
    const data = await chartService.getPriorityDistribution(startOfMonth(), endOfWeek());
    set({ priorityDistribution: data });
  },

  fetchEstimateVsActual: async () => {
    const data = await chartService.getEstimateVsActual(startOfWeek(), endOfWeek());
    set({ estimateVsActual: data });
  },

  fetchStreak: async () => {
    const data = await chartService.getStreakInfo();
    set({ streak: data });
  },

  fetchProductivity: async () => {
    const data = await chartService.getProductivityData(startOfWeek(), endOfWeek());
    set({ productivity: data });
  },

  fetchUsageHeatmap: async (year) => {
    const data = await chartService.getAppUsageHeatmap(year || currentYear());
    set({ usageHeatmap: data });
  },

  fetchAll: async () => {
    set({ loading: true });
    await Promise.allSettled([
      chartService.getDashboardStats().then((d) => set({ dashboard: d })),
      chartService.getWeeklyTrend(startOfWeek(), endOfWeek()).then((d) => set({ weeklyTrend: d })),
      chartService.getCategoryDistribution(startOfMonth(), endOfWeek()).then((d) => set({ categoryDistribution: d })),
      chartService.getStreakInfo().then((d) => set({ streak: d })),
    ]);
    set({ loading: false });
  },
}));
