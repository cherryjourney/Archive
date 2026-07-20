import { useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import { CaretDownOutlined } from '@ant-design/icons';
import type { Task } from '@/types/task';
import type { TaskStatus } from '@/types/task';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/types/task';
import { STATUS_BAR_COLORS } from '@/utils/constants';

interface TimelineTableProps {
  tasks: Task[];
  hoveredTaskId: string | null;
  selectedTaskId: string | null;
  onHoverTask: (taskId: string | null) => void;
  onClickTask: (task: Task) => void;
  onScrollToBar: (taskId: string) => void;
  completedCount?: number;
  completedTasks?: Task[];
  showCompleted?: boolean;
  onToggleCompleted?: () => void;
  onCompletedTaskClick?: (task: Task) => void;
}

const ROW_H = 56; // Must match TimelineChart ROW_H
const STATUS_LABELS: Record<string, string> = {
  pending: '待开始',
  in_progress: '进行中',
  review: '审核中',
  completed: '已完成',
  cancelled: '已取消',
  paused: '已暂停',
};

/** Auto-calculate progress from date range: elapsed / total × 100 */
export function calcAutoProgress(startDate: string, endDate: string): number {
  const today = dayjs().startOf('day');
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  if (today.isBefore(start)) return 0;
  if (today.isAfter(end)) return 100;
  const total = end.diff(start, 'day') + 1;
  const elapsed = today.diff(start, 'day') + 1;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

/** Auto-determine status: pending before start_date, in_progress during, keep existing otherwise */
export function calcAutoStatus(startDate: string, endDate: string, currentStatus: TaskStatus): TaskStatus {
  // Only auto-override pending/in_progress — respect manual completed/cancelled/review/paused
  if (currentStatus === 'completed' || currentStatus === 'cancelled' || currentStatus === 'review' || currentStatus === 'paused') {
    return currentStatus;
  }
  const today = dayjs().startOf('day');
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  if (today.isBefore(start)) return 'pending';
  if (!today.isAfter(end)) return 'in_progress';
  return 'in_progress'; // past end_date — stays in_progress until manual completion
}

export default function TimelineTable({
  tasks,
  hoveredTaskId,
  selectedTaskId,
  onHoverTask,
  onClickTask,
  onScrollToBar,
  completedCount = 0,
  completedTasks = [],
  showCompleted = false,
  onToggleCompleted,
  onCompletedTaskClick,
}: TimelineTableProps) {
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Scroll selected row into view
  useEffect(() => {
    if (selectedTaskId) {
      const el = rowRefs.current.get(selectedTaskId);
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedTaskId]);

  return (
    <>
      {/* Active task list */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: 'var(--bg-card, #fff)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          height: 64, padding: '0 16px', gap: 10,
          borderBottom: '2px solid var(--border-subtle, rgba(0,0,0,0.08))',
          background: 'var(--color-fill, #fafbfc)',
          fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
          flexShrink: 0,
        }}>
          <span style={{ flex: 1 }}>任务</span>
          <span style={{ width: 60, textAlign: 'center' }}>状态</span>
          <span style={{ width: 46, textAlign: 'right' }}>进度</span>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {tasks.length === 0 ? (
            <div style={{
              padding: '40px 16px', textAlign: 'center',
              color: 'var(--text-muted)', fontSize: 13,
            }}>
              暂无活跃任务
            </div>
          ) : (
            tasks.map((t, i) => {
              const sd = t.start_date ? dayjs(t.start_date).format('MM/DD') : '';
              const ed = t.end_date ? dayjs(t.end_date).format('MM/DD') : '';
              const autoStatus = t.start_date && t.end_date
                ? calcAutoStatus(t.start_date, t.end_date, t.status)
                : t.status;
              const autoProgress = t.start_date && t.end_date
                ? calcAutoProgress(t.start_date, t.end_date)
                : (t.progress || 0);
              const barColor = t.color || STATUS_BAR_COLORS[autoStatus] || '#8b85b0';
              const isHovered = hoveredTaskId === t.id;
              const isSelected = selectedTaskId === t.id;
              const isDone = autoStatus === 'completed';

              return (
                <div
                  key={t.id}
                  ref={(el) => { if (el) rowRefs.current.set(t.id, el); }}
                  style={{
                    display: 'flex', alignItems: 'center',
                    height: ROW_H, padding: '0 16px', gap: 10,
                    cursor: 'pointer',
                    background: isSelected
                      ? 'rgba(37,99,235,0.08)'
                      : isHovered
                      ? 'rgba(37,99,235,0.05)'
                      : i % 2 === 0
                      ? 'transparent'
                      : 'var(--color-fill, rgba(0,0,0,0.012))',
                    borderBottom: '1px solid var(--border-subtle, rgba(0,0,0,0.035))',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={() => onHoverTask(t.id)}
                  onMouseLeave={() => onHoverTask(null)}
                  onClick={() => {
                    onClickTask(t);
                    onScrollToBar(t.id);
                  }}
                >
                  {/* Color dot + Title */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: barColor, flexShrink: 0, opacity: isDone ? 0.4 : 1,
                    }} />
                    <div style={{
                      fontSize: 13, fontWeight: 500,
                      color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      textDecoration: isDone ? 'line-through' : 'none',
                      lineHeight: '18px',
                    }}>
                      {t.title}
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{
                    width: 60, textAlign: 'center', flexShrink: 0,
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 500,
                      padding: '1px 8px', borderRadius: 10,
                      background: `${barColor}18`, color: barColor,
                    }}>
                      {STATUS_LABELS[autoStatus] || autoStatus}
                    </span>
                  </div>

                  {/* Date range + progress */}
                  <div style={{
                    width: 46, textAlign: 'right', flexShrink: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: '16px' }}>
                      {sd}–{ed}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 600,
                      color: isDone ? 'var(--text-muted)' : barColor,
                      lineHeight: '14px',
                    }}>
                      {autoProgress}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Completed tasks footer */}
      {completedCount > 0 && (
        <div style={{
          flexShrink: 0,
          borderTop: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
          background: 'var(--color-fill, #fafbfc)',
        }}>
          <div
            onClick={onToggleCompleted}
            style={{
              padding: '10px 16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
              userSelect: 'none',
            }}
          >
            <span style={{
              fontSize: 10, display: 'flex', alignItems: 'center',
              transition: 'transform 0.2s ease',
              transform: showCompleted ? 'rotate(0deg)' : 'rotate(-90deg)',
            }}>
              <CaretDownOutlined />
            </span>
            <span>已完成 ({completedCount})</span>
          </div>
          {showCompleted && (
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {completedTasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => onCompletedTaskClick?.(t)}
                  style={{
                    padding: '8px 16px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                    borderTop: '1px solid var(--border-subtle, rgba(0,0,0,0.035))',
                    fontSize: 12,
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(37,99,235,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: t.color || '#94A3B8', opacity: 0.5, flexShrink: 0,
                  }} />
                  <span style={{
                    flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    color: 'var(--text-muted)', textDecoration: 'line-through',
                  }}>
                    {t.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
