import { invoke } from '@tauri-apps/api/core';

export interface CategorySummary {
  name: string;
  color: string;
  completed: number;
  total: number;
}

export interface WeeklyReport {
  start_date: string;
  end_date: string;
  completed_tasks: number;
  total_tasks: number;
  completion_rate: number;
  focus_sessions: number;
  focus_total_seconds: number;
  streak_days: number;
  category_distribution: CategorySummary[];
  prev_completed_tasks: number;
  prev_completion_rate: number;
  prev_focus_sessions: number;
  prev_focus_total_seconds: number;
}

export const reportService = {
  generate(startDate: string, endDate: string): Promise<WeeklyReport> {
    return invoke('generate_weekly_report', { startDate, endDate });
  },
  exportMarkdown(startDate: string, endDate: string): Promise<string> {
    return invoke('export_weekly_report_markdown', { startDate, endDate });
  },
};
