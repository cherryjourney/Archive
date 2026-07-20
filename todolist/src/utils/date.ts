import dayjs from 'dayjs';

/** 获取今天日期字符串 YYYY-MM-DD */
export function todayStr(): string {
  return dayjs().format('YYYY-MM-DD');
}

/** 获取当前时间字符串 */
export function nowStr(): string {
  return dayjs().format('YYYY-MM-DDTHH:mm:ss');
}

/** 格式化日期显示 */
export function formatDate(date: string, fmt: string = 'MM/DD'): string {
  return dayjs(date).format(fmt);
}

/** 获取本周一 */
export function startOfWeek(): string {
  return dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD');
}

/** 获取本周日 */
export function endOfWeek(): string {
  return dayjs().endOf('week').add(1, 'day').format('YYYY-MM-DD');
}

/** 获取本月第一天 */
export function startOfMonth(): string {
  return dayjs().startOf('month').format('YYYY-MM-DD');
}

/** 获取本月最后一天 */
export function endOfMonth(): string {
  return dayjs().endOf('month').format('YYYY-MM-DD');
}

/** 获取当前年份 */
export function currentYear(): number {
  return dayjs().year();
}

/** 移动指定天数 */
export function offsetDays(date: string, days: number): string {
  return dayjs(date).add(days, 'day').format('YYYY-MM-DD');
}

/** 相对时间 */
export function relativeTime(date: string): string {
  const d = dayjs(date);
  const now = dayjs();
  const diffMinutes = now.diff(d, 'minute');
  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes} 分钟前`;
  const diffHours = now.diff(d, 'hour');
  if (diffHours < 24) return `${diffHours} 小时前`;
  const diffDays = now.diff(d, 'day');
  if (diffDays < 7) return `${diffDays} 天前`;
  return formatDate(date, 'YYYY/MM/DD');
}
