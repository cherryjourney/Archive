// ====== 仪表盘汇总 ======
export interface DashboardStats {
  today_total: number;
  today_completed: number;
  today_completion_rate: number;
  streak_days: number;
  week_completion_rate: number;
  total_tasks: number;
}

// ====== 每日统计 ======
export interface DailyStat {
  date: string;
  total: number;
  completed: number;
  rate: number;
  efficiency: number | null;
}

// ====== 分类分布 ======
export interface CategoryStat {
  category_name: string;
  category_color: string;
  count: number;
  completed: number;
}

// ====== 热力图单元格 ======
export interface HeatmapCell {
  date: string;
  count: number;
  level: number; // 0-4
}

// ====== 优先级分布 ======
export interface PriorityStat {
  priority: number;
  label: string;
  count: number;
}

// ====== 预估vs实际 ======
export interface EstimateVsActual {
  date: string;
  estimated: number;
  actual: number;
}

// ====== 连续打卡 ======
export interface StreakData {
  current_streak: number;
  longest_streak: number;
  current_week_completed: number;
}

// ====== 生产力数据 ======
export interface ProductivityPoint {
  date: string;
  completed: number;
  total: number;
  rate: number;
}


