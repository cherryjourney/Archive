import { useState, useRef, useCallback, useEffect } from 'react';
import { Checkbox, Tag, Space, Typography, Tooltip } from 'antd';
import { ClockCircleOutlined, StarFilled, DeleteOutlined } from '@ant-design/icons';
import type { DailyPlan, PlanTask } from '@/types/plan';
import PriorityBadge from '@/components/common/PriorityBadge';
import { usePlanStore } from '@/stores/planStore';
import { PRIORITY_COLORS } from '@/types/task';

const { Text } = Typography;

const START_HOUR = 7;
const END_HOUR = 24;
const HOUR_HEIGHT = 64; // px per hour
const TOTAL_HOURS = END_HOUR - START_HOUR;
const PADDING_LEFT = 56; // space for time labels

interface Props {
  plan: DailyPlan;
}

export default function Timeline({ plan }: Props) {
  const { completeTask, removeTaskFromPlan, updateTaskTime, addTaskToPlan } = usePlanStore();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);
  const [nowPosition, setNowPosition] = useState(0);

  // Update current time indicator every minute
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hours = now.getHours() + now.getMinutes() / 60;
      if (hours >= START_HOUR && hours <= END_HOUR) {
        setNowPosition((hours - START_HOUR) * HOUR_HEIGHT);
      } else {
        setNowPosition(-1);
      }
    };
    tick();
    const timer = setInterval(tick, 60000);
    return () => clearInterval(timer);
  }, []);

  // Convert HH:MM to Y position
  const timeToY = useCallback((time: string | null): number => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return (h - START_HOUR + m / 60) * HOUR_HEIGHT;
  }, []);

  // Convert Y position to HH:MM
  const yToTime = useCallback((y: number): string => {
    const hours = Math.max(START_HOUR, Math.min(END_HOUR, START_HOUR + y / HOUR_HEIGHT));
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60 / 5) * 5; // snap to 5 min
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }, []);

  // Calculate end time from start + estimated minutes
  const calcEndTime = useCallback((startTime: string, estimatedMinutes: number | null): string => {
    if (!estimatedMinutes) estimatedMinutes = 30;
    const [h, m] = startTime.split(':').map(Number);
    const totalMins = h * 60 + m + estimatedMinutes;
    const eh = Math.min(END_HOUR, Math.floor(totalMins / 60));
    const em = totalMins % 60;
    return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
  }, []);

  // Handle drag over (for drop position)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    setDragY(y);
  };

  const handleDragLeave = () => {
    setDragY(-1);
  };

  // Handle drop on timeline background (new task from library)
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragY(-1);
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId || !timelineRef.current || dragging) return;

    // Find the task's estimated minutes from the task library
    const library = plan.tasks.find(pt => pt.task_id === taskId);
    const estimatedMin = library?.task.estimated_minutes || 30;

    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const startTime = yToTime(y);
    const endTime = calcEndTime(startTime, estimatedMin);

    await addTaskToPlan(taskId, false, startTime, endTime);
  };

  // Drag task card
  const handleTaskDragStart = (e: React.DragEvent, pt: PlanTask) => {
    e.dataTransfer.setData('taskId', pt.task_id);
    e.dataTransfer.setData('isMove', 'true');
    e.dataTransfer.setData('origStart', pt.start_time || '');
    setDragging(pt.task_id);
  };

  // Calculate task duration in minutes from start/end times
  const getDuration = useCallback((startTime: string | null, endTime: string | null): number => {
    if (!startTime || !endTime) return 30; // default 30 min
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  }, []);

  // Calculate task card position and height based on actual time span
  const getTaskStyle = (pt: PlanTask): React.CSSProperties => {
    const startY = timeToY(pt.start_time);
    const duration = getDuration(pt.start_time, pt.end_time);
    const height = Math.max(28, (duration / 60) * HOUR_HEIGHT);

    return {
      position: 'absolute',
      top: startY,
      height,
      left: PADDING_LEFT + 4,
      right: 8,
      opacity: dragging === pt.task_id ? 0.4 : 1,
      transition: 'opacity 0.2s',
      zIndex: dragging === pt.task_id ? 100 : 1,
      cursor: 'grab',
    };
  };

  // Update drag end to preserve duration
  const handleTaskDragEnd = async (e: React.DragEvent, pt: PlanTask) => {
    setDragging(null);
    setDragY(-1);
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    if (y < 0 || y > TOTAL_HOURS * HOUR_HEIGHT) return;

    const newStart = yToTime(y);
    const duration = getDuration(pt.start_time, pt.end_time);
    const [sh, sm] = newStart.split(':').map(Number);
    const totalMins = sh * 60 + sm + duration;
    const eh = Math.min(END_HOUR, Math.floor(totalMins / 60));
    const em = totalMins % 60;
    const newEnd = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

    if (newStart !== pt.start_time) {
      await updateTaskTime(pt.task_id, newStart, newEnd);
    }
  };

  const pendingTasks = plan.tasks.filter(pt => pt.task.status !== 'completed' && pt.start_time);
  const unscheduledTasks = plan.tasks.filter(pt => !pt.start_time);
  const completedTasks = plan.tasks.filter(pt => pt.task.status === 'completed');

  return (
    <div style={{ position: 'relative' }}>
      {/* 未安排任务区 */}
      {unscheduledTasks.length > 0 && (
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px dashed rgba(245,158,11,0.3)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 14,
        }}>
          <Text type="secondary" style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>
            📥 待安排 — 拖拽到下方时间线
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {unscheduledTasks.map(pt => (
              <div
                key={pt.task_id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('taskId', pt.task_id);
                  e.dataTransfer.setData('isMove', 'false');
                }}
                style={{
                  padding: '4px 10px', borderRadius: 8, cursor: 'grab',
                  background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.08)',
                  fontSize: 13, color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: PRIORITY_COLORS[pt.task.priority],
                }} />
                {pt.task.title}
                <DeleteOutlined style={{ fontSize: 10, color: '#c4bfd8', cursor: 'pointer' }}
                  onClick={() => removeTaskFromPlan(pt.task_id)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 时间线容器 */}
      <div
        ref={timelineRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          position: 'relative',
          height: TOTAL_HOURS * HOUR_HEIGHT,
          background: 'rgba(255,255,255,0.3)',
          borderRadius: 14,
          border: '1px solid rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        {/* 时间刻度 */}
        {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: i * HOUR_HEIGHT,
              left: 0,
              right: 0,
              borderTop: i > 0 ? '1px solid rgba(0,0,0,0.06)' : 'none',
              height: 1,
            }}
          >
            <span style={{
              position: 'absolute', left: 8, top: -10,
              fontSize: 11, color: '#a49ebf', fontWeight: 500,
              width: 42, textAlign: 'right',
            }}>
              {`${String(START_HOUR + i).padStart(2, '0')}:00`}
            </span>
          </div>
        ))}

        {/* 半小时间隔 */}
        {Array.from({ length: TOTAL_HOURS }, (_, i) => (
          <div
            key={`half-${i}`}
            style={{
              position: 'absolute',
              top: (i + 0.5) * HOUR_HEIGHT,
              left: PADDING_LEFT,
              right: 0,
              borderTop: '1px dashed rgba(0,0,0,0.03)',
              height: 1,
            }}
          />
        ))}

        {/* 当前时间指示线 */}
        {nowPosition > 0 && (
          <div style={{
            position: 'absolute',
            top: nowPosition, left: 0, right: 0,
            borderTop: '2px solid #f43f5e',
            zIndex: 10, pointerEvents: 'none',
          }}>
            <div style={{
              position: 'absolute', left: -2, top: -6,
              width: 12, height: 12, borderRadius: '50%',
              background: '#f43f5e', boxShadow: '0 0 8px rgba(244,63,94,0.5)',
            }} />
          </div>
        )}

        {/* 拖拽预览 */}
        {dragY > 0 && (
          <div style={{
            position: 'absolute',
            top: dragY, left: PADDING_LEFT, right: 8,
            height: 32, borderRadius: 8,
            background: 'rgba(108,92,231,0.15)',
            border: '2px dashed rgba(108,92,231,0.4)',
            pointerEvents: 'none', zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: '#6c5ce7',
          }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {yToTime(dragY)}
          </div>
        )}

        {/* 任务卡片 */}
        {pendingTasks.map(pt => {
          const isCompleted = pt.task.status === 'completed';
          return (
            <div
              key={pt.task_id}
              draggable={!isCompleted}
              onDragStart={(e) => handleTaskDragStart(e, pt)}
              onDragEnd={(e) => handleTaskDragEnd(e, pt)}
              style={{
                ...getTaskStyle(pt),
                background: pt.is_mit
                  ? 'linear-gradient(135deg, #fff9db, #fff3bf)'
                  : isCompleted
                  ? 'rgba(255,255,255,0.5)'
                  : 'rgba(255,255,255,0.85)',
                border: pt.is_mit
                  ? '1px solid rgba(245,158,11,0.4)'
                  : '1px solid rgba(0,0,0,0.08)',
                borderRadius: 8,
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: pt.is_mit ? '0 2px 8px rgba(245,158,11,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <Checkbox
                checked={isCompleted}
                onChange={() => completeTask(pt.task_id)}
                style={{ flexShrink: 0 }}
              />
              {pt.is_mit && <StarFilled style={{ color: '#f59e0b', fontSize: 12, flexShrink: 0 }} />}
              <PriorityBadge priority={pt.task.priority} size="small" />
              <span
                className={isCompleted ? 'task-completed' : ''}
                style={{
                  fontSize: 13, fontWeight: pt.is_mit ? 600 : 400,
                  flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                }}
              >
                {pt.task.title}
              </span>
              <Text style={{ fontSize: 10, color: '#c4bfd8', flexShrink: 0 }}>
                {pt.start_time?.slice(0, 5)}
                {pt.end_time && `-${pt.end_time.slice(0, 5)}`}
              </Text>
              <Tooltip title="移除">
                <DeleteOutlined
                  style={{ fontSize: 10, color: '#c4bfd8', cursor: 'pointer', flexShrink: 0 }}
                  onClick={(e) => { e.stopPropagation(); removeTaskFromPlan(pt.task_id); }}
                />
              </Tooltip>
            </div>
          );
        })}

        {/* 已完成（底部叠放） */}
        {completedTasks.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 8, left: PADDING_LEFT + 4, right: 8,
            background: 'rgba(16,185,129,0.06)', borderRadius: 10,
            border: '1px solid rgba(16,185,129,0.15)', padding: '6px 12px',
            display: 'flex', flexWrap: 'wrap', gap: 4,
          }}>
            <Text style={{ fontSize: 11, color: '#10b981', width: '100%', marginBottom: 2 }}>
              ✅ 已完成 ({completedTasks.length})
            </Text>
            {completedTasks.map(pt => (
              <Tag key={pt.task_id} style={{ borderRadius: 6, fontSize: 11, opacity: 0.7, margin: 0 }}>
                {pt.task.title}
              </Tag>
            ))}
          </div>
        )}
      </div>

      {/* 底部快捷面板：完成任务复盘 */}
      {plan.tasks.filter(t => t.task.status === 'completed').length > 0 && (
        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 10,
          background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Text style={{ color: '#10b981', fontWeight: 600 }}>🎉 今日已完成 {completedTasks.length}/{plan.tasks.length} 项</Text>
          <Text style={{ color: '#a49ebf', fontSize: 12 }}>
            {plan.efficiency_rating ? `效率: ${'⭐'.repeat(plan.efficiency_rating)}` : '记得晚上复盘哦'}
          </Text>
        </div>
      )}
    </div>
  );
}
