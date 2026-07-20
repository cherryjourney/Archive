/** 预设分类定义 */
export interface CategoryPreset {
  key: string;
  label: string;
  color: string;
}

/** Rust 返回的原始事件数据 */
export interface LifeEvent {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  category: string;
  color?: string;
  start_precision: string;   // 'month' | 'day'
  end_precision: string;     // 'month' | 'day'
  is_highlighted: boolean;
  created_at: string;
  updated_at: string;
}

/** 创建参数 */
export interface CreateLifeEventParams {
  title: string;
  description?: string;
  start_date: string;
  end_date?: string | null;
  category?: string;
  color?: string;
  start_precision?: string;
  end_precision?: string;
  is_highlighted?: boolean;
}

/** 更新参数 */
export interface UpdateLifeEventParams {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string | null;
  category?: string;
  color?: string;
  start_precision?: string;
  end_precision?: string;
  is_highlighted?: boolean;
}

/** 关联链接 */
export interface LifeEventLink {
  id: string;
  life_event_id: string;
  entity_type: string;   // 'task' | 'paper' | 'experiment' | 'countdown' | 'city' | 'asset'
  entity_id: string;
  label: string;
  created_at: string;
}

/** 创建链接参数 */
export interface CreateLifeEventLinkParams {
  life_event_id: string;
  entity_type: string;
  entity_id: string;
  label?: string;
}

/** 自动统计 */
export interface LifeEventStats {
  task_count: number;
  paper_count: number;
  experiment_count: number;
}

/** 前端增强展示类型 */
export interface LifeEventDisplay extends LifeEvent {
  durationText: string;     // "1年9个月" | "至今（已过 2年3个月）"
  isOngoing: boolean;       // end_date === null
  categoryColor: string;    // 最终颜色（分类默认色或自定义色）
  categoryLabel: string;    // 分类中文名
  startPrecision: string;
  endPrecision: string;
}
