import { invoke } from '@tauri-apps/api/core';

export const userProfileService = {
  getProfile(key: string): Promise<string | null> {
    return invoke('get_user_profile', { key });
  },

  setProfile(key: string, value: string): Promise<void> {
    return invoke('set_user_profile', { key, value });
  },
};
