import { invoke } from '@tauri-apps/api/core';
import type { CountdownEvent, CreateCountdownParams, UpdateCountdownParams } from '@/types/countdown';

export const countdownService = {
  async createEvent(params: CreateCountdownParams): Promise<void> {
    const id = crypto.randomUUID();
    await invoke('create_countdown_event', { id, params });
  },

  async updateEvent(id: string, params: UpdateCountdownParams): Promise<void> {
    await invoke('update_countdown_event', { id, params });
  },

  async deleteEvent(id: string): Promise<void> {
    await invoke('delete_countdown_event', { id });
  },

  async getAllEvents(): Promise<CountdownEvent[]> {
    return invoke('get_all_countdown_events');
  },

  async getDashboardEvents(): Promise<CountdownEvent[]> {
    return invoke('get_dashboard_countdown_events');
  },
};
