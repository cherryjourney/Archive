export type PaperStatus = 'to_read' | 'reading' | 'read';
export interface Paper {
  id: string; title: string; authors: string; year: number | null;
  venue: string; doi: string; arxiv_id: string;
  status: string; contribution: string; notes: string;
  rating: number; created_at: string; updated_at: string;
}
export interface CreatePaperParams {
  title: string; authors?: string; year?: number; venue?: string;
  doi?: string; arxiv_id?: string; status?: string;
}
export interface UpdatePaperParams {
  title?: string; authors?: string; year?: number; venue?: string;
  doi?: string; arxiv_id?: string; status?: string;
  contribution?: string; notes?: string; rating?: number;
}
