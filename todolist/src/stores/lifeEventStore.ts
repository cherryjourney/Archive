import { create } from 'zustand';
import { lifeEventService, userProfileService } from '@/services/lifeEventService';
import type { LifeEvent, LifeEventDisplay, LifeEventLink, LifeEventStats,
  CreateLifeEventParams, UpdateLifeEventParams, CreateLifeEventLinkParams } from '@/types/lifeEvent';
import { toDisplayEvent } from '@/utils/lifeEventPresets';

interface LifeEventState {
  events: LifeEvent[];
  selectedId: string | null;
  selectedLinks: LifeEventLink[];
  selectedStats: LifeEventStats | null;
  loading: boolean;
  error: string | null;
  birthDate: string | null;
  birthDateLoaded: boolean;

  fetchAll: () => Promise<void>;
  select: (id: string) => Promise<void>;
  create: (params: CreateLifeEventParams) => Promise<void>;
  update: (id: string, params: UpdateLifeEventParams) => Promise<void>;
  remove: (id: string) => Promise<void>;
  addLink: (params: CreateLifeEventLinkParams) => Promise<void>;
  removeLink: (id: string) => Promise<void>;
  fetchBirthDate: () => Promise<void>;
  setBirthDate: (date: string) => Promise<void>;

  displayEvents: () => LifeEventDisplay[];
  selectedDisplay: () => LifeEventDisplay | null;
}

export const useLifeEventStore = create<LifeEventState>((set, get) => ({
  events: [],
  selectedId: null,
  selectedLinks: [],
  selectedStats: null,
  loading: false,
  error: null,
  birthDate: null,
  birthDateLoaded: false,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const events = await lifeEventService.getAllEvents();
      set({ events, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  select: async (id: string) => {
    set({ selectedId: id, selectedLinks: [], selectedStats: null });
    try {
      const [links, event] = await Promise.all([
        lifeEventService.getLinks(id),
        lifeEventService.getEvent(id),
      ]);
      // Auto-statistics: use the event's time range
      const endDate = event.end_date || new Date().toISOString().slice(0, 10);
      const stats = await lifeEventService.getStats(event.start_date, endDate);
      set({ selectedLinks: links, selectedStats: stats });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  create: async (params) => {
    set({ error: null });
    try {
      await lifeEventService.createEvent(params);
      await get().fetchAll();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  update: async (id, params) => {
    set({ error: null });
    try {
      await lifeEventService.updateEvent(id, params);
      await get().fetchAll();
      // Refresh the selected panel
      if (get().selectedId === id) {
        await get().select(id);
      }
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  remove: async (id) => {
    set({ error: null });
    try {
      await lifeEventService.deleteEvent(id);
      if (get().selectedId === id) {
        set({ selectedId: null, selectedLinks: [], selectedStats: null });
      }
      await get().fetchAll();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  addLink: async (params) => {
    try {
      await lifeEventService.createLink(params);
      const sid = get().selectedId;
      if (sid) {
        const links = await lifeEventService.getLinks(sid);
        set({ selectedLinks: links });
      }
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  removeLink: async (id) => {
    try {
      await lifeEventService.deleteLink(id);
      const sid = get().selectedId;
      if (sid) {
        const links = await lifeEventService.getLinks(sid);
        set({ selectedLinks: links });
      }
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  fetchBirthDate: async () => {
    try {
      const date = await userProfileService.getBirthDate();
      set({ birthDate: date && date.length > 0 ? date : null, birthDateLoaded: true });
    } catch (e) {
      set({ error: String(e), birthDateLoaded: true });
    }
  },

  setBirthDate: async (date: string) => {
    try {
      await userProfileService.setBirthDate(date);
      set({ birthDate: date });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  displayEvents: () => get().events.map(toDisplayEvent),
  selectedDisplay: () => {
    const { events, selectedId } = get();
    const event = events.find(e => e.id === selectedId);
    return event ? toDisplayEvent(event) : null;
  },
}));
