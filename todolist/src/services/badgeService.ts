import { invoke } from '@tauri-apps/api/core';
import type { BadgeWithStatus } from '@/types/badge';

export const badgeService = {
  listBadges: () => invoke<BadgeWithStatus[]>('list_badges'),
  checkBadges: () => invoke<BadgeWithStatus[]>('check_badges'),
  getNewBadgeCount: () => invoke<number>('get_new_badge_count'),
  markBadgesNotified: () => invoke<void>('mark_badges_notified'),
};
