import { useMemo } from 'react';
import dayjs from 'dayjs';

const GREETINGS = [
  '今天也要加油 ☀️',
  '每一步都算数 🏃',
  '专注当下，水滴石穿 💧',
  '今天的努力是明天的底气 📚',
  '做难而正确的事 🎯',
  '科研是一场马拉松 🏃‍♂️',
  '灵感藏在坚持里 ✨',
  '别急，慢慢来比较快 🌱',
  '先完成，再完美 📝',
  '今天比昨天进步一点就行 📈',
  '保持好奇心 🔬',
  '拒绝拖延，从第一个番茄钟开始 🍅',
  '论文进度如何？该动笔了 ✍️',
  '别忘了番茄钟 🍅',
  '每天都是新的一天 🌅',
  '思考比努力更重要 🤔',
  '好习惯是复利 📊',
  '该做实验了 🧪',
  '先读一篇论文再说 📖',
  '别忘了运动 🏋️',
];

function getTimeGreeting(): string {
  const h = dayjs().hour();
  if (h < 6) return '夜深了';
  if (h < 12) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

function getDailyMessage(): string {
  const now = dayjs();
  const startOfYear = dayjs().startOf('year');
  const dayOfYear = Math.floor(now.diff(startOfYear, 'day'));
  const index = dayOfYear % GREETINGS.length;
  return GREETINGS[index];
}

export function useDailyGreeting(): string {
  return useMemo(() => {
    return `${getTimeGreeting()}，${getDailyMessage()}`;
  }, []);
}
