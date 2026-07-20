export interface Experiment {
  id: string; title: string; model: string; dataset: string;
  hyperparams: string; metrics: string; notes: string;
  is_baseline: boolean; project_id: string | null; paper_id: string | null;
  created_at: string; updated_at: string;
}
export interface CreateExperimentParams {
  title: string; model?: string; dataset?: string;
  hyperparams?: string; metrics?: string; notes?: string;
  is_baseline?: boolean; project_id?: string; paper_id?: string;
}
export interface UpdateExperimentParams {
  title?: string; model?: string; dataset?: string;
  hyperparams?: string; metrics?: string; notes?: string;
  is_baseline?: boolean; project_id?: string; paper_id?: string;
}
