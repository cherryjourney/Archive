import type { Task } from './task';

// ====== 专注记录导入 ======
export interface ImportFocusRecord {
  date: string;
  todo_name: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
}

// ====== 每日计划 ======
export interface DailyPlan {
  id: string;
  date: string;
  morning_plan_md: string;
  evening_review_md: string;
  efficiency_rating: number | null;
  mood_rating: number | null;
  notes: string;
  created_at: string;
  updated_at: string;
  tasks: PlanTask[];
}

export interface PlanTask {
  task_id: string;
  sort_order: number;
  is_mit: boolean;
  start_time: string | null;  // HH:MM
  end_time: string | null;    // HH:MM
  added_at: string;
  task: Task;
}

export interface EveningReviewParams {
  efficiency_rating?: number | null;
  mood_rating?: number | null;
  evening_review_md?: string;
  notes?: string;
}

// ====== 时段 ======
export type DayPeriod = 'morning' | 'afternoon' | 'evening';

export const PERIOD_LABELS: Record<DayPeriod, string> = {
  morning: '☀️ 上午规划',
  afternoon: '📋 下午执行',
  evening: '🌙 晚上复盘',
};
