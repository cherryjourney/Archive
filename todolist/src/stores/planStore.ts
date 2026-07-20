import { create } from 'zustand';
import type { DailyPlan, EveningReviewParams, ImportFocusRecord } from '@/types/plan';
import { planService } from '@/services/planService';
import { todayStr } from '@/utils/date';

interface PlanState {
  currentPlan: DailyPlan | null;
  selectedDate: string;
  loading: boolean;
  importing: boolean;
  fetchPlan: (date?: string) => Promise<void>;
  addTaskToPlan: (taskId: string, isMit?: boolean, startTime?: string | null, endTime?: string | null) => Promise<void>;
  updateTaskTime: (taskId: string, startTime: string, endTime: string) => Promise<void>;
  removeTaskFromPlan: (taskId: string) => Promise<void>;
  completeTask: (taskId: string, actualMinutes?: number, completionNote?: string) => Promise<void>;
  postponeTask: (taskId: string, toDate: string) => Promise<void>;
  updateEveningReview: (params: EveningReviewParams) => Promise<void>;
  setSelectedDate: (date: string) => void;
  importFocusRecords: (records: ImportFocusRecord[]) => Promise<string>;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  currentPlan: null,
  selectedDate: todayStr(),
  loading: false,
  importing: false,

  fetchPlan: async (date) => {
    const d = date || get().selectedDate;
    set({ loading: true, selectedDate: d });
    try {
      const plan = await planService.getDailyPlan(d);
      set({ currentPlan: plan });
    } finally {
      set({ loading: false });
    }
  },

  addTaskToPlan: async (taskId, isMit = false, startTime = null, endTime = null) => {
    const plan = get().currentPlan;
    if (!plan) return;
    await planService.addTaskToPlan(plan.id, taskId, isMit, startTime, endTime);
    get().fetchPlan();
  },

  updateTaskTime: async (taskId, startTime, endTime) => {
    const plan = get().currentPlan;
    if (!plan) return;
    await planService.updatePlanTaskTime(plan.id, taskId, startTime, endTime);
    get().fetchPlan();
  },

  removeTaskFromPlan: async (taskId) => {
    const plan = get().currentPlan;
    if (!plan) return;
    await planService.removeTaskFromPlan(plan.id, taskId);
    get().fetchPlan();
  },

  completeTask: async (taskId, actualMinutes, completionNote) => {
    const plan = get().currentPlan;
    if (!plan) return;
    await planService.completeTaskInPlan(plan.id, taskId, actualMinutes, completionNote);
    get().fetchPlan();
  },

  postponeTask: async (taskId, toDate) => {
    const plan = get().currentPlan;
    if (!plan) return;
    await planService.postponeTask(taskId, plan.date, toDate);
    get().fetchPlan();
  },

  updateEveningReview: async (params) => {
    const plan = get().currentPlan;
    if (!plan) return;
    await planService.updateEveningReview(plan.id, params);
    get().fetchPlan();
  },

  setSelectedDate: (date) => set({ selectedDate: date }),

  importFocusRecords: async (records) => {
    set({ importing: true });
    try {
      const result = await planService.importFocusRecords(records);
      set({ importing: false });
      return result;
    } catch (e) {
      set({ importing: false });
      throw e;
    }
  },
}));
