import { invoke } from '@tauri-apps/api/core';
import type { Experiment, CreateExperimentParams, UpdateExperimentParams } from '@/types/experiment';

export const experimentService = {
  create: (params: CreateExperimentParams) => invoke<Experiment>('create_experiment', { params }),
  update: (expId: string, params: UpdateExperimentParams) => invoke<Experiment>('update_experiment', { expId, params }),
  delete: (expId: string) => invoke<void>('delete_experiment', { expId }),
  get: (expId: string) => invoke<Experiment>('get_experiment', { expId }),
  list: () => invoke<Experiment[]>('list_experiments'),
};
