import { invoke } from '@tauri-apps/api/core';
import type { AdvisorMeeting, AdvisorConfig, NextMeetingInfo, CreateMeetingParams, UpdateMeetingParams, UpdateAdvisorConfigParams } from '@/types/advisor';
export const advisorService = {
  list: () => invoke<AdvisorMeeting[]>('list_advisor_meetings'),
  get: (id: string) => invoke<AdvisorMeeting>('get_advisor_meeting', { id }),
  create: (id: string, params: CreateMeetingParams) => invoke<void>('create_advisor_meeting', { id, params }),
  update: (id: string, params: UpdateMeetingParams) => invoke<void>('update_advisor_meeting', { id, params }),
  delete: (id: string) => invoke<void>('delete_advisor_meeting', { id }),
  getConfig: () => invoke<AdvisorConfig>('get_advisor_config'),
  updateConfig: (params: UpdateAdvisorConfigParams) => invoke<void>('update_advisor_config', { params }),
  getNext: () => invoke<NextMeetingInfo>('get_next_meeting'),
  batchTasks: (meetingId: string, actionItemsJson: string) => invoke<string[]>('batch_create_tasks_from_meeting', { meetingId, actionItemsJson }),
};
