import { invoke } from '@tauri-apps/api/core';
import type { GradMilestone, SemesterReview, CreateMilestoneParams, UpdateMilestoneParams } from '@/types/grad';
export const gradService = {
  listMilestones: () => invoke<GradMilestone[]>('list_milestones'),
  createMilestone: (id: string, params: CreateMilestoneParams) => invoke<void>('create_milestone', { id, params }),
  updateMilestone: (id: string, params: UpdateMilestoneParams) => invoke<void>('update_milestone', { id, params }),
  deleteMilestone: (id: string) => invoke<void>('delete_milestone', { id }),
  generateReview: (id: string, semester: string, periodStart: string, periodEnd: string) => invoke<SemesterReview>('generate_semester_review', { id, semester, periodStart, periodEnd }),
  listReviews: () => invoke<SemesterReview[]>('list_semester_reviews'),
};
