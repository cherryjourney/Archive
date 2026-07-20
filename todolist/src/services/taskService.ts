import { invoke } from '@tauri-apps/api/core';
import type { Task, CreateTaskParams, UpdateTaskParams, TaskFilter, TaskPage, TaskRelationship, CreateTaskRelationshipParams } from '@/types/task';

export const taskService = {
  createTask(params: CreateTaskParams): Promise<Task> {
    return invoke('create_task', { params });
  },

  updateTask(taskId: string, params: UpdateTaskParams): Promise<Task> {
    return invoke('update_task', { taskId, params });
  },

  deleteTask(taskId: string): Promise<void> {
    return invoke('delete_task', { taskId });
  },

  getTask(taskId: string): Promise<Task> {
    return invoke('get_task', { taskId });
  },

  listTasks(filter: TaskFilter): Promise<TaskPage> {
    return invoke('list_tasks', { filter });
  },

  reorderTasks(taskIds: string[]): Promise<void> {
    return invoke('reorder_tasks', { taskIds });
  },

  getTaskLibrary(): Promise<Task[]> {
    return invoke('get_task_library');
  },

  scheduleTask(taskId: string, date: string): Promise<void> {
    return invoke('schedule_task', { taskId, date });
  },

  // ── 任务关系 ──
  createRelationship(params: CreateTaskRelationshipParams): Promise<TaskRelationship> {
    return invoke('create_task_relationship', { params });
  },
  deleteRelationship(id: string): Promise<void> {
    return invoke('delete_task_relationship', { id });
  },
  listRelationships(): Promise<TaskRelationship[]> {
    return invoke('list_task_relationships');
  },
};
