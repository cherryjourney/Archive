export interface AdvisorMeeting {
  id: string; date: string; summary: string; feedback: string;
  action_items: string; next_goals: string;
  related_task_ids: string; related_experiment_ids: string;
  created_at: string; updated_at: string;
}

export interface AdvisorConfig {
  meeting_pattern: string;
  meeting_day_of_week: number;
  last_meeting_date: string | null;
}

export interface NextMeetingInfo {
  days_until: number;
  expected_date: string;
  pattern_label: string;
}

export interface CreateMeetingParams {
  date: string; summary?: string; feedback?: string;
  action_items?: string; next_goals?: string;
  related_task_ids?: string; related_experiment_ids?: string;
}
export interface UpdateMeetingParams {
  date?: string; summary?: string; feedback?: string;
  action_items?: string; next_goals?: string;
  related_task_ids?: string; related_experiment_ids?: string;
}
export interface UpdateAdvisorConfigParams {
  meeting_pattern?: string; meeting_day_of_week?: number;
  last_meeting_date?: string;
}
