export interface Asset {
  id: string;
  name: string;
  category: string;
  purchase_date: string;
  price: number;
  currency: string;
  quantity: number;
  brand: string;
  model: string;
  warranty_expiry: string | null;
  status: string;
  condition: string;
  notes: string;
  is_sentimental: boolean;
  origin: string;
  related_people: string;
  related_stories: string;
  retired_at: string | null;
  farewell_message: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAssetParams {
  name: string;
  category?: string;
  purchase_date: string;
  price?: number;
  currency?: string;
  quantity?: number;
  brand?: string;
  model?: string;
  warranty_expiry?: string | null;
  status?: string;
  condition?: string;
  notes?: string;
}

export interface UpdateAssetParams {
  name?: string;
  category?: string;
  purchase_date?: string;
  price?: number;
  currency?: string;
  quantity?: number;
  brand?: string;
  model?: string;
  warranty_expiry?: string | null;
  status?: string;
  condition?: string;
  notes?: string;
}

export interface AssetStats {
  total_value: number;
  total_count: number;
}

/** Preset categories (7) */
export const ASSET_CATEGORIES = [
  { key: 'electronics', label: '电子数码', icon: '💻' },
  { key: 'appliances', label: '家居电器', icon: '🏠' },
  { key: 'books', label: '书籍文具', icon: '📚' },
  { key: 'entertainment', label: '娱乐休闲', icon: '🎮' },
  { key: 'tools', label: '工具设备', icon: '🛠️' },
  { key: 'sports', label: '运动户外', icon: '🏃' },
  { key: 'other', label: '其他', icon: '🎯' },
] as const;

export const ASSET_STATUSES = [
  { key: 'in_use', label: '使用中', color: '#10B981' },
  { key: 'idle', label: '闲置', color: '#F59E0B' },
  { key: 'sold', label: '已出售', color: '#6366F1' },
  { key: 'broken', label: '已损坏', color: '#EF4444' },
  { key: 'lost', label: '已丢失', color: '#9CA3AF' },
] as const;

export const ASSET_CONDITIONS = [
  { key: 'new', label: '全新' },
  { key: 'good', label: '良好' },
  { key: 'fair', label: '一般' },
  { key: 'poor', label: '较差' },
] as const;

export function getCategoryLabel(key: string): string {
  return ASSET_CATEGORIES.find(c => c.key === key)?.label ?? key;
}

export function getCategoryIcon(key: string): string {
  return ASSET_CATEGORIES.find(c => c.key === key)?.icon ?? '🎯';
}

export function getStatusLabel(key: string): string {
  return ASSET_STATUSES.find(s => s.key === key)?.label ?? key;
}

export function getStatusColor(key: string): string {
  return ASSET_STATUSES.find(s => s.key === key)?.color ?? '#9CA3AF';
}

export function getConditionLabel(key: string): string {
  return ASSET_CONDITIONS.find(c => c.key === key)?.label ?? key;
}

/** Calculate warranty remaining days. Returns null if no warranty. Negative = expired. */
export function getWarrantyDays(expiry: string | null): number | null {
  if (!expiry) return null;
  const now = new Date();
  const end = new Date(expiry);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/** Warranty color based on remaining days */
export function getWarrantyColor(days: number | null): string | undefined {
  if (days === null) return undefined;
  if (days < 0) return '#9CA3AF'; // expired - gray
  if (days <= 30) return '#EF4444'; // expiring soon - red
  if (days <= 90) return '#F59E0B'; // warning - yellow
  return '#10B981'; // fine - green
}

export function formatWarranty(days: number | null): string | null {
  if (days === null) return null;
  if (days < 0) return `已过期 ${Math.abs(days)} 天`;
  if (days === 0) return '今日到期';
  if (days <= 30) return `还有 ${days} 天`;
  if (days <= 90) return `剩 ${days} 天`;
  return `剩余 ${days} 天`;
}
