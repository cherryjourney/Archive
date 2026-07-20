import { create } from 'zustand';
import type { Experiment, CreateExperimentParams, UpdateExperimentParams } from '@/types/experiment';
import { experimentService } from '@/services/experimentService';

interface ExperimentState {
  experiments: Experiment[];
  loading: boolean;
  fetchExperiments: () => Promise<void>;
  createExperiment: (params: CreateExperimentParams) => Promise<Experiment>;
  updateExperiment: (id: string, params: UpdateExperimentParams) => Promise<Experiment>;
  deleteExperiment: (id: string) => Promise<void>;
}
export const useExperimentStore = create<ExperimentState>((set) => ({
  experiments: [], loading: false,
  fetchExperiments: async () => { set({ loading: true }); try { const exps = await experimentService.list(); set({ experiments: exps }); } finally { set({ loading: false }); } },
  createExperiment: async (params) => { const e = await experimentService.create(params); set((s) => ({ experiments: [e, ...s.experiments] })); return e; },
  updateExperiment: async (id, params) => { const e = await experimentService.update(id, params); set((s) => ({ experiments: s.experiments.map((ee) => ee.id === id ? e : ee) })); return e; },
  deleteExperiment: async (id) => { await experimentService.delete(id); set((s) => ({ experiments: s.experiments.filter((ee) => ee.id !== id) })); },
}));
