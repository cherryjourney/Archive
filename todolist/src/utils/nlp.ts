import dayjs from 'dayjs';

export interface ParsedTask {
  title: string;           // cleaned title
  date: string | null;     // YYYY-MM-DD
  time: string | null;     // HH:MM
  priority: number;        // 0-3
  isRecurring: boolean;
  recurringRule: string | null; // JSON string
}

const PRIORITY_KEYWORDS: [RegExp, number][] = [
  [/[紧急急重要]{2,}|p0|P0/, 0],
  [/[重要]{2,}|p1|P1/, 1],
  [/p3|P3|[低优]{2,}|[不重要]{2,}/, 3],
];

type TimeReplacer = string | ((m: RegExpMatchArray) => string);
const TIME_PATTERNS: [RegExp, TimeReplacer][] = [
  [/上午(\d{1,2})点(半)?/, (m: RegExpMatchArray) => `${String(Number(m[1])).padStart(2, '0')}:${m[2] ? '30' : '00'}`],
  [/下午(\d{1,2})点(半)?/, (m: RegExpMatchArray) => `${String(Number(m[1]) + 12).padStart(2, '0')}:${m[2] ? '30' : '00'}`],
  [/晚上(\d{1,2})点(半)?/, (m: RegExpMatchArray) => {
    const hour = Number(m[1]);
    const real = hour < 6 ? hour + 12 : hour + (hour <= 12 ? 12 : 0);
    return `${String(real).padStart(2, '0')}:${m[2] ? '30' : '00'}`;
  }],
  [/(\d{1,2}):(\d{2})/, (m: RegExpMatchArray) => `${String(Number(m[1])).padStart(2, '0')}:${String(Number(m[2])).padStart(2, '0')}`],
  [/(\d{1,2})点(半)?/, (m: RegExpMatchArray) => `${String(Number(m[1])).padStart(2, '0')}:${m[2] ? '30' : '00'}`],
  [/早上(\d{1,2})点/, (m: RegExpMatchArray) => `${String(Number(m[1])).padStart(2, '0')}:00`],
  [/早晨(\d{1,2})点/, (m: RegExpMatchArray) => `${String(Number(m[1])).padStart(2, '0')}:00`],
];

const DATE_PATTERNS: [RegExp, TimeReplacer][] = [
  [/今天/, () => dayjs().format('YYYY-MM-DD')],
  [/明天/, () => dayjs().add(1, 'day').format('YYYY-MM-DD')],
  [/后天/, () => dayjs().add(2, 'day').format('YYYY-MM-DD')],
  [/大后天/, () => dayjs().add(3, 'day').format('YYYY-MM-DD')],
  [/下?周([一二三四五六日天])/, (m: RegExpMatchArray) => {
    const dayMap: Record<string, number> = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0 };
    const target = dayMap[m[1]] ?? 0;
    const today = dayjs();
    const diff = (target + 7 - today.day()) % 7 || 7;
    return today.add(diff, 'day').format('YYYY-MM-DD');
  }],
  [/下周/, () => dayjs().add(7, 'day').startOf('week').add(1, 'day').format('YYYY-MM-DD')],
  [/(\d{1,2})月(\d{1,2})[日号]?/, (m: RegExpMatchArray) => {
    const year = dayjs().year();
    return dayjs(`${year}-${String(Number(m[1])).padStart(2, '0')}-${String(Number(m[2])).padStart(2, '0')}`).format('YYYY-MM-DD');
  }],
  [/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日号]?/, (m: RegExpMatchArray) => {
    return dayjs(`${m[1]}-${String(Number(m[2])).padStart(2, '0')}-${String(Number(m[3])).padStart(2, '0')}`).format('YYYY-MM-DD');
  }],
];

const RECUR_PATTERNS: [RegExp, TimeReplacer][] = [
  [/每[天日]/, '{"freq":"daily","interval":1}'],
  [/每周/, '{"freq":"weekly","interval":1}'],
  [/每个月/, '{"freq":"monthly","interval":1}'],
  [/每年/, '{"freq":"yearly","interval":1}'],
  [/每个工作[日天]/, '{"freq":"weekly","interval":1,"by_days":[1,2,3,4,5]}'],
  [/周([一二三四五六日天])/, (m: RegExpMatchArray) => {
    const dayMap: Record<string, number> = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0 };
    return `{"freq":"weekly","interval":1,"by_days":[${dayMap[m[1]] ?? 1}]}`;
  }],
];

/**
 * 解析中文自然语言输入，提取任务结构化信息
 * 示例: "明天下午3点参加组会 P1" → { title:"参加组会", date:"2026-06-07", time:"15:00", priority:1 }
 */
export function parseNaturalLanguage(input: string): ParsedTask {
  let text = input.trim();
  let date: string | null = null;
  let time: string | null = null;
  let priority = 2;
  let isRecurring = false;
  let recurringRule: string | null = null;

  // 1. Extract priority keywords
  for (const [pattern, pri] of PRIORITY_KEYWORDS) {
    const match = text.match(pattern);
    if (match) {
      priority = pri;
      text = text.replace(match[0], '');
    }
  }

  // 2. Extract recurring patterns
  for (const [pattern, rule] of RECUR_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      isRecurring = true;
      recurringRule = typeof rule === 'function' ? rule(match as any) : rule;
      text = text.replace(match[0], '');
    }
  }

  // 3. Extract date
  for (const [pattern, fn] of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      date = typeof fn === 'function' ? fn(match) : fn;
      text = text.replace(match[0], '');
      break;
    }
  }

  // 4. Extract time
  for (const [pattern, fn] of TIME_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      time = typeof fn === 'function' ? fn(match) : fn;
      text = text.replace(match[0], '');
      break;
    }
  }

  // 5. Clean up remaining text as title
  let title = text
    .replace(/^[，。,\.\s、：:]+/, '')
    .replace(/[，。,\.\s、：:]+$/, '')
    .trim();

  if (!title) {
    title = input.trim();
  }

  return { title, date, time, priority, isRecurring, recurringRule };
}
