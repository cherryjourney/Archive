import { invoke } from '@tauri-apps/api/core';
import type { LifeEvent, CreateLifeEventParams, UpdateLifeEventParams,
  LifeEventLink, CreateLifeEventLinkParams, LifeEventStats } from '@/types/lifeEvent';

export const lifeEventService = {
  async createEvent(params: CreateLifeEventParams): Promise<void> {
    const id = crypto.randomUUID();
    await invoke('create_life_event', { id, params });
  },

  async updateEvent(id: string, params: UpdateLifeEventParams): Promise<void> {
    await invoke('update_life_event', { id, params });
  },

  async deleteEvent(id: string): Promise<void> {
    await invoke('delete_life_event', { id });
  },

  async getAllEvents(): Promise<LifeEvent[]> {
    return invoke('get_all_life_events');
  },

  async getEvent(id: string): Promise<LifeEvent> {
    return invoke('get_life_event', { id });
  },

  async createLink(params: CreateLifeEventLinkParams): Promise<void> {
    const id = crypto.randomUUID();
    await invoke('create_life_event_link', { id, params });
  },

  async deleteLink(id: string): Promise<void> {
    await invoke('delete_life_event_link', { id });
  },

  async getLinks(lifeEventId: string): Promise<LifeEventLink[]> {
    return invoke('get_life_event_links', { lifeEventId });
  },

  async getStats(startDate: string, endDate: string): Promise<LifeEventStats> {
    return invoke('get_life_event_stats', { startDate, endDate });
  },
};

export const userProfileService = {
  async getBirthDate(): Promise<string | null> {
    return invoke('get_user_profile', { key: 'birth_date' });
  },

  async setBirthDate(birthDate: string): Promise<void> {
    await invoke('set_user_profile', { key: 'birth_date', value: birthDate });
  },
};
