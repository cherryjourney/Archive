export interface Memory {
  id: string;
  date: string;
  content: string;
  context: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMemoryParams {
  date: string;
  content: string;
  context: string;
}

export interface UpdateMemoryParams {
  content?: string;
  context?: string;
}
