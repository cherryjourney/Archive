/** 打包清单 */
export interface PackingList {
  id: string;
  title: string;
  destination: string;
  departure_date: string | null;
  return_date: string | null;
  notes: string;
  is_template: boolean;
  created_at: string;
  updated_at: string;
  /** 已打包数量（列表接口可能返回） */
  checked_count?: number;
  /** 总物品数量（列表接口可能返回） */
  total_count?: number;
}

/** 创建清单参数 */
export interface CreatePackingListParams {
  title: string;
  destination?: string;
  departure_date?: string | null;
  return_date?: string | null;
  notes?: string;
  is_template?: boolean;
}

/** 更新清单参数 */
export interface UpdatePackingListParams {
  title?: string;
  destination?: string;
  departure_date?: string | null;
  return_date?: string | null;
  notes?: string;
  is_template?: boolean;
}

/** 打包物品 */
export interface PackingItem {
  id: string;
  list_id: string;
  name: string;
  category: string;
  quantity: number;
  is_packed: boolean;
  sort_order: number;
  notes: string;
  created_at: string;
}

/** 添加物品参数 */
export interface CreatePackingItemParams {
  list_id: string;
  name: string;
  category?: string;
  quantity?: number;
  notes?: string;
}

/** 更新物品参数 */
export interface UpdatePackingItemParams {
  name?: string;
  category?: string;
  quantity?: number;
  notes?: string;
}

/** 拖拽排序参数 */
export interface ReorderItemsParams {
  items: { id: string; sort_order: number }[];
}

/** 清单详情 */
export interface PackingListDetail {
  list: PackingList;
  items: PackingItem[];
}

/** 预设分类 */
export const PACKING_CATEGORIES: { key: string; label: string; icon: string }[] = [
  { key: 'electronics', label: '电子设备', icon: '📱' },
  { key: 'clothing', label: '衣物', icon: '👕' },
  { key: 'toiletries', label: '洗漱护肤', icon: '🧴' },
  { key: 'medicine', label: '药品', icon: '💊' },
  { key: 'documents', label: '证件', icon: '📄' },
  { key: 'other', label: '其他', icon: '🎒' },
];

export function getCategoryLabel(key: string): string {
  return PACKING_CATEGORIES.find(c => c.key === key)?.label ?? key;
}

export function getCategoryIcon(key: string): string {
  return PACKING_CATEGORIES.find(c => c.key === key)?.icon ?? '📦';
}
