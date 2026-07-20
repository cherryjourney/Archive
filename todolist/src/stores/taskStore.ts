import { create } from 'zustand';
import type { Task, CreateTaskParams, UpdateTaskParams, TaskFilter, TaskPage, TaskRelationship, CreateTaskRelationshipParams } from '@/types/task';
import { taskService } from '@/services/taskService';

interface TaskState {
  tasks: Task[];
  taskLibrary: Task[];
  currentTask: Task | null;
  total: number;
  loading: boolean;
  relationships: TaskRelationship[];
  fetchTasks: (filter?: TaskFilter) => Promise<void>;
  fetchTaskLibrary: () => Promise<void>;
  fetchTask: (id: string) => Promise<void>;
  createTask: (params: CreateTaskParams) => Promise<Task>;
  updateTask: (id: string, params: UpdateTaskParams) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  scheduleTask: (taskId: string, date: string) => Promise<void>;
  fetchRelationships: () => Promise<void>;
  createRelationship: (params: CreateTaskRelationshipParams) => Promise<TaskRelationship>;
  deleteRelationship: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  taskLibrary: [],
  currentTask: null,
  total: 0,
  loading: false,
  relationships: [],

  fetchTasks: async (filter) => {
    set({ loading: true });
    try {
      const result: TaskPage = await taskService.listTasks(filter || {});
      set({ tasks: result.tasks, total: result.total });
    } finally {
      set({ loading: false });
    }
  },

  fetchTaskLibrary: async () => {
    try {
      const library = await taskService.getTaskLibrary();
      set({ taskLibrary: library });
    } catch (e) {
      console.error('Failed to fetch task library:', e);
    }
  },

  fetchTask: async (id) => {
    try {
      const task = await taskService.getTask(id);
      set({ currentTask: task });
    } catch (e) {
      console.error('Failed to fetch task:', e);
    }
  },

  createTask: async (params) => {
    const task = await taskService.createTask(params);
    set((s) => ({ tasks: [task, ...s.tasks] }));
    return task;
  },

  updateTask: async (id, params) => {
    const task = await taskService.updateTask(id, params);
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? task : t)),
      currentTask: s.currentTask?.id === id ? task : s.currentTask,
    }));
    return task;
  },

  deleteTask: async (id) => {
    await taskService.deleteTask(id);
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
      currentTask: s.currentTask?.id === id ? null : s.currentTask,
    }));
  },

  scheduleTask: async (taskId, date) => {
    await taskService.scheduleTask(taskId, date);
    get().fetchTaskLibrary();
  },

  fetchRelationships: async () => {
    try {
      const relationships = await taskService.listRelationships();
      set({ relationships });
    } catch (e) {
      console.error('Failed to fetch relationships:', e);
    }
  },

  createRelationship: async (params) => {
    const rel = await taskService.createRelationship(params);
    set((s) => ({ relationships: [...s.relationships, rel] }));
    return rel;
  },

  deleteRelationship: async (id) => {
    await taskService.deleteRelationship(id);
    set((s) => ({ relationships: s.relationships.filter((r) => r.id !== id) }));
  },
}));
