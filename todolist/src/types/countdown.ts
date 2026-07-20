/** 预设分类定义 */
export interface CategoryPreset {
  label: string;
  icon: string;
  color: string;
}

/** Rust 返回的原始事件数据 */
export interface CountdownEvent {
  id: string;
  title: string;
  target_date: string;
  category: string;
  repeat_yearly: boolean;
  show_on_dashboard: boolean;
  color?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/** 创建参数 */
export interface CreateCountdownParams {
  title: string;
  target_date: string;
  category?: string;
  repeat_yearly?: boolean;
  show_on_dashboard?: boolean;
  color?: string;
  notes?: string;
}

/** 更新参数 */
export interface UpdateCountdownParams {
  title?: string;
  target_date?: string;
  category?: string;
  repeat_yearly?: boolean;
  show_on_dashboard?: boolean;
  color?: string;
  notes?: string;
}

/** 前端增强类型 — 含计算字段 */
export interface CountdownEventDisplay extends CountdownEvent {
  daysRemaining: number;
  displayText: string;      // "还剩 128 天" | "已过 89 天" | "今天"
  displayType: 'remaining' | 'passed' | 'today';
  categoryLabel: string;
  categoryIcon: string;
  categoryColor: string;
}
