import dayjs from 'dayjs';
import type { CategoryPreset, CountdownEvent, CountdownEventDisplay } from '@/types/countdown';

export const PRESET_CATEGORIES: Record<string, CategoryPreset> = {
  生日:   { label: '生日',   icon: '🎂', color: '#EC4899' },
  纪念日: { label: '纪念日', icon: '💍', color: '#F59E0B' },
  婚礼:   { label: '婚礼',   icon: '💒', color: '#DC2626' },
  截止日: { label: '截止日', icon: '📄', color: '#2563EB' },
  考试:   { label: '考试',   icon: '📝', color: '#7C3AED' },
  节日:   { label: '节日',   icon: '🎉', color: '#F97316' },
  旅行:   { label: '旅行',   icon: '✈️', color: '#06B6D4' },
  毕业:   { label: '毕业',   icon: '🎓', color: '#0891B2' },
  目标:   { label: '目标',   icon: '🎯', color: '#059669' },
  学习:   { label: '学习',   icon: '📚', color: '#6366F1' },
  运动:   { label: '运动',   icon: '🏋️', color: '#0EA5E9' },
  工作:   { label: '工作',   icon: '💼', color: '#64748B' },
  健康:   { label: '健康',   icon: '🏥', color: '#14B8A6' },
  还款:   { label: '还款',   icon: '💰', color: '#D97706' },
  其他:   { label: '其他',   icon: '📌', color: '#94A3B8' },
};

/** 获取分类的展示信息，支持自定义分类 */
export function getCategoryInfo(category: string, customColor?: string): CategoryPreset {
  const preset = PRESET_CATEGORIES[category];
  if (preset) {
    return { ...preset, color: customColor || preset.color };
  }
  return {
    label: category,
    icon: '📌',
    color: customColor || '#94A3B8',
  };
}

/** 所有分类 key 列表 */
export const CATEGORY_KEYS = Object.keys(PRESET_CATEGORIES);

/** 计算剩余天数（正=还剩，负=已过，0=今天） */
export function calcDaysRemaining(targetDate: string, repeatYearly: boolean): number {
  const today = dayjs().startOf('day');
  let target = dayjs(targetDate);

  if (repeatYearly) {
    target = target.year(today.year());
    if (target.isBefore(today)) {
      target = target.add(1, 'year');
    }
  }

  return target.diff(today, 'day');
}

/** 将原始事件转换为展示事件 */
export function toDisplayEvent(event: CountdownEvent): CountdownEventDisplay {
  const days = calcDaysRemaining(event.target_date, event.repeat_yearly);
  const catInfo = getCategoryInfo(event.category, event.color);
  return {
    ...event,
    daysRemaining: days,
    displayType: days > 0 ? 'remaining' : days < 0 ? 'passed' : 'today',
    displayText: days > 0 ? `还剩 ${days} 天` : days < 0 ? `已过 ${Math.abs(days)} 天` : '今天',
    categoryLabel: catInfo.label,
    categoryIcon: catInfo.icon,
    categoryColor: catInfo.color,
  };
}
