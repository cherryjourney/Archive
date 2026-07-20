/**
 * 农历 (Chinese Lunar Calendar) + 节假日 工具模块
 *
 * 基于 lunar-typescript 库（香港天文台数据验证），提供准确的农历
 * 日期转换、节假日识别、节气查询功能。
 */

import { Solar, Lunar } from 'lunar-typescript';

// ── Types ──────────────────────────────────────────

export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  /** 农历中文表示，如 "正月初一"、"腊月三十" */
  text: string;
  /** 天干地支纪年，如 "甲辰" */
  stemBranch: string;
  /** 生肖，如 "龙" */
  zodiac: string;
}

export interface Holiday {
  name: string;
  /** 是否为法定节假日 (有假期) */
  isOfficial: boolean;
  /** 颜色标签 */
  color: string;
}

export interface DayInfo {
  solarDate: string;        // "YYYY-MM-DD"
  lunarDate: LunarDate | null;
  holiday: Holiday | null;
  solarTerm: string | null;
}

// ── Chinese month / day display names ──────────────

const LUNAR_MONTH_NAMES = [
  '正', '二', '三', '四', '五', '六',
  '七', '八', '九', '十', '冬', '腊',
];

const LUNAR_DAY_NAMES = [
  '', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
];

// ── Solar → Lunar ──────────────────────────────────

export function solarToLunar(solarYear: number, solarMonth: number, solarDay: number): LunarDate {
  const solar = Solar.fromYmd(solarYear, solarMonth, solarDay);
  const lunar = solar.getLunar();

  const month = lunar.getMonth();
  const day = lunar.getDay();

  // Detect leap month: check if this lunar month is a leap month
  // lunar-typescript doesn't directly expose isLeapMonth, but we can detect it
  // by checking if the month name contains "闰"
  let isLeap = false;
  let monthIndex = month;
  const monthChinese = lunar.getMonthInChinese();
  if (monthChinese && monthChinese.includes('闰')) {
    isLeap = true;
    monthIndex = month; // lunar.getMonth() already returns the correct number for leap months
  }

  const monthName = LUNAR_MONTH_NAMES[monthIndex - 1] || `${monthIndex}`;
  const dayName = LUNAR_DAY_NAMES[day] || `${day}`;
  const leapPrefix = isLeap ? '闰' : '';

  return {
    year: lunar.getYear(),
    month: monthIndex,
    day,
    isLeapMonth: isLeap,
    text: `${leapPrefix}${monthName}月${dayName}`,
    stemBranch: lunar.getYearInGanZhi(),
    zodiac: lunar.getYearShengXiao(),
  };
}

// ── Get Lunar Date from "YYYY-MM-DD" string ────────

export function getLunarDate(dateStr: string): LunarDate | null {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return null;
  const [y, m, d] = parts;
  if (y < 1900 || y > 2100) return null;
  return solarToLunar(y, m, d);
}

// ── Short lunar text (just the day name, or month name if day 1) ──

export function getLunarDayText(dateStr: string): string {
  const lunar = getLunarDate(dateStr);
  if (!lunar) return '';
  if (lunar.day === 1) {
    return `${lunar.isLeapMonth ? '闰' : ''}${LUNAR_MONTH_NAMES[lunar.month - 1]}月`;
  }
  return LUNAR_DAY_NAMES[lunar.day] || `${lunar.day}`;
}

// ── Holidays (仅中国节日) ──────────────────────────

/** 中国法定节假日名称集合 */
const OFFICIAL_FESTIVAL_NAMES: Set<string> = new Set([
  '元旦节', '元旦',
  '春节',
  '清明节',
  '劳动节',
  '端午节',
  '中秋节',
  '国庆节',
  '除夕',
]);

/** 中国节日颜色映射 */
const FESTIVAL_COLORS: Record<string, string> = {
  // 法定节假日
  '元旦节': '#DC2626', '元旦': '#DC2626',
  '春节': '#DC2626',
  '清明节': '#059669',
  '劳动节': '#DC2626',
  '端午节': '#059669',
  '中秋节': '#F59E0B',
  '国庆节': '#DC2626',
  '除夕': '#DC2626',

  // 传统节日
  '元宵节': '#F59E0B',
  '七夕': '#EC4899', '七夕节': '#EC4899',
  '重阳节': '#F59E0B',
  '腊八节': '#8B5CF6',
  '小年': '#8B5CF6',
  '中元节': '#8B5CF6',
  '寒衣节': '#8B5CF6',
  '龙抬头': '#3B82F6',
};

/** 仅保留中国节日的白名单 (排除西方/国际节日) */
const CHINESE_ONLY: Set<string> = new Set([
  // 法定
  '元旦节', '元旦', '春节', '清明节', '劳动节', '端午节', '中秋节', '国庆节', '除夕',
  // 传统
  '元宵节', '七夕', '七夕节', '重阳节', '腊八节', '小年', '中元节', '寒衣节', '龙抬头',
  // 中国现代纪念日
  '妇女节', '青年节', '儿童节', '建党节', '建军节', '教师节',
]);

/** 简化节日名称 */
function shortenName(name: string): string {
  if (name === '元旦节') return '元旦';
  return name;
}

export function getHoliday(dateStr: string): Holiday | null {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return null;
  const [y, m, d] = parts;
  if (y < 1900 || y > 2100) return null;

  const solar = Solar.fromYmd(y, m, d);
  const lunar = solar.getLunar();

  let bestName = '';
  let bestIsOfficial = false;

  // Priority 1: 公历法定节日
  for (const name of solar.getFestivals()) {
    if (!CHINESE_ONLY.has(name)) continue;
    if (OFFICIAL_FESTIVAL_NAMES.has(name)) { bestName = name; bestIsOfficial = true; break; }
    if (!bestName) bestName = name;
  }

  // Priority 2: 农历节日
  if (!bestIsOfficial) {
    for (const name of lunar.getFestivals()) {
      if (!CHINESE_ONLY.has(name)) continue;
      if (OFFICIAL_FESTIVAL_NAMES.has(name)) { bestName = name; bestIsOfficial = true; break; }
      if (!bestName) bestName = name;
    }
  }

  // Priority 3: 清明 — 节气即节日
  if (!bestIsOfficial && lunar.getJieQi() === '清明') {
    bestName = '清明节'; bestIsOfficial = true;
  }

  // Priority 4: 其他中国节日 (solar other)
  if (!bestName) {
    for (const name of solar.getOtherFestivals()) {
      if (CHINESE_ONLY.has(name)) { bestName = name; break; }
    }
  }

  // Priority 5: 其他中国节日 (lunar other)
  if (!bestName) {
    for (const name of lunar.getOtherFestivals()) {
      if (CHINESE_ONLY.has(name)) { bestName = name; break; }
    }
  }

  if (bestName) {
    return {
      name: shortenName(bestName),
      isOfficial: bestIsOfficial,
      color: FESTIVAL_COLORS[bestName] || '#F59E0B',
    };
  }

  return null;
}

// ── Solar Term ─────────────────────────────────────

export function getSolarTerm(dateStr: string): string | null {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return null;
  const [y, m, d] = parts;
  if (y < 1900 || y > 2100) return null;

  const solar = Solar.fromYmd(y, m, d);
  const lunar = solar.getLunar();

  // Check if this day is a jie (节) or qi (气)
  const jie = lunar.getJie();
  const qi = lunar.getQi();

  if (jie) return jie;
  if (qi) return qi;
  return null;
}

// ── Get all info for a date ─────────────────────────

export function getDayInfo(dateStr: string): DayInfo {
  return {
    solarDate: dateStr,
    lunarDate: getLunarDate(dateStr),
    holiday: getHoliday(dateStr),
    solarTerm: getSolarTerm(dateStr),
  };
}

// ── Check if a date is a rest day / holiday ─────────

export function isRestDay(dateStr: string): boolean {
  const holiday = getHoliday(dateStr);
  return holiday?.isOfficial ?? false;
}

// ── Batch: get month day info grid ──────────────────

export function getMonthLunarMap(year: number, month: number): Map<string, DayInfo> {
  const map = new Map<string, DayInfo>();
  const totalDays = new Date(year, month, 0).getDate(); // days in month
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    map.set(dateStr, getDayInfo(dateStr));
  }
  return map;
}
