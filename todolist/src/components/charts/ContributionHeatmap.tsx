import { useMemo, useState, useCallback, useRef } from 'react';
import { Segmented, Button } from 'antd';
import type { HeatmapCell } from '@/types/chart';

interface ContributionHeatmapProps {
  tasks: HeatmapCell[];
  usage: HeatmapCell[];
  year: number;
  compact?: boolean;
}

const COLORS = [
  'var(--heatmap-empty, #ebedf0)',
  'var(--heatmap-l1, #9be9a8)',
  'var(--heatmap-l2, #40c463)',
  'var(--heatmap-l3, #30a14e)',
  'var(--heatmap-l4, #216e39)',
];

const CELL_SIZE = 14;
const CELL_GAP = 3;
const CELL_RADIUS = 3;

const WEEK_DAY_LABELS = ['', '周一', '', '周三', '', '周五', ''];

function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0分钟';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分钟`;
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分钟`;
}

/** Build a list of week columns for the given year. Each column is an array of 7 date strings (Sun–Sat). */
function buildWeekColumns(year: number): string[][] {
  const cols: string[][] = [];
  const jan1 = new Date(year, 0, 1);
  const dayOfWeek = jan1.getDay(); // 0=Sun
  const startDate = new Date(jan1);
  startDate.setDate(jan1.getDate() - dayOfWeek);

  const dec31 = new Date(year, 11, 31);
  const endDayOfWeek = dec31.getDay();
  const endDate = new Date(dec31);
  endDate.setDate(dec31.getDate() + (6 - endDayOfWeek));

  const current = new Date(startDate);
  while (current <= endDate) {
    const col: string[] = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(current);
      cellDate.setDate(current.getDate() + d);
      const iso = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`;
      col.push(iso);
    }
    cols.push(col);
    current.setDate(current.getDate() + 7);
  }
  return cols;
}

/** Get abbreviated month labels positioned over grid columns */
function getMonthLabels(cols: string[][]): { label: string; colIndex: number }[] {
  const labels: { label: string; colIndex: number }[] = [];
  const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  let lastMonth = -1;
  cols.forEach((col, idx) => {
    const firstDate = col[0];
    const month = parseInt(firstDate.split('-')[1], 10) - 1;
    if (month !== lastMonth && col.some((d) => d.startsWith(firstDate.substring(0, 7)))) {
      labels.push({ label: MONTH_NAMES[month], colIndex: idx });
      lastMonth = month;
    }
  });
  return labels;
}

export default function ContributionHeatmap({
  tasks,
  usage,
  year,
  compact = false,
}: ContributionHeatmapProps) {
  const [dimension, setDimension] = useState<'tasks' | 'usage'>('tasks');
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const allCols = useMemo(() => buildWeekColumns(year), [year]);

  // In compact mode, show only the last ~13 weeks
  const cols = useMemo(() => {
    if (!compact) return allCols;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    let todayColIdx = allCols.findIndex((col) => col.includes(todayStr));
    if (todayColIdx === -1) todayColIdx = allCols.length - 1;
    const startIdx = Math.max(0, todayColIdx - 12);
    return allCols.slice(startIdx, todayColIdx + 1);
  }, [allCols, compact]);

  const monthLabels = useMemo(() => getMonthLabels(cols), [cols]);

  // Build lookup maps
  const tasksMap = useMemo(() => {
    const m = new Map<string, HeatmapCell>();
    tasks.forEach((c) => m.set(c.date, c));
    return m;
  }, [tasks]);

  const usageMap = useMemo(() => {
    const m = new Map<string, HeatmapCell>();
    usage.forEach((c) => m.set(c.date, c));
    return m;
  }, [usage]);

  const currentMap = dimension === 'tasks' ? tasksMap : usageMap;

  const handleMouseEnter = useCallback(
    (date: string, event: React.MouseEvent) => {
      const cell = currentMap.get(date);
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const target = event.currentTarget as HTMLElement;
      const cellRect = target.getBoundingClientRect();
      setTooltip({
        date,
        count: cell?.count ?? 0,
        x: cellRect.left - rect.left + CELL_SIZE / 2,
        y: cellRect.top - rect.top - 8,
      });
    },
    [currentMap]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const todayStr = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', userSelect: 'none' }}>
      {/* Header: dimension toggle + year */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Segmented
          size="small"
          value={dimension}
          onChange={(val) => setDimension(val as 'tasks' | 'usage')}
          options={[
            { label: '任务完成', value: 'tasks' },
            { label: '使用时长', value: 'usage' },
          ]}
          style={{ fontSize: 12 }}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {year}
        </span>
      </div>

      {/* Month labels — absolute positioning to align with grid columns below */}
      <div style={{ position: 'relative', marginLeft: 30, marginBottom: 4, height: 16 }}>
        {monthLabels.map((ml) => (
          <span
            key={ml.label}
            style={{
              position: 'absolute',
              left: ml.colIndex * (CELL_SIZE + CELL_GAP),
              fontSize: 10,
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}
          >
            {ml.label}
          </span>
        ))}
      </div>

      {/* Grid body: day labels + grid */}
      <div style={{ display: 'flex' }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', marginRight: 4, gap: CELL_GAP }}>
          {WEEK_DAY_LABELS.map((label, i) => (
            <div
              key={i}
              style={{
                width: 26,
                height: CELL_SIZE,
                fontSize: 10,
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 6,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Cells grid */}
        <div style={{ display: 'flex', gap: CELL_GAP }}>
          {cols.map((col, colIdx) => (
            <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: CELL_GAP }}>
              {col.map((date, rowIdx) => {
                const cell = currentMap.get(date);
                const level = cell?.level ?? 0;
                const isFuture = date > todayStr;
                const isToday = date === todayStr;

                return (
                  <div
                    key={`${colIdx}-${rowIdx}`}
                    data-date={date}
                    onMouseEnter={(e) => handleMouseEnter(date, e)}
                    onMouseLeave={handleMouseLeave}
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      borderRadius: CELL_RADIUS,
                      background: isFuture ? 'transparent' : COLORS[level],
                      border: isToday ? '1px solid var(--color-primary, #2563EB)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'border 0.1s ease',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = `2px solid var(--color-primary, #2563EB)`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = 'none';
                    }}
                    tabIndex={0}
                    role="gridcell"
                    aria-label={`${date}: ${dimension === 'tasks' ? `${cell?.count ?? 0}个任务` : formatDuration(cell?.count ?? 0)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Custom tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            background: 'var(--bg-tooltip, #1E293B)',
            color: '#F8FAFC',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
          }}
        >
          {(() => {
            const parts = tooltip.date.split('-');
            const month = parseInt(parts[1], 10);
            const day = parseInt(parts[2], 10);
            const label = dimension === 'tasks'
              ? `${tooltip.count}个任务`
              : formatDuration(tooltip.count);
            return `${month}月${day}日 · ${label}`;
          })()}
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 4,
          marginTop: 8,
          fontSize: 11,
          color: 'var(--text-muted)',
        }}
      >
        <span>少</span>
        {COLORS.map((color, i) => (
          <div
            key={i}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              borderRadius: CELL_RADIUS,
              background: color,
            }}
          />
        ))}
        <span>多</span>
      </div>
    </div>
  );
}
