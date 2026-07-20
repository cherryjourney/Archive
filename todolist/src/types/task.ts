// ====== 任务状态 ======
export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled' | 'paused';

// ====== 优先级 ======
export type TaskPriority = 0 | 1 | 2 | 3; // P0=紧急 P1=重要 P2=普通 P3=低优

export const PRIORITY_LABELS: Record<number, string> = {
  0: 'P0 紧急',
  1: 'P1 重要',
  2: 'P2 普通',
  3: 'P3 低优',
};

export const PRIORITY_COLORS: Record<number, string> = {
  0: '#E03131',
  1: '#F76707',
  2: '#4C6EF5',
  3: '#868E96',
};

// ====== 任务实体 ======
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  due_date: string | null;
  scheduled_date: string | null;
  is_recurring: boolean;
  recurring_rule: string | null;
  parent_task_id: string | null;
  sort_order: number;
  is_mit: boolean;
  completion_note: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  start_date: string | null;
  end_date: string | null;
  progress: number;
  color?: string;
}

// ====== 分类 ======
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

// ====== 标签（多级） ======
export interface Tag {
  id: string;
  name: string;
  parent_tag_id: string | null;
  color: string;
  created_at: string;
  children?: Tag[];
}

// ====== 创建/更新参数 ======
export interface CreateTaskParams {
  title: string;
  description?: string;
  priority?: number;
  estimated_minutes?: number | null;
  due_date?: string | null;
  scheduled_date?: string | null;
  parent_task_id?: string | null;
  category_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  progress?: number;
  color?: string;
}

export interface UpdateTaskParams {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: number;
  estimated_minutes?: number | null;
  actual_minutes?: number | null;
  due_date?: string | null;
  scheduled_date?: string | null;
  is_recurring?: boolean;
  recurring_rule?: string | null;
  category_id?: string | null;
  completion_note?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  progress?: number;
  color?: string;
}

export interface TaskFilter {
  status?: TaskStatus;
  category_id?: string;
  search?: string;
  scheduled_date?: string;
  page?: number;
  page_size?: number;
}

export interface TaskPage {
  tasks: Task[];
  total: number;
  page: number;
  page_size: number;
}

// ====== 任务依赖关系 ======
export interface TaskRelationship {
  id: string;
  source_task_id: string;
  target_task_id: string;
  relationship_type: 'depends_on' | 'related_to';
  is_blocking: boolean;
  label: string;
  created_at: string;
}

export interface CreateTaskRelationshipParams {
  source_task_id: string;
  target_task_id: string;
  relationship_type?: string;
  is_blocking?: boolean;
  label?: string;
}
