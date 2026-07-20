import { useState, useRef } from 'react';
import { Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Task } from '@/types/task';
import { PRIORITY_COLORS } from '@/types/task';
import { getHoliday, getLunarDate, getLunarDayText, getSolarTerm } from '@/utils/lunar';

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6:00 - 23:00
const ROW_HEIGHT = 44; // px per hour row (18*44=792px total)
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];
const START_MINUTES = 6 * 60;
const END_MINUTES = 24 * 60;

function parseMinutes(t: string): number {
  const parts = t.split(':').map(Number);
  return parts[0] * 60 + (parts[1] || 0);
}

export default function WeekView({ weekStart, getTasksForDate, taskTimes, onAddTask, onEditTask, onToggleComplete, onDropTask }: {
  weekStart: dayjs.Dayjs;
  getTasksForDate: (date: string) => Task[];
  taskTimes: Record<string, { start: string; end: string | null }>;
  onAddTask: (date: string) => void;
  onEditTask: (task: Task, date: string) => void;
  onToggleComplete: (task: Task) => void;
  onDropTask: (taskId: string, sourceDate: string, targetDate: string, targetTime: string, durationMin: number) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'));
  const today = dayjs().format('YYYY-MM-DD');
  const TOTAL_HEIGHT = HOURS.length * ROW_HEIGHT;

  // Drag state
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [dragOverY, setDragOverY] = useState<number | null>(null);
  const dragRef = useRef(false);

  // ── Drag handlers ──
  const handleDragStart = (e: React.DragEvent, task: Task, dateStr: string) => {
    dragRef.current = true;
    const tt = taskTimes[task.id];
    const startMin = tt ? parseMinutes(tt.start) : 540; // default 9:00
    const endMin = tt?.end ? parseMinutes(tt.end) : startMin + 60;
    const duration = (endMin <= startMin ? startMin + 60 : endMin) - startMin;

    e.dataTransfer.setData('application/json', JSON.stringify({
      taskId: task.id,
      sourceDate: dateStr,
      duration,
    }));
    e.dataTransfer.effectAllowed = 'move';
    // Make drag image semi-transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 40, 15);
    }
  };

  const handleDragEnd = () => {
    setTimeout(() => { dragRef.current = false; }, 50);
    setDragOverDate(null);
    setDragOverY(null);
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(dateStr);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOverY(e.clientY - rect.top);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we actually left the column
    if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return;
    setDragOverDate(null);
    setDragOverY(null);
  };

  const handleDrop = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    setDragOverDate(null);
    setDragOverY(null);

    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    let data: { taskId: string; sourceDate: string; duration: number };
    try { data = JSON.parse(raw); } catch { return; }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const minutesFromStart = (relativeY / ROW_HEIGHT) * 60;
    const totalMinutes = START_MINUTES + minutesFromStart;
    // Snap to 15-min grid
    const snapped = Math.round(totalMinutes / 15) * 15;
    const clamped = Math.max(START_MINUTES, Math.min(END_MINUTES - data.duration, snapped));
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    const targetTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    onDropTask(data.taskId, data.sourceDate, targetDate, targetTime, data.duration);
  };

  // ── Drop indicator line ──
  const DropIndicator = () => {
    if (!dragOverDate || dragOverY === null) return null;
    const snappedY = Math.round(dragOverY / (ROW_HEIGHT / 4)) * (ROW_HEIGHT / 4);
    return (
      <div
        className="drag-over-indicator"
        style={{
          top: snappedY,
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        <div style={{
          position: 'absolute', left: -4, top: -4,
          width: 10, height: 10, borderRadius: '50%',
          background: 'var(--color-primary)',
        }} />
      </div>
    );
  };

  return (
    <div style={{ overflow: 'auto', userSelect: 'none' }}>
      {/* Day headers */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10, marginBottom: 10 }}>
        <div style={{ width: 56, flexShrink: 0 }} />
        {days.map((d, i) => {
          const dateStr = d.format('YYYY-MM-DD');
          const isToday = dateStr === today;
          const holiday = getHoliday(dateStr);
          const lunarDate = getLunarDate(dateStr);
          const lunarText = getLunarDayText(dateStr);
          const solarTerm = getSolarTerm(dateStr);
          // 清明已被 getHoliday 作为节日处理，不重复显示为节气
          const showTerm = solarTerm && solarTerm !== '清明';
          const displayText = holiday ? holiday.name : lunarText;
          const tooltipTitle = lunarDate
            ? `${lunarDate.stemBranch}年 · ${lunarDate.zodiac} · ${lunarDate.text}${holiday ? ` · ${holiday.name}` : ''}${solarTerm ? ` · ${solarTerm}` : ''}`
            : '';
          return (
            <Tooltip key={i} title={tooltipTitle} placement="bottom">
              <div style={{
                flex: 1, textAlign: 'center', minWidth: 0,
                background: isToday ? 'linear-gradient(135deg, #2563EB, #3B82F6)' : 'transparent',
                borderRadius: 10, padding: '8px 4px', color: isToday ? '#fff' : 'var(--text-secondary)',
                cursor: 'default',
              }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{WEEKDAYS[i]}</div>
                <div style={{ fontSize: 20, fontWeight: isToday ? 700 : 500, lineHeight: 1.2 }}>{d.format('DD')}</div>
                <div style={{
                  fontSize: 11, fontWeight: holiday ? 600 : 400, lineHeight: 1.3,
                  color: holiday ? holiday.color : isToday ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)',
                  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                }}>
                  {displayText}
                </div>
                {showTerm && (
                  <div style={{
                    fontSize: 10, color: isToday ? 'rgba(255,255,255,0.7)' : '#059669',
                    fontWeight: 500, marginTop: 1,
                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                  }}>
                    {solarTerm}
                  </div>
                )}
              </div>
            </Tooltip>
          );
        })}
      </div>

      {/* Unscheduled tasks row */}
      {days.some(d => {
        const tasks = getTasksForDate(d.format('YYYY-MM-DD'));
        return tasks.some(t => !taskTimes[t.id]);
      }) && (
        <div style={{
          display: 'flex', minHeight: 36,
          borderBottom: '1px dashed rgba(245,158,11,0.2)',
          background: 'rgba(245,158,11,0.03)',
          alignItems: 'flex-start',
        }}>
          <div style={{ width: 56, flexShrink: 0, fontSize: 11, color: '#b8a04e', paddingTop: 2, textAlign: 'right', paddingRight: 8 }}>
            未设时间
          </div>
          {days.map((d, di) => {
            const dateStr = d.format('YYYY-MM-DD');
            const unscheduled = getTasksForDate(dateStr).filter(t => !taskTimes[t.id]);
            return (
              <div key={di} style={{ flex: 1, minHeight: 36, minWidth: 0, overflow: 'hidden' }}>
                {unscheduled.map(t => (
                  <TaskBar key={t.id} task={t} dateStr={dateStr}
                    showCircle onToggleComplete={onToggleComplete}
                    onEdit={onEditTask} onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Timed grid */}
      <div style={{ display: 'flex', position: 'relative' }}>
        {/* Time labels */}
        <div style={{ width: 56, flexShrink: 0 }}>
          {HOURS.map(hour => (
            <div key={hour} style={{
              height: ROW_HEIGHT, fontSize: 13, color: 'var(--text-muted)',
              textAlign: 'right', paddingRight: 10, lineHeight: `${ROW_HEIGHT}px`,
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              {`${String(hour).padStart(2, '0')}:00`}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((d, di) => {
          const dateStr = d.format('YYYY-MM-DD');
          const dayTasks = getTasksForDate(dateStr);
          const timedTasks = dayTasks.filter(t => taskTimes[t.id]);
          const isDragOver = dragOverDate === dateStr;

          return (
            <div key={di}
              style={{
                flex: 1, position: 'relative', height: TOTAL_HEIGHT, minWidth: 0,
                background: `repeating-linear-gradient(to bottom, transparent 0px, transparent ${ROW_HEIGHT - 1}px, var(--border-subtle) ${ROW_HEIGHT - 1}px, var(--border-subtle) ${ROW_HEIGHT}px)`,
                borderLeft: di > 0 ? '1px solid var(--border-subtle)' : 'none',
                outline: isDragOver ? '2px dashed rgba(37,99,235,0.3)' : 'none',
                outlineOffset: -1,
              }}
              onDragOver={(e) => handleDragOver(e, dateStr)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, dateStr)}
            >
              {/* Add button (hover) */}
              <div onClick={() => onAddTask(dateStr)} title="添加任务" className="cal-add-btn"
                style={{
                  position: 'absolute', top: 2, right: 2, zIndex: 10,
                  width: 20, height: 20, borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s',
                  background: 'rgba(37,99,235,0.1)', color: '#2563EB', fontSize: 12,
                }}>
                <PlusOutlined />
              </div>

              {/* Drop indicator */}
              {isDragOver && <DropIndicator />}

              {/* Task blocks */}
              {timedTasks.map(t => {
                const tt = taskTimes[t.id]!;
                const startMin = parseMinutes(tt.start);
                const endMin = tt.end ? parseMinutes(tt.end) : startMin + 60;
                const effectiveEnd = endMin <= startMin ? startMin + 60 : endMin;

                const visibleStart = Math.max(startMin, START_MINUTES);
                const visibleEnd = Math.min(effectiveEnd, END_MINUTES);
                if (visibleStart >= visibleEnd) return null;

                const top = ((visibleStart - START_MINUTES) / 60) * ROW_HEIGHT;
                const height = Math.max(((visibleEnd - visibleStart) / 60) * ROW_HEIGHT, 20);
                const showTimeLabel = height >= 28;
                const isCompleted = t.status === 'completed';

                return (
                  <div key={t.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, t, dateStr)}
                    onDragEnd={handleDragEnd}
                    onClick={() => { if (!dragRef.current) onEditTask(t, dateStr); }}
                    style={{
                      position: 'absolute',
                      top, left: 2, right: 2, zIndex: 2,
                      height, borderRadius: 5,
                      padding: height >= 32 ? '3px 5px 3px 6px' : '1px 5px 1px 6px',
                      background: isCompleted
                        ? 'rgba(5,150,105,0.08)'
                        : `${PRIORITY_COLORS[t.priority]}15`,
                      borderLeft: isCompleted
                        ? '3px solid #059669'
                        : `3px solid ${PRIORITY_COLORS[t.priority]}`,
                      fontSize: 12, overflow: 'hidden', cursor: 'grab',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      opacity: t.id === 'dragging' ? 0.5 : 1,
                      display: 'flex', alignItems: 'flex-start', gap: 5,
                    }}>
                    {/* Completion circle */}
                    <span
                      onClick={(e) => { e.stopPropagation(); onToggleComplete(t); }}
                      title={isCompleted ? '点击取消完成' : '点击标记完成'}
                      style={{
                        width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                        marginTop: height >= 32 ? 2 : 0,
                        border: isCompleted
                          ? '2px solid #059669'
                          : '2px solid var(--border-default)',
                        background: isCompleted ? '#059669' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 8, color: '#fff',
                      }}>
                      {isCompleted && '✓'}
                    </span>

                    {/* Task text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {showTimeLabel ? (
                        <>
                          <div style={{
                            fontWeight: 600, color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                            lineHeight: 1.3,
                            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                            textDecoration: isCompleted ? 'line-through' : 'none',
                          }}>
                            {t.title}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                            {tt.start.slice(0, 5)}
                            {tt.end ? ` - ${tt.end.slice(0, 5)}` : ''}
                          </div>
                        </>
                      ) : (
                        <div style={{
                          fontWeight: 600, color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: 10,
                          lineHeight: 1.2,
                          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                          textDecoration: isCompleted ? 'line-through' : 'none',
                        }}>
                          {t.title} {tt.start.slice(0, 5)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <style>{`
        .cal-add-btn:hover { opacity: 1 !important; }
        .drag-over-indicator {
          position: absolute;
          left: 0; right: 0;
          height: 2px;
          background: var(--color-primary);
          border-radius: 1px;
          box-shadow: 0 0 8px rgba(37,99,235,0.3);
        }
      `}</style>
    </div>
  );
}

/** Inline task bar used in unscheduled row (non-draggable, simpler) */
function TaskBar({ task, dateStr, showCircle, onToggleComplete, onEdit, onDragStart, onDragEnd }: {
  task: Task;
  dateStr: string;
  showCircle?: boolean;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task, date: string) => void;
  onDragStart: (e: React.DragEvent, task: Task, date: string) => void;
  onDragEnd: () => void;
}) {
  const dragRef = useRef(false);
  const isCompleted = task.status === 'completed';

  return (
    <div
      draggable
      onDragStart={(e) => { dragRef.current = true; onDragStart(e, task, dateStr); }}
      onDragEnd={() => { onDragEnd(); setTimeout(() => { dragRef.current = false; }, 50); }}
      onClick={() => { if (!dragRef.current) onEdit(task, dateStr); }}
      style={{
        margin: '1px 2px', padding: '2px 6px', borderRadius: 4, cursor: 'grab',
        background: isCompleted ? 'rgba(5,150,105,0.06)' : 'rgba(245,158,11,0.12)',
        borderLeft: isCompleted ? '3px solid #059669' : `3px solid ${PRIORITY_COLORS[task.priority]}`,
        fontSize: 12, overflow: 'hidden', whiteSpace: 'nowrap',
        textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 4,
        textDecoration: isCompleted ? 'line-through' : 'none',
        color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
      }}>
      {showCircle && (
        <span onClick={(e) => { e.stopPropagation(); onToggleComplete(task); }}
          style={{
            width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
            border: isCompleted ? '2px solid #059669' : '2px solid var(--border-default)',
            background: isCompleted ? '#059669' : 'transparent',
            cursor: 'pointer', fontSize: 7, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          {isCompleted && '✓'}
        </span>
      )}
      <span style={{ flex: 1 }}>{task.title}</span>
    </div>
  );
}
