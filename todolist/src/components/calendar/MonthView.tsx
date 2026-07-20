import { useMemo } from 'react';
import { Typography, Tooltip } from 'antd';
import dayjs from 'dayjs';
import type { Task } from '@/types/task';
import { PRIORITY_COLORS } from '@/types/task';
import { getMonthLunarMap } from '@/utils/lunar';

const { Text } = Typography;

const WEEKDAYS_FULL = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const LUNAR_MONTH_SHORT = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];
const LUNAR_DAY_SHORT = ['','初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];

export default function MonthView({ currentDate, getTasksForDate }: {
  currentDate: dayjs.Dayjs;
  getTasksForDate: (date: string) => Task[];
}) {
  const start = currentDate.startOf('month');
  const startDay = start.day() === 0 ? 6 : start.day() - 1;
  const totalDays = currentDate.endOf('month').date();
  const today = dayjs().format('YYYY-MM-DD');

  // Pre-compute lunar info for the entire month
  const lunarMap = useMemo(() => {
    const y = currentDate.year();
    const m = currentDate.month() + 1;
    return getMonthLunarMap(y, m);
  }, [currentDate.format('YYYY-MM')]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let i = 1; i <= totalDays; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div style={{ display: 'flex', marginBottom: 8 }}>
        {WEEKDAYS_FULL.map(w => (
          <div key={w} style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', padding: '10px 0' }}>
            {w}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} style={{ minHeight: 128 }} />;
          const dateStr = currentDate.date(day).format('YYYY-MM-DD');
          const isToday = dateStr === today;
          const dayTasks = getTasksForDate(dateStr);
          const dayInfo = lunarMap.get(dateStr);
          const holiday = dayInfo?.holiday ?? null;
          const lunarText = dayInfo?.lunarDate
            ? (dayInfo.lunarDate.day === 1
              ? `${dayInfo.lunarDate.isLeapMonth ? '闰' : ''}${LUNAR_MONTH_SHORT[dayInfo.lunarDate.month - 1]}月`
              : LUNAR_DAY_SHORT[dayInfo.lunarDate.day])
            : '';
          const solarTerm = dayInfo?.solarTerm ?? null;
          const showTerm = solarTerm && solarTerm !== '清明'; // 清明 is already a holiday
          const isWeekend = i % 7 >= 5; // Sat/Sun columns

          return (
            <div key={i} style={{
              minHeight: 128, padding: 8,
              background: holiday?.isOfficial
                ? `${holiday.color}0D`
                : isToday ? 'rgba(37,99,235,0.06)' : 'transparent',
              borderRadius: 10,
              border: holiday?.isOfficial
                ? `1px solid ${holiday.color}30`
                : isToday ? '1px solid rgba(37,99,235,0.2)' : '1px solid transparent',
            }}>
              {/* Date row */}
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 2,
                flexWrap: 'nowrap', minHeight: 20,
              }}>
                <span style={{
                  fontSize: 17, fontWeight: isToday ? 700 : 500,
                  color: holiday?.isOfficial ? holiday.color
                    : isWeekend ? 'var(--text-muted)'
                    : isToday ? '#2563EB' : 'var(--text-secondary)',
                }}>
                  {day}
                </span>
                {holiday ? (
                  <Tooltip title={dayInfo?.lunarDate?.text ?? ''}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, lineHeight: 1.2,
                      color: holiday.color,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      flex: 1, minWidth: 0,
                    }}>
                      {holiday.name}
                    </span>
                  </Tooltip>
                ) : (
                  <span style={{
                    fontSize: 11, color: isWeekend ? 'var(--text-muted)' : 'var(--text-muted)',
                    opacity: 0.75, whiteSpace: 'nowrap',
                  }}>
                    {lunarText}
                  </span>
                )}
              </div>

              {/* Solar term line */}
              {showTerm && (
                <div style={{
                  fontSize: 11, fontWeight: 500, color: '#059669',
                  marginBottom: 2, paddingLeft: 1,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {solarTerm}
                </div>
              )}

              {/* Task indicators — 2-line clamp + Tooltip for full title */}
              {dayTasks.slice(0, 3).map(t => (
                <Tooltip key={t.id} title={t.title} mouseEnterDelay={0.3}>
                  <div style={{
                    fontSize: 12, padding: '2px 6px', borderRadius: 4, marginBottom: 2,
                    background: t.status === 'completed'
                      ? 'rgba(5,150,105,0.1)'
                      : `${PRIORITY_COLORS[t.priority]}15`,
                    borderLeft: t.status === 'completed'
                      ? '2px solid #059669'
                      : `2px solid ${PRIORITY_COLORS[t.priority]}`,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                    color: t.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)',
                    lineHeight: 1.4,
                    wordBreak: 'break-all',
                  }}>
                    {t.title}
                  </div>
                </Tooltip>
              ))}
              {dayTasks.length > 3 && (
                <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>+{dayTasks.length - 3} 更多</Text>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
