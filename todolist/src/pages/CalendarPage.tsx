import { useState, useEffect, useCallback } from 'react';
import { Typography, Segmented, Space, Button, Drawer, TimePicker, InputNumber, Spin, message } from 'antd';
import { LeftOutlined, RightOutlined, PlusOutlined, CalendarOutlined, InboxOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTaskStore } from '@/stores/taskStore';
import { usePlanStore } from '@/stores/planStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { planService } from '@/services/planService';
import { taskService } from '@/services/taskService';
import { PRIORITY_COLORS } from '@/types/task';
import TaskFormModal, { type TaskFormParams } from '@/components/task/TaskFormModal';
import WeekView from '@/components/calendar/WeekView';
import MonthView from '@/components/calendar/MonthView';
import type { Task } from '@/types/task';

const { Text } = Typography;

type ViewMode = 'week' | 'month';

function parseMinutes(t: string): number {
  const parts = t.split(':').map(Number);
  return parts[0] * 60 + (parts[1] || 0);
}

export default function CalendarPage() {
  const [mode, setMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(dayjs());
  const { tasks, fetchTasks } = useTaskStore();
  const { fetchTaskLibrary, taskLibrary } = useTaskStore();
  const { addTaskToPlan } = usePlanStore();
  const { categories, fetchCategories } = useCategoryStore();

  // task_id -> { start, end } from daily_plan_tasks
  const [taskTimes, setTaskTimes] = useState<Record<string, { start: string; end: string | null }>>({});
  // date -> plan_id (for drag-drop cross-plan moves)
  const [planIds, setPlanIds] = useState<Record<string, string>>({});
  // task_id -> set of dates where it appears in daily_plan_tasks (for tasks whose scheduled_date differs)
  const [planTaskDates, setPlanTaskDates] = useState<Record<string, Set<string>>>({});

  // Drawer / time modal
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [pendingTask, setPendingTask] = useState<Task | null>(null);
  const [pendingDate, setPendingDate] = useState<string>('');
  const [pendingTime, setPendingTime] = useState<string>('09:00');
  const [pendingDuration, setPendingDuration] = useState<number>(60);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingDate, setEditingDate] = useState<string>('');
  const [editingStartTime, setEditingStartTime] = useState<string | undefined>();
  const [editingDuration, setEditingDuration] = useState<number | undefined>();

  useEffect(() => { fetchTasks({ page: 1, page_size: 3000 }); }, []);
  useEffect(() => { fetchCategories(); }, []);

  // Monday of the current week — works for all days including Sunday
  // startOf('week') returns Sunday (en locale), which would push Sunday into next week
  const weekStart = currentDate.subtract((currentDate.day() + 6) % 7, 'day');
  const weekEnd = weekStart.add(6, 'day');
  const startOfMonth = currentDate.startOf('month');
  const endOfMonth = currentDate.endOf('month');

  // Fetch daily plans for visible week
  const refreshWeekPlans = useCallback(async () => {
    if (mode !== 'week') return;
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(weekStart.add(i, 'day').format('YYYY-MM-DD'));
    }
    const plans = await Promise.all(
      days.map(date => planService.getDailyPlan(date).catch(() => null))
    );
    const times: Record<string, { start: string; end: string | null }> = {};
    const ids: Record<string, string> = {};
    const dateTasks: Record<string, Set<string>> = {};
    for (const plan of plans) {
      if (!plan) continue;
      ids[plan.date] = plan.id;
      for (const pt of plan.tasks) {
        // Collect task_id per date from daily_plan_tasks
        if (!dateTasks[pt.task_id]) dateTasks[pt.task_id] = new Set();
        dateTasks[pt.task_id].add(plan.date);
        if (pt.start_time) {
          times[pt.task_id] = { start: pt.start_time, end: pt.end_time };
        }
      }
    }
    setTaskTimes(times);
    setPlanIds(ids);
    setPlanTaskDates(dateTasks);
  }, [mode, weekStart.format('YYYY-MM-DD')]);

  useEffect(() => { refreshWeekPlans(); }, [refreshWeekPlans]);

  // Fetch daily plans for visible month (so month view also shows imported tasks)
  const refreshMonthPlans = useCallback(async () => {
    if (mode !== 'month') return;
    const daysInMonth = endOfMonth.date();
    const days: string[] = [];
    const monthStart = startOfMonth.format('YYYY-MM-DD');
    for (let i = 0; i < daysInMonth; i++) {
      days.push(startOfMonth.add(i, 'day').format('YYYY-MM-DD'));
    }
    const plans = await Promise.all(
      days.map(date => planService.getDailyPlan(date).catch(() => null))
    );
    const dateTasks: Record<string, Set<string>> = {};
    const times: Record<string, { start: string; end: string | null }> = {};
    const ids: Record<string, string> = {};
    for (const plan of plans) {
      if (!plan) continue;
      ids[plan.date] = plan.id;
      for (const pt of plan.tasks) {
        if (!dateTasks[pt.task_id]) dateTasks[pt.task_id] = new Set();
        dateTasks[pt.task_id].add(plan.date);
        if (pt.start_time) {
          times[pt.task_id] = { start: pt.start_time, end: pt.end_time };
        }
      }
    }
    setPlanTaskDates(dateTasks);
    setPlanIds(ids);
    setTaskTimes(times);
  }, [mode, startOfMonth.format('YYYY-MM-DD')]);

  useEffect(() => { refreshMonthPlans(); }, [refreshMonthPlans]);

  const goPrev = () => setCurrentDate(currentDate.subtract(1, mode));
  const goNext = () => setCurrentDate(currentDate.add(1, mode));
  const goToday = () => setCurrentDate(dayjs());

  const visibleTasks = tasks.filter(t => {
    if (!t.due_date && !t.scheduled_date) return false;
    const d = t.due_date || t.scheduled_date || '';
    if (mode === 'week') return d >= weekStart.format('YYYY-MM-DD') && d <= weekEnd.format('YYYY-MM-DD');
    return d >= startOfMonth.format('YYYY-MM-DD') && d <= endOfMonth.format('YYYY-MM-DD');
  });

  const getTasksForDate = (date: string) => {
    // First, tasks that match by due_date or scheduled_date
    const direct = visibleTasks.filter(t =>
      (t.due_date === date || t.scheduled_date === date)
    );
    // Also include tasks found in daily_plan_tasks for this date
    // (covers imported tasks whose scheduled_date doesn't match every day they appear)
    const extraIds = new Set<string>();
    for (const [taskId, dates] of Object.entries(planTaskDates)) {
      if (dates.has(date)) extraIds.add(taskId);
    }
    if (extraIds.size === 0) return direct;
    // Find tasks in the full tasks array that aren't already in direct
    const directIds = new Set(direct.map(t => t.id));
    const extra = tasks.filter(t => extraIds.has(t.id) && !directIds.has(t.id));
    return [...direct, ...extra];
  };

  // ── Add from library ──
  const handleAddFromLibrary = (task: Task, dateStr: string) => {
    setPendingTask(task);
    setPendingDate(dateStr);
    setPendingTime('09:00');
    setPendingDuration(task.estimated_minutes || 60);
    setDrawerOpen(false);
  };

  const confirmAddToCalendar = async () => {
    if (!pendingTask) return;
    const [h, m] = pendingTime.split(':').map(Number);
    const startTotal = h * 60 + m;
    const endTotal = Math.min(startTotal + pendingDuration, 24 * 60);
    const endH = Math.floor(endTotal / 60);
    const endM = endTotal % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    try {
      const plan = await planService.getDailyPlan(pendingDate);
      await planService.addTaskToPlan(plan.id, pendingTask.id, false, pendingTime, endTime);
      await taskService.scheduleTask(pendingTask.id, pendingDate);
      fetchTasks({ page: 1, page_size: 3000 });
      refreshWeekPlans();
    } catch (e) {
      console.error('Failed to add task to calendar:', e);
      message.error('添加失败');
    }
    setPendingTask(null);
  };

  // ── Complete / uncomplete ──
  const handleToggleComplete = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await taskService.updateTask(task.id, { status: newStatus });
      fetchTasks({ page: 1, page_size: 3000 });
    } catch (e) {
      console.error('Failed to toggle complete:', e);
    }
  };

  // ── Edit task (from calendar click) ──
  const handleEditTask = (task: Task, dateStr: string) => {
    const tt = taskTimes[task.id];
    const startTime = tt?.start?.slice(0, 5);
    let duration: number | undefined;
    if (tt?.start && tt?.end) {
      const s = parseMinutes(tt.start);
      const e = parseMinutes(tt.end);
      duration = (e <= s ? s + 60 : e) - s;
    }
    setEditingTask(task);
    setEditingDate(dateStr);
    setEditingStartTime(startTime);
    setEditingDuration(duration ?? task.estimated_minutes ?? undefined);
    setEditOpen(true);
  };

  const handleSaveEdit = async (params: TaskFormParams, taskId?: string) => {
    if (!taskId || !editingTask) return;
    try {
      // Update task fields
      await taskService.updateTask(taskId, {
        title: params.title,
        description: params.description,
        priority: params.priority,
        estimated_minutes: params.estimated_minutes,
        scheduled_date: params.scheduled_date ?? undefined,
      });

      // Ensure task is linked to the plan for the target date
      const newDate = params.scheduled_date || editingDate;
      if (newDate !== editingDate) {
        // Cross-date: remove from old plan
        const oldPlanId = planIds[editingDate];
        if (oldPlanId) {
          await planService.removeTaskFromPlan(oldPlanId, taskId);
        }
      }

      // Add/update in target plan
      if (params.start_time) {
        const startMin = parseMinutes(params.start_time);
        const dur = params.duration_minutes || 60;
        const endMin = Math.min(startMin + dur, 24 * 60);
        const endH = Math.floor(endMin / 60);
        const endM = endMin % 60;
        const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        const newPlan = await planService.getDailyPlan(newDate);
        await planService.addTaskToPlan(newPlan.id, taskId, false, params.start_time, endTime);
        await taskService.scheduleTask(taskId, newDate);
      } else if (params.scheduled_date) {
        // No time specified — still link to plan as unscheduled
        const newPlan = await planService.getDailyPlan(newDate);
        await planService.addTaskToPlan(newPlan.id, taskId, false, '', '');
        await taskService.scheduleTask(taskId, newDate);
      }

      fetchTasks({ page: 1, page_size: 3000 });
      refreshWeekPlans();
      message.success('已更新');
    } catch (e) {
      console.error('Failed to update task:', e);
      message.error('更新失败');
    }
    setEditOpen(false);
    setEditingTask(null);
  };

  // ── Drag & drop ──
  const handleDropTask = async (taskId: string, sourceDate: string, targetDate: string, targetStartTime: string, durationMin: number) => {
    try {
      const startMin = parseMinutes(targetStartTime);
      const endMin = Math.min(startMin + durationMin, 24 * 60);
      const endH = Math.floor(endMin / 60);
      const endM = endMin % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      if (sourceDate === targetDate) {
        // Same day — just update time
        const planId = planIds[targetDate];
        if (planId) {
          await planService.updatePlanTaskTime(planId, taskId, targetStartTime, endTime);
        }
      } else {
        // Cross-day move
        const srcPlanId = planIds[sourceDate];
        if (srcPlanId) {
          await planService.removeTaskFromPlan(srcPlanId, taskId);
        }
        const targetPlan = await planService.getDailyPlan(targetDate);
        await planService.addTaskToPlan(targetPlan.id, taskId, false, targetStartTime, endTime);
        // Update scheduled_date on task
        await taskService.scheduleTask(taskId, targetDate);
      }

      fetchTasks({ page: 1, page_size: 3000 });
      refreshWeekPlans();
    } catch (e) {
      console.error('Failed to move task:', e);
      message.error('移动失败');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}><CalendarOutlined style={{ marginRight: 8 }} />日历</div>
          <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {mode === 'week'
              ? `${weekStart.format('M月D日')} — ${weekEnd.format('M月D日')}`
              : currentDate.format('YYYY年M月')}
          </Text>
        </div>
        <Space>
          <Segmented
            value={mode}
            onChange={(v) => setMode(v as ViewMode)}
            options={[
              { label: <span><CalendarOutlined /> 周视图</span>, value: 'week' },
              { label: <span><CalendarOutlined /> 月视图</span>, value: 'month' },
            ]}
          />
          <div onClick={goPrev} style={navBtn}><LeftOutlined /></div>
          <div onClick={goToday} style={{ ...navBtn, width: 'auto', padding: '0 12px', fontSize: 13, fontWeight: 500 }}>今天</div>
          <div onClick={goNext} style={navBtn}><RightOutlined /></div>
          <Button type="primary" icon={<PlusOutlined />}
            onClick={async () => { setDrawerOpen(true); setLibraryLoading(true); await fetchTaskLibrary(); setLibraryLoading(false); setPendingDate(dayjs().format('YYYY-MM-DD')); }}
            style={{ background: 'linear-gradient(135deg,#2563EB,#3B82F6)', border: 'none', borderRadius: 10, fontWeight: 600 }}>
            添加任务
          </Button>
        </Space>
      </div>

      {/* Calendar grid */}
      <div className="glass-card" style={{ padding: 12, borderRadius: 18 }}>
        {mode === 'week' ? (
          <WeekView
            weekStart={weekStart}
            getTasksForDate={getTasksForDate}
            taskTimes={taskTimes}
            onAddTask={(dateStr) => { setPendingDate(dateStr); setDrawerOpen(true); setLibraryLoading(true); fetchTaskLibrary().finally(() => setLibraryLoading(false)); }}
            onEditTask={handleEditTask}
            onToggleComplete={handleToggleComplete}
            onDropTask={handleDropTask}
          />
        ) : (
          <MonthView currentDate={currentDate} getTasksForDate={getTasksForDate} />
        )}
      </div>

      {/* Task Library Drawer */}
      <Drawer title="从任务库添加" open={drawerOpen} onClose={() => setDrawerOpen(false)} width={340}>
        {libraryLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin /></div>
        ) : taskLibrary.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}><InboxOutlined /></div>
            <div style={{ fontSize: 14 }}>任务库为空</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>所有任务已完成，请先创建新任务</div>
          </div>
        ) : (
          taskLibrary.map(task => (
            <div key={task.id}
              onClick={() => handleAddFromLibrary(task, pendingDate || dayjs().format('YYYY-MM-DD'))}
              style={{
                padding: '10px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 6,
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                transition: 'all 0.2s',
              }}>
              <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 14 }}>{task.title}</div>
              <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {task.estimated_minutes ? `${task.estimated_minutes}分钟` : '未估时'} · P{task.priority}
              </Text>
            </div>
          ))
        )}
      </Drawer>

      {/* Time assignment modal (from drawer) */}
      {pendingTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setPendingTask(null)}>
          <div className="glass-card-strong" style={{ padding: 24, minWidth: 300, borderRadius: 16 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>设置时间</div>
            <Text style={{ color: 'var(--text-muted)', fontSize: 12, display: 'block', marginBottom: 12 }}><CalendarOutlined style={{ marginRight: 4 }} />{pendingDate}</Text>
            <div style={{
              padding: '6px 10px', borderRadius: 8, marginBottom: 14,
              background: `${PRIORITY_COLORS[pendingTask.priority]}10`,
              borderLeft: `3px solid ${PRIORITY_COLORS[pendingTask.priority]}`,
            }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{pendingTask.title}</Text>
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>开始时间</Text>
              <TimePicker value={dayjs(pendingTime, 'HH:mm')} onChange={t => t && setPendingTime(t.format('HH:mm'))}
                format="HH:mm" minuteStep={15} style={{ width: '100%', borderRadius: 10 }} size="large" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>持续时长（分钟）</Text>
              <InputNumber value={pendingDuration} onChange={v => v && setPendingDuration(v)}
                min={15} max={480} step={15} style={{ width: '100%', borderRadius: 10 }} size="large" addonAfter="分钟" />
            </div>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setPendingTask(null)}>取消</Button>
              <Button type="primary" onClick={confirmAddToCalendar}>确认添加</Button>
            </Space>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      <TaskFormModal
        open={editOpen}
        task={editingTask}
        initialDate={editingDate}
        initialStartTime={editingStartTime}
        initialDuration={editingDuration}
        categories={categories.map(c => ({ id: c.id, name: c.name, color: c.color }))}
        onOk={handleSaveEdit}
        onCancel={() => { setEditOpen(false); setEditingTask(null); }}
      />
    </div>
  );
}

const navBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 10,
  background: 'var(--bg-card)', border: '1px solid var(--border-default)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s',
};
