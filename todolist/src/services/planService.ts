import { invoke } from '@tauri-apps/api/core';
import type { DailyPlan, EveningReviewParams, ImportFocusRecord } from '@/types/plan';

export const planService = {
  getDailyPlan(date: string): Promise<DailyPlan> {
    return invoke('get_daily_plan', { date });
  },

  updateMorningPlan(planId: string, markdown: string): Promise<void> {
    return invoke('update_morning_plan', { planId, markdown });
  },

  addTaskToPlan(planId: string, taskId: string, isMit: boolean, startTime?: string | null, endTime?: string | null): Promise<void> {
    return invoke('add_task_to_plan', { planId, taskId, isMit, startTime, endTime });
  },

  updatePlanTaskTime(planId: string, taskId: string, startTime: string, endTime: string): Promise<void> {
    return invoke('update_plan_task_time', { planId, taskId, startTime, endTime });
  },

  removeTaskFromPlan(planId: string, taskId: string): Promise<void> {
    return invoke('remove_task_from_plan', { planId, taskId });
  },

  reorderPlanTasks(planId: string, taskIds: string[]): Promise<void> {
    return invoke('reorder_plan_tasks', { planId, taskIds });
  },

  completeTaskInPlan(planId: string, taskId: string, actualMinutes?: number, completionNote?: string): Promise<void> {
    return invoke('complete_task_in_plan', { planId, taskId, actualMinutes: actualMinutes || null, completionNote: completionNote || null });
  },

  postponeTask(taskId: string, fromDate: string, toDate: string): Promise<void> {
    return invoke('postpone_task', { taskId, fromDate, toDate });
  },

  updateEveningReview(planId: string, params: EveningReviewParams): Promise<void> {
    return invoke('update_evening_review', { planId, params });
  },

  importFocusRecords(records: ImportFocusRecord[]): Promise<string> {
    return invoke('import_focus_records', { records });
  },
};
