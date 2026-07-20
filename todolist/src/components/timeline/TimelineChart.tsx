import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import type { Task, TaskRelationship } from '@/types/task';
import { STATUS_BAR_COLORS } from '@/utils/constants';
import { calcAutoProgress } from '@/components/timeline/TimelineTable';
import ConnectionLine from '@/components/common/ConnectionLine';

export type ZoomLevel = 'day' | 'week' | 'month';

export const ZOOM_DAY_W: Record<ZoomLevel, number> = {
  day: 72,
  week: 40,
  month: 20,
};

const ROW_H = 56;
const HEADER_H = 64;

interface TimelineChartProps {
  tasks: Task[];
  relationships: TaskRelationship[];
  zoom: ZoomLevel;
  hoveredTaskId: string | null;
  selectedTaskId: string | null;
  onHoverTask: (taskId: string | null) => void;
  onClickTask: (task: Task) => void;
  onTaskUpdate: (taskId: string, updates: { start_date?: string; end_date?: string }) => void;
  onRelationClick: (rel: TaskRelationship) => void;
  onBarScrollRef?: (ref: HTMLDivElement | null) => void;
}

/** Compute the visible date range covering all tasks */
function computeRange(tasks: Task[]) {
  if (tasks.length === 0) {
    const today = dayjs();
    return { start: today.subtract(30, 'day'), end: today.add(90, 'day') };
  }
  let min = dayjs('2099-01-01');
  let max = dayjs('2000-01-01');
  for (const t of tasks) {
    if (!t.start_date || !t.end_date) continue;
    const s = dayjs(t.start_date);
    const e = dayjs(t.end_date);
    if (s.isBefore(min)) min = s;
    if (e.isAfter(max)) max = e;
  }
  // Generous padding so scrolling isn't blocked at month/year boundaries
  const rangeStart = min.startOf('month').subtract(1, 'month');
  const rangeEnd = max.endOf('month').add(3, 'month');
  return { start: rangeStart, end: rangeEnd };
}

export default function TimelineChart({
  tasks,
  relationships,
  zoom,
  hoveredTaskId,
  selectedTaskId,
  onHoverTask,
  onClickTask,
  onTaskUpdate,
  onRelationClick,
  onBarScrollRef,
}: TimelineChartProps) {
  const DAY_W = ZOOM_DAY_W[zoom];
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [dragging, setDragging] = useState<{
    taskId: string;
    edge: 'left' | 'right' | 'body';
    startX: number;
    origStart: string;
    origEnd: string;
    previewX: number;
    previewW: number;
    previewTooltip: string;
  } | null>(null);

  const sorted = useMemo(
    () =>
      [...tasks]
        .filter((t) => t.start_date && t.end_date)
        .sort((a, b) => (a.start_date!).localeCompare(b.start_date!)),
    [tasks],
  );

  const range = useMemo(() => computeRange(sorted), [sorted]);
  const totalDays = range.end.diff(range.start, 'day') + 1;
  const totalW = totalDays * DAY_W;

  // Expose bodyScrollRef to parent
  useEffect(() => {
    onBarScrollRef?.(bodyScrollRef.current);
    return () => onBarScrollRef?.(null);
  }, [onBarScrollRef]);

  // Horizontal scroll via mouse wheel
  useEffect(() => {
    const body = bodyScrollRef.current;
    if (!body) return;
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        body.scrollLeft += e.deltaY;
        if (headerScrollRef.current) headerScrollRef.current.scrollLeft = body.scrollLeft;
      }
    };
    body.addEventListener('wheel', handleWheel, { passive: false });
    return () => body.removeEventListener('wheel', handleWheel);
  }, []);

  // Sync header scroll
  useEffect(() => {
    const body = bodyScrollRef.current;
    const header = headerScrollRef.current;
    if (!body || !header) return;
    const handleScroll = () => { header.scrollLeft = body.scrollLeft; };
    body.addEventListener('scroll', handleScroll);
    return () => body.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to center today (instant, no animation)
  const scrollToToday = useCallback(() => {
    const body = bodyScrollRef.current;
    const header = headerScrollRef.current;
    if (!body || !header) return;
    const todayStr = dayjs().format('YYYY-MM-DD');
    const todayEl = header.querySelector(`[data-date="${todayStr}"]`);
    if (!todayEl) return;
    const containerW = body.clientWidth;
    const left = (todayEl as HTMLElement).offsetLeft;
    const width = (todayEl as HTMLElement).offsetWidth;
    const targetLeft = Math.max(0, left - containerW / 2 + width / 2);
    body.scrollTo({ left: targetLeft, behavior: 'instant' });
    header.scrollLeft = targetLeft;
  }, []);

  // Auto-center today when tasks first load (instant, no delay)
  const initialCenteredRef = useRef(false);
  useEffect(() => {
    if (initialCenteredRef.current) return;
    if (sorted.length === 0) return;
    // Use rAF so DOM is laid out
    const raf = requestAnimationFrame(() => {
      scrollToToday();
      initialCenteredRef.current = true;
    });
    return () => cancelAnimationFrame(raf);
  }, [sorted.length, scrollToToday]);

  // Click on empty space → jump to today
  const handleBodyClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-task-id]') || target.closest('svg')) return;
      scrollToToday();
    },
    [scrollToToday],
  );

  // Build month header labels
  const months = useMemo(() => {
    const result: { label: string; left: number; days: number }[] = [];
    let cursor = range.start;
    while (cursor.isBefore(range.end) || cursor.isSame(range.end, 'day')) {
      const mStart = cursor.startOf('month');
      const mEnd = cursor.endOf('month');
      const clipStart = mStart.isBefore(range.start) ? range.start : mStart;
      const clipEnd = mEnd.isAfter(range.end) ? range.end : mEnd;
      const days = clipEnd.diff(clipStart, 'day') + 1;
      result.push({
        label: cursor.format('YYYY年 M月'),
        left: clipStart.diff(range.start, 'day') * DAY_W,
        days: Math.max(days, 1),
      });
      cursor = mEnd.add(1, 'day');
    }
    return result;
  }, [range.start, range.end, DAY_W]);

  // Bar geometry helper
  const barGeometry = useCallback(
    (t: Task) => {
      const sd = dayjs(t.start_date);
      const ed = dayjs(t.end_date);
      const left = sd.diff(range.start, 'day') * DAY_W;
      const width = Math.max((ed.diff(sd, 'day') + 1) * DAY_W, DAY_W);
      return { left, width };
    },
    [range.start, DAY_W],
  );

  // Connection line endpoints
  const connectionPoints = useCallback(
    (rel: TaskRelationship) => {
      const srcIdx = sorted.findIndex((t) => t.id === rel.source_task_id);
      const tgtIdx = sorted.findIndex((t) => t.id === rel.target_task_id);
      if (srcIdx === -1 || tgtIdx === -1) return null;
      const srcGeo = barGeometry(sorted[srcIdx]);
      const tgtGeo = barGeometry(sorted[tgtIdx]);
      return {
        x1: srcGeo.left + srcGeo.width,
        y1: srcIdx * ROW_H + ROW_H / 2,
        x2: tgtGeo.left,
        y2: tgtIdx * ROW_H + ROW_H / 2,
      };
    },
    [sorted, barGeometry],
  );

  // ── Drag handlers ──
  const handleBarMouseDown = useCallback(
    (e: React.MouseEvent, task: Task, edge: 'left' | 'right' | 'body') => {
      e.preventDefault();
      e.stopPropagation();
      setDragging({
        taskId: task.id,
        edge,
        startX: e.clientX,
        origStart: task.start_date!,
        origEnd: task.end_date!,
        previewX: barGeometry(task).left,
        previewW: barGeometry(task).width,
        previewTooltip: `${task.start_date} — ${task.end_date}`,
      });
    },
    [barGeometry],
  );

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      setDragging((prev) => {
        if (!prev) return null;
        const deltaX = e.clientX - prev.startX;
        // Snap to day
        const snappedDelta = Math.round(deltaX / DAY_W) * DAY_W;
        const origStart = dayjs(prev.origStart);
        const origEnd = dayjs(prev.origEnd);
        const origDays = origEnd.diff(origStart, 'day') + 1;

        let newStart: Dayjs;
        let newEnd: Dayjs;

        if (prev.edge === 'left') {
          newStart = origStart.add(Math.round(deltaX / DAY_W), 'day');
          newEnd = origEnd;
          if (newStart.isAfter(origEnd.subtract(1, 'day'))) {
            newStart = origEnd.subtract(1, 'day');
          }
        } else if (prev.edge === 'right') {
          newStart = origStart;
          newEnd = origEnd.add(Math.round(deltaX / DAY_W), 'day');
          if (newEnd.isBefore(origStart.add(1, 'day'))) {
            newEnd = origStart.add(1, 'day');
          }
        } else {
          // body: translate entire period
          const daysShift = Math.round(deltaX / DAY_W);
          newStart = origStart.add(daysShift, 'day');
          newEnd = origEnd.add(daysShift, 'day');
        }

        const previewLeft = newStart.diff(range.start, 'day') * DAY_W;
        const previewWidth = Math.max((newEnd.diff(newStart, 'day') + 1) * DAY_W, DAY_W);

        return {
          ...prev,
          previewX: previewLeft,
          previewW: previewWidth,
          previewTooltip: `${newStart.format('YYYY-MM-DD')} — ${newEnd.format('YYYY-MM-DD')}`,
        };
      });
    };

    const handleUp = () => {
      setDragging((prev) => {
        if (!prev) return null;
        // Parse final dates from preview tooltip
        const match = prev.previewTooltip.match(/(\d{4}-\d{2}-\d{2}) — (\d{4}-\d{2}-\d{2})/);
        if (match) {
          onTaskUpdate(prev.taskId, { start_date: match[1], end_date: match[2] });
        }
        return null;
      });
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, DAY_W, range.start, onTaskUpdate]);

  // Index map for fast lookups
  const taskIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    sorted.forEach((t, i) => map.set(t.id, i));
    return map;
  }, [sorted]);

  const todayLineX = dayjs().diff(range.start, 'day') * DAY_W + DAY_W / 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Month header */}
      <div
        style={{
          height: HEADER_H,
          borderBottom: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div
          ref={headerScrollRef}
          style={{ overflowX: 'auto', overflowY: 'hidden', height: '100%' }}
        >
          <div style={{ width: totalW, height: '100%', position: 'relative' }}>
            {months.map((m) => (
              <div
                key={m.label}
                style={{
                  position: 'absolute',
                  left: m.left,
                  top: 0,
                  width: m.days * DAY_W,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 8,
                  borderLeft: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                }}
              >
                {m.label}
              </div>
            ))}
            {/* Day numbers */}
            {Array.from({ length: totalDays }, (_, i) => {
              const d = range.start.add(i, 'day');
              return (
                <div
                  key={i}
                  data-date={d.format('YYYY-MM-DD')}
                  style={{
                    position: 'absolute',
                    left: i * DAY_W,
                    top: 30,
                    width: DAY_W,
                    height: 26,
                    textAlign: 'center',
                    fontSize: DAY_W < 28 ? 9 : 10,
                    color: 'var(--text-muted)',
                    borderLeft: '1px solid var(--border-subtle, rgba(0,0,0,0.03))',
                    overflow: 'hidden',
                  }}
                >
                  {d.format('D')}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timeline body */}
      <div
        ref={bodyScrollRef}
        onClick={handleBodyClick}
        style={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
          background: 'var(--bg-card, #fff)',
        }}
      >
        <div style={{ width: totalW, position: 'relative', minHeight: sorted.length * ROW_H + 40 }}>
          {/* Today line */}
          <div
            style={{
              position: 'absolute',
              left: todayLineX,
              top: 0,
              bottom: 0,
              width: 2,
              background: '#f43f5e',
              opacity: 0.45,
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />

          {/* SVG layer for task relationships */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: totalW,
              height: sorted.length * ROW_H,
              pointerEvents: 'none',
              zIndex: 3,
            }}
          >
            {relationships.map((rel) => {
              const pts = connectionPoints(rel);
              if (!pts) return null;
              const srcTask = sorted.find((t) => t.id === rel.source_task_id);
              const tgtTask = sorted.find((t) => t.id === rel.target_task_id);
              return (
                <g key={rel.id} style={{ pointerEvents: 'auto' }}>
                  <ConnectionLine
                    x1={pts.x1}
                    y1={pts.y1}
                    x2={pts.x2}
                    y2={pts.y2}
                    sourceColor={srcTask?.color || '#8b85b0'}
                    targetColor={tgtTask?.color || '#8b85b0'}
                    isBlocking={rel.is_blocking}
                    label={rel.label}
                    onClick={() => onRelationClick(rel)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Grid rows + bars */}
          {sorted.map((t, i) => {
            const { left, width } = barGeometry(t);
            const autoProg = t.start_date && t.end_date
              ? calcAutoProgress(t.start_date, t.end_date)
              : (t.progress || 0);
            const color = t.color || STATUS_BAR_COLORS[t.status] || '#8b85b0';
            const isDone = t.status === 'completed';
            const isHovered = hoveredTaskId === t.id;
            const isSelected = selectedTaskId === t.id;
            const isDragging = dragging?.taskId === t.id;

            return (
              <div
                key={t.id}
                data-task-id={t.id}
                style={{
                  position: 'absolute',
                  top: i * ROW_H + 4,
                  left: isDragging ? dragging!.previewX : left,
                  width: isDragging ? dragging!.previewW : width,
                  height: ROW_H - 8,
                  borderRadius: 8,
                  background: isDragging ? `${color}28` : `${color}18`,
                  border: `1px solid ${color}30`,
                  cursor: isDragging ? 'grabbing' : 'pointer',
                  opacity: isDone && !isHovered ? 0.55 : 1,
                  transition: isDragging ? 'none' : 'opacity 0.15s, box-shadow 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 10,
                  paddingRight: 10,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  boxShadow: isHovered || isSelected
                    ? `0 3px 12px ${color}40`
                    : '0 1px 3px rgba(0,0,0,0.04)',
                  zIndex: isHovered || isDragging ? 10 : 1,
                }}
                onMouseEnter={() => onHoverTask(t.id)}
                onMouseLeave={() => onHoverTask(null)}
                onClick={() => onClickTask(t)}
              >
                {/* Progress fill */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${Math.min(autoProg, 100)}%`,
                    background: `${color}22`,
                    borderRadius: '8px 0 0 8px',
                    transition: 'width 0.3s ease',
                  }}
                />

                {/* Resize handle: left edge */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 6,
                    height: '100%',
                    cursor: 'ew-resize',
                    background: isHovered ? `${color}40` : 'transparent',
                    borderRadius: '8px 0 0 8px',
                    zIndex: 2,
                  }}
                  onMouseDown={(e) => handleBarMouseDown(e, t, 'left')}
                />

                {/* Resize handle: right edge */}
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    width: 6,
                    height: '100%',
                    cursor: 'ew-resize',
                    background: isHovered ? `${color}40` : 'transparent',
                    borderRadius: '0 8px 8px 0',
                    zIndex: 2,
                  }}
                  onMouseDown={(e) => handleBarMouseDown(e, t, 'right')}
                />

                {/* Body drag area */}
                <div
                  style={{
                    position: 'absolute',
                    left: 6,
                    right: 6,
                    top: 0,
                    bottom: 0,
                    cursor: 'grab',
                    zIndex: 1,
                  }}
                  onMouseDown={(e) => handleBarMouseDown(e, t, 'body')}
                />

                {/* Label */}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                    position: 'relative',
                    zIndex: 1,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  {DAY_W >= 28 ? t.title : ''}
                </span>
              </div>
            );
          })}

          {/* Drag preview tooltip */}
          {dragging && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: dragging.previewX + DAY_W / 2,
                transform: 'translate(-50%, -100%) translateY(-8px)',
                background: 'var(--bg-tooltip, #0F172A)',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                whiteSpace: 'nowrap',
                zIndex: 9999,
                pointerEvents: 'none',
              }}
            >
              {dragging.previewTooltip}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
