export interface GradMilestone {
  id: string; title: string; date: string; milestone_type: string;
  category: string; description: string; is_key: boolean;
  semester: string; created_at: string; updated_at: string;
}
export interface SemesterReview {
  id: string; semester: string; period_start: string | null; period_end: string | null;
  courses_count: number; experiments_count: number; papers_read: number;
  advisor_meetings: number; task_completion_rate: number;
  summary: string; created_at: string; updated_at: string;
}
export interface CreateMilestoneParams {
  title: string; date: string; milestone_type?: string;
  category?: string; description?: string; is_key?: boolean; semester?: string;
}
export interface UpdateMilestoneParams {
  title?: string; date?: string; milestone_type?: string;
  category?: string; description?: string; is_key?: boolean; semester?: string;
}
