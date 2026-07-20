import { useMemo } from 'react';
import dayjs from 'dayjs';
import { Tooltip } from 'antd';
import type { EmotionHeatmapCell } from '@/types/emotion';

interface Props {
  data: EmotionHeatmapCell[];
  year: number;
}

const LEVEL_COLORS: Record<number, string> = {
  0: '#E5E7EB',   // empty
  1: '#FCA5A5',   // very low (0-20)
  2: '#FCD34D',   // low (20-40)
  3: '#93C5FD',   // medium (40-60)
  4: '#6EE7B7',   // high (60-80)
  5: '#A78BFA',   // very high (80-100)
};

function getLevel(score: number): number {
  if (score === 0) return 0;
  if (score <= 20) return 1;
  if (score <= 40) return 2;
  if (score <= 60) return 3;
  if (score <= 80) return 4;
  return 5;
}

export default function EmotionHeatmap({ data, year }: Props) {
  const dataMap = useMemo(() => {
    const map = new Map<string, EmotionHeatmapCell>();
    data.forEach((d) => map.set(d.date, d));
    return map;
  }, [data]);

  // Generate 52 weeks × 7 days grid
  const weeks = useMemo(() => {
    const startOfYear = dayjs(`${year}-01-01`);
    const endOfYear = dayjs(`${year}-12-31`);
    // Start from Sunday of the week containing Jan 1
    const startDate = startOfYear.day(0);
    const totalDays = endOfYear.diff(startDate, 'day') + 1;
    const totalWeeks = Math.ceil(totalDays / 7);

    const result: { date: string; level: number; emoji: string; score: number }[][] = [];
    for (let w = 0; w < totalWeeks; w++) {
      const week: { date: string; level: number; emoji: string; score: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = startDate.add(w * 7 + d, 'day');
        const dateStr = date.format('YYYY-MM-DD');
        const cell = dataMap.get(dateStr);
        const score = cell?.control_score ?? 0;
        week.push({
          date: dateStr,
          level: cell ? getLevel(score) : 0,
          emoji: cell?.emoji_1 || '',
          score,
        });
      }
      result.push(week);
    }
    return result;
  }, [dataMap, year]);

  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const d = dayjs(week[0]?.date);
      if (d.isValid() && d.year() === year && d.month() !== lastMonth) {
        lastMonth = d.month();
        labels.push({ label: d.format('M月'), weekIndex: wi });
      }
    });
    return labels;
  }, [weeks, year]);

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Month labels */}
      <div style={{ display: 'flex', marginBottom: 4, marginLeft: 30 }}>
        {monthLabels.map((m, i) => (
          <span
            key={i}
            style={{
              fontSize: 10, color: 'var(--text-muted)', flex: 1,
              position: 'relative',
              marginLeft: i === 0 ? `${m.weekIndex * 14}px` : undefined,
            }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 2 }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginRight: 6 }}>
          {['', '一', '', '三', '', '五', ''].map((label, i) => (
            <div
              key={i}
              style={{
                width: 12, height: 12, fontSize: 8, lineHeight: '12px',
                color: 'var(--text-muted)', textAlign: 'center',
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Heatmap cells */}
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {week.map((day, di) => {
              const isInYear = dayjs(day.date).year() === year;
              return (
                <Tooltip
                  key={di}
                  title={
                    isInYear
                      ? `${day.date} · 掌控感 ${day.score} ${day.emoji}`
                      : ''
                  }
                >
                  <div
                    style={{
                      width: 12, height: 12, borderRadius: 2,
                      background: isInYear ? LEVEL_COLORS[day.level] : 'transparent',
                      opacity: day.level === 0 && isInYear ? 0.2 : 1,
                      transition: 'all 0.15s ease',
                    }}
                  />
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>低</span>
        {[1, 2, 3, 4, 5].map((lvl) => (
          <div
            key={lvl}
            style={{ width: 12, height: 12, borderRadius: 2, background: LEVEL_COLORS[lvl] }}
          />
        ))}
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>高</span>
      </div>
    </div>
  );
}
