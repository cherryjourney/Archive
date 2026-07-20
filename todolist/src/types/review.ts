export interface ReviewConfig {
  enabled: boolean;
  review_time: string;
  position: string;
}

export interface DailyReviewData {
  date: string;
  tasks_completed: number;
  tasks_total: number;
  pomodoro_minutes: number;
  experiments_updated: number;
  papers_read_today: number;
  finance_spent: number;
  quote: string;
  tomorrow_hint: string;
}

export interface UpdateReviewConfigParams {
  enabled?: boolean;
  review_time?: string;
  position?: string;
}
