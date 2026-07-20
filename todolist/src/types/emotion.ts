export interface EmotionEntry {
  id: string;
  date: string;
  emoji_1: string;
  emoji_2: string;
  emoji_3: string;
  emoji_4: string;
  emoji_5: string;
  control_score: number;
  notes: string;
  weather: string;
  task_completed_count: number;
  created_at: string;
  updated_at: string;
}

export interface SaveEmotionParams {
  date: string;
  emoji_1: string;
  emoji_2: string;
  emoji_3: string;
  emoji_4: string;
  emoji_5: string;
  control_score: number;
  notes: string;
  weather: string;
  task_completed_count: number;
}

export interface EmotionHeatmapCell {
  date: string;
  control_score: number;
  emoji_1: string;
}
