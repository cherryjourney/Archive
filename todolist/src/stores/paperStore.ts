import { create } from 'zustand';
import type { Paper, CreatePaperParams, UpdatePaperParams } from '@/types/paper';
import { paperService } from '@/services/paperService';

interface PaperState {
  papers: Paper[];
  loading: boolean;
  fetchPapers: () => Promise<void>;
  createPaper: (params: CreatePaperParams) => Promise<Paper>;
  updatePaper: (id: string, params: UpdatePaperParams) => Promise<Paper>;
  deletePaper: (id: string) => Promise<void>;
}
export const usePaperStore = create<PaperState>((set) => ({
  papers: [], loading: false,
  fetchPapers: async () => { set({ loading: true }); try { const papers = await paperService.list(); set({ papers }); } finally { set({ loading: false }); } },
  createPaper: async (params) => { const p = await paperService.create(params); set((s) => ({ papers: [p, ...s.papers] })); return p; },
  updatePaper: async (id, params) => { const p = await paperService.update(id, params); set((s) => ({ papers: s.papers.map((pp) => pp.id === id ? p : pp) })); return p; },
  deletePaper: async (id) => { await paperService.delete(id); set((s) => ({ papers: s.papers.filter((pp) => pp.id !== id) })); },
}));
