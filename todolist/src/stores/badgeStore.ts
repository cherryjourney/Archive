import { create } from 'zustand';
import { badgeService } from '@/services/badgeService';
import type { BadgeWithStatus } from '@/types/badge';

interface BadgeState {
  badges: BadgeWithStatus[];
  newBadgeCount: number;
  loading: boolean;
  fetchAll: () => Promise<void>;
  checkAndUpdate: () => Promise<void>;
  markNotified: () => Promise<void>;
}

export const useBadgeStore = create<BadgeState>((set, get) => ({
  badges: [],
  newBadgeCount: 0,
  loading: false,

  fetchAll: async () => {
    set({ loading: true });
    try {
      const badges = await badgeService.listBadges();
      const newCount = badges.filter(
        (b) => b.user_badge?.unlocked && !b.user_badge?.notified
      ).length;
      set({ badges, newBadgeCount: newCount, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  checkAndUpdate: async () => {
    try {
      const badges = await badgeService.checkBadges();
      const newCount = badges.filter(
        (b) => b.user_badge?.unlocked && !b.user_badge?.notified
      ).length;
      set({ badges, newBadgeCount: newCount });
    } catch { /* ignore */ }
  },

  markNotified: async () => {
    try {
      await badgeService.markBadgesNotified();
      set({ newBadgeCount: 0 });
    } catch { /* ignore */ }
  },
}));
