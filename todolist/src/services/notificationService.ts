import { invoke } from '@tauri-apps/api/core';

export interface NotificationConfig {
  daily_reminder_enabled: boolean;
  daily_reminder_time: string;
  deadline_reminder_enabled: boolean;
  deadline_30min_enabled: boolean;
  deadline_1hour_enabled: boolean;
  deadline_1day_enabled: boolean;
  task_reminder_enabled: boolean;
  task_reminder_advance_minutes: number;
}

export const notificationService = {
  getConfig(): Promise<NotificationConfig> {
    return invoke('get_notification_config');
  },
  updateConfig(config: NotificationConfig): Promise<void> {
    return invoke('update_notification_config', { config });
  },
  sendTest(): Promise<void> {
    return invoke('send_test_notification');
  },
};
