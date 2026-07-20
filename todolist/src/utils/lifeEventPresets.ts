import dayjs from 'dayjs';
import type { CategoryPreset, LifeEvent, LifeEventDisplay } from '@/types/lifeEvent';

export const LIFE_EVENT_CATEGORIES: Record<string, CategoryPreset> = {
  edu:          { key: 'edu',          label: '教育',   color: '#3B82F6' },
  exam:         { key: 'exam',         label: '考试',   color: '#F97316' },
  career:       { key: 'career',       label: '职业',   color: '#10B981' },
  award:        { key: 'award',        label: '获奖',   color: '#F59E0B' },
  residence:    { key: 'residence',    label: '居住',   color: '#6366F1' },
  relationship: { key: 'relationship', label: '感情',   color: '#EC4899' },
  growth:       { key: 'growth',       label: '个人成长', color: '#8B5CF6' },
  health:       { key: 'health',       label: '健康',   color: '#06B6D4' },
  travel:       { key: 'travel',       label: '旅行',   color: '#84CC16' },
  other:        { key: 'other',        label: '其他',   color: '#6B7280' },
};

export const CATEGORY_KEYS = Object.keys(LIFE_EVENT_CATEGORIES);

export function getCategoryInfo(category: string): CategoryPreset {
  const preset = LIFE_EVENT_CATEGORIES[category];
  if (preset) {
    return preset;
  }
  return { key: category, label: category, color: '#6B7280' };
}

/** 计算持续时长的展示文本 */
export function calcDurationText(startDate: string, endDate: string | null): string {
  const start = dayjs(startDate);
  if (!endDate) {
    // 至今
    const now = dayjs();
    const totalMonths = now.diff(start, 'month');
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const parts: string[] = [];
    if (years > 0) parts.push(`${years}年`);
    if (months > 0) parts.push(`${months}个月`);
    if (parts.length === 0) parts.push('不到1个月');
    return `至今（已过 ${parts.join('')}）`;
  }

  const end = dayjs(endDate);
  const totalMonths = end.diff(start, 'month');
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years}年`);
  if (months > 0) parts.push(`${months}个月`);
  if (parts.length === 0) parts.push('不到1个月');
  return parts.join('');
}

/** Format a date string based on precision. Example: formatDate('2009-09-01', 'day') → '2009年9月1日'; formatDate('2009-09-01', 'month') → '2009年9月' */
export function formatDate(dateStr: string, precision: string): string {
  const d = dayjs(dateStr);
  if (precision === 'day') {
    return d.format('YYYY年M月D日');
  }
  return d.format('YYYY年M月');
}

/** 将原始事件转换为展示事件 */
export function toDisplayEvent(event: LifeEvent): LifeEventDisplay {
  const catInfo = getCategoryInfo(event.category);
  return {
    ...event,
    durationText: calcDurationText(event.start_date, event.end_date),
    isOngoing: !event.end_date,
    categoryColor: catInfo.color,
    categoryLabel: catInfo.label,
    startPrecision: event.start_precision || 'month',
    endPrecision: event.end_precision || 'month',
  };
}
