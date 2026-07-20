export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  criteria_type: string;
  criteria_value: number;
  created_at: string;
}

export interface UserBadge {
  id: string;
  badge_id: string;
  progress: number;
  unlocked: boolean;
  unlocked_at: string | null;
  notified: boolean;
}

export interface BadgeWithStatus {
  badge: Badge;
  user_badge: UserBadge | null;
}
