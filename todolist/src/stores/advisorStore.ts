import { create } from 'zustand';
import { advisorService } from '@/services/advisorService';
import type { AdvisorMeeting, AdvisorConfig, NextMeetingInfo, CreateMeetingParams, UpdateMeetingParams, UpdateAdvisorConfigParams } from '@/types/advisor';

interface AdvisorState {
  meetings: AdvisorMeeting[]; config: AdvisorConfig | null;
  nextMeeting: NextMeetingInfo | null; loading: boolean;
  fetchAll: () => Promise<void>;
  create: (params: CreateMeetingParams) => Promise<void>;
  update: (id: string, params: UpdateMeetingParams) => Promise<void>;
  remove: (id: string) => Promise<void>;
  fetchConfig: () => Promise<void>;
  updateConfig: (params: UpdateAdvisorConfigParams) => Promise<void>;
  batchTasks: (meetingId: string, actionItemsJson: string) => Promise<string[]>;
}

export const useAdvisorStore = create<AdvisorState>((set, get) => ({
  meetings: [], config: null, nextMeeting: null, loading: false,
  fetchAll: async () => {
    set({ loading: true });
    try {
      const [meetings, config, next] = await Promise.all([
        advisorService.list(), advisorService.getConfig(), advisorService.getNext(),
      ]);
      set({ meetings, config, nextMeeting: next, loading: false });
    } catch { set({ loading: false }); }
  },
  create: async (params) => {
    const id = crypto.randomUUID();
    await advisorService.create(id, params);
    await get().fetchAll();
  },
  update: async (id, params) => { await advisorService.update(id, params); await get().fetchAll(); },
  remove: async (id) => { await advisorService.delete(id); await get().fetchAll(); },
  fetchConfig: async () => { const c = await advisorService.getConfig(); set({ config: c }); },
  updateConfig: async (params) => { await advisorService.updateConfig(params); await get().fetchAll(); },
  batchTasks: async (meetingId, json) => {
    const ids = await advisorService.batchTasks(meetingId, json);
    await get().fetchAll();
    return ids;
  },
}));
