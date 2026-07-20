import { create } from 'zustand';
import { gradService } from '@/services/gradService';
import type { GradMilestone, SemesterReview, CreateMilestoneParams, UpdateMilestoneParams } from '@/types/grad';

interface GradState {
  milestones: GradMilestone[]; reviews: SemesterReview[]; loading: boolean;
  fetchAll: () => Promise<void>;
  createMilestone: (params: CreateMilestoneParams) => Promise<void>;
  updateMilestone: (id: string, params: UpdateMilestoneParams) => Promise<void>;
  removeMilestone: (id: string) => Promise<void>;
  generateReview: (semester: string, start: string, end: string) => Promise<SemesterReview>;
}

export const useGradStore = create<GradState>((set, get) => ({
  milestones: [], reviews: [], loading: false,
  fetchAll: async () => {
    set({ loading: true });
    try {
      const [milestones, reviews] = await Promise.all([gradService.listMilestones(), gradService.listReviews()]);
      set({ milestones, reviews, loading: false });
    } catch { set({ loading: false }); }
  },
  createMilestone: async (params) => {
    const id = crypto.randomUUID(); await gradService.createMilestone(id, params); await get().fetchAll();
  },
  updateMilestone: async (id, params) => { await gradService.updateMilestone(id, params); await get().fetchAll(); },
  removeMilestone: async (id) => { await gradService.deleteMilestone(id); await get().fetchAll(); },
  generateReview: async (semester, start, end) => {
    const id = crypto.randomUUID();
    const review = await gradService.generateReview(id, semester, start, end);
    await get().fetchAll();
    return review;
  },
}));
