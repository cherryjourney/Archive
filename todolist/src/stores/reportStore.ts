import { create } from 'zustand';
import { reportService, type WeeklyReport } from '@/services/reportService';
import { startOfWeek, endOfWeek, offsetDays } from '@/utils/date';

interface ReportState {
  report: WeeklyReport | null;
  loading: boolean;

  fetchWeek: (startDate?: string, endDate?: string) => Promise<void>;
  exportMarkdown: (startDate?: string, endDate?: string) => Promise<string>;
}

export const useReportStore = create<ReportState>((set) => ({
  report: null,
  loading: false,

  fetchWeek: async (startDate, endDate) => {
    set({ loading: true });
    try {
      const start = startDate || startOfWeek();
      const end = endDate || endOfWeek();
      const report = await reportService.generate(start, end);
      set({ report, loading: false });
    } catch (e) {
      console.error('Failed to fetch weekly report:', e);
      set({ loading: false });
    }
  },

  exportMarkdown: async (startDate, endDate) => {
    const start = startDate || startOfWeek();
    const end = endDate || endOfWeek();
    return reportService.exportMarkdown(start, end);
  },
}));
