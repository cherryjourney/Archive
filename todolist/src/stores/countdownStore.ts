import { create } from 'zustand';
import { countdownService } from '@/services/countdownService';
import type { CountdownEvent, CountdownEventDisplay, CreateCountdownParams, UpdateCountdownParams } from '@/types/countdown';
import { toDisplayEvent } from '@/utils/countdownPresets';

interface CountdownState {
  events: CountdownEvent[];
  dashboardEvents: CountdownEvent[];
  loading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
  create: (params: CreateCountdownParams) => Promise<void>;
  update: (id: string, params: UpdateCountdownParams) => Promise<void>;
  remove: (id: string) => Promise<void>;
  displayEvents: () => CountdownEventDisplay[];
  dashboardDisplay: () => CountdownEventDisplay[];
}

export const useCountdownStore = create<CountdownState>((set, get) => ({
  events: [],
  dashboardEvents: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const events = await countdownService.getAllEvents();
      set({ events, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  fetchDashboard: async () => {
    try {
      const events = await countdownService.getDashboardEvents();
      set({ dashboardEvents: events });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  create: async (params) => {
    set({ error: null });
    try {
      await countdownService.createEvent(params);
      await get().fetchAll();
      await get().fetchDashboard();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  update: async (id, params) => {
    set({ error: null });
    try {
      await countdownService.updateEvent(id, params);
      await get().fetchAll();
      await get().fetchDashboard();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  remove: async (id) => {
    set({ error: null });
    try {
      await countdownService.deleteEvent(id);
      await get().fetchAll();
      await get().fetchDashboard();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  displayEvents: () => get().events.map(toDisplayEvent),
  dashboardDisplay: () => get().dashboardEvents.map(toDisplayEvent),
}));
