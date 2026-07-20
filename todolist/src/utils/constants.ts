/** 应用名称 */
export const APP_NAME = 'Archive · 存迹';

/** 应用副标题 */
export const APP_SUBTITLE = '每一段认真度过的晨昏，皆在此间。';

/** 侧边栏宽度 */
export const SIDEBAR_WIDTH = 220;
export const SIDEBAR_COLLAPSED_WIDTH = 64;

/** 图表颜色 palette */
export const CHART_COLORS = [
  '#4c6ef5', // primary
  '#69db7c', // mint
  '#ffd43b', // amber
  '#ff7f7f', // coral
  '#b197fc', // lavender
  '#74c0fc', // sky
  '#f783ac', // pink
  '#ff922b', // orange
  '#20c997', // teal
];

/** 热力图颜色等级 */
export const HEATMAP_COLORS = [
  '#ebedf0', // level 0
  '#c5d0f2', // level 1
  '#8fa3eb', // level 2
  '#5c7cfa', // level 3
  '#3b5bdb', // level 4
];

import type { TaskStatus } from '@/types/task';

/** 任务状态 → 条形图颜色 */
export const STATUS_BAR_COLORS: Record<TaskStatus, string> = {
  pending: '#8b85b0',
  in_progress: '#4C6EF5',
  review: '#f59f00',
  completed: '#12b886',
  cancelled: '#adb5bd',
  paused: '#f76707',
};

/** 时间线任务随机颜色调色板（WCAG AA 验证，亮/暗双模式可用） */
export const TIMELINE_TASK_COLORS = [
  '#2563EB', '#7C3AED', '#DC2626', '#EA580C', '#CA8A04', '#059669',
  '#0891B2', '#4F46E5', '#BE185D', '#65A30D', '#9333EA', '#0F766E',
];

/** 从调色板随机选取一个颜色 */
export function randomTimelineColor(): string {
  return TIMELINE_TASK_COLORS[Math.floor(Math.random() * TIMELINE_TASK_COLORS.length)];
}

/** 导航菜单项 */
export const NAV_ITEMS = [
  { key: '/', label: '今日概览', icon: 'DashboardOutlined' },
  { key: '/plan', label: '每日计划', icon: 'ScheduleOutlined' },

  { key: '/charts', label: '数据看板', icon: 'AreaChartOutlined' },
  { key: '/settings', label: '设置', icon: 'SettingOutlined' },
];
