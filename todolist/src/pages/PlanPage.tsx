import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DatePicker, Typography, Skeleton, Button, Tag,
  Calendar,
} from 'antd';
import {
  LeftOutlined, RightOutlined, PlusOutlined, DeleteOutlined,
  StarFilled, StarOutlined, CheckCircleFilled, SunOutlined,
  CloudOutlined, InboxOutlined, ClockCircleOutlined, HolderOutlined,
  ExportOutlined, UnorderedListOutlined, ScheduleOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { usePlanStore } from '@/stores/planStore';
import { useTaskStore } from '@/stores/taskStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { planService } from '@/services/planService';
import { todayStr, formatDate } from '@/utils/date';
import CompletionReviewModal from '@/components/task/CompletionReviewModal';
import PlanTaskEditModal from '@/components/task/PlanTaskEditModal';
import AddTaskPanel from '@/components/plan/AddTaskPanel';
import TasksPage from '@/pages/TasksPage';
import DailyNotePreviewModal from '@/components/vault/DailyNotePreviewModal';
import SyncStatusIndicator from '@/components/vault/SyncStatusIndicator';
import { PRIORITY_COLORS } from '@/types/task';
import type { PlanTask } from '@/types/plan';
import type { Task } from '@/types/task';
import type { TaskFormParams } from '@/components/task/TaskFormModal';

const { Text, Title } = Typography;

const SIDEBAR_W = 280;

export default function PlanPage() {
  const { date: paramDate } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const {
    currentPlan, loading, fetchPlan,
    addTaskToPlan, removeTaskFromPlan, completeTask,
  } = usePlanStore();
  const { taskLibrary, fetchTaskLibrary, createTask } = useTaskStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [activeTab, setActiveTab] = useState<string>('plan');
  const [panelOpen, setPanelOpen] = useState(false);
  const [reviewTask, setReviewTask] = useState<PlanTask | null>(null);
  const [editTask, setEditTask] = useState<PlanTask | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const displayDate = paramDate || todayStr();
  const isToday = displayDate === todayStr();

  useEffect(() => { fetchPlan(displayDate); }, [displayDate]);
  useEffect(() => { fetchTaskLibrary(); }, []);
  useEffect(() => { fetchCategories(); }, []);

  const goDate = (o: number) =>
    navigate(`/plan/${dayjs(displayDate).add(o, 'day').format('YYYY-MM-DD')}`);

  // ── Computed data ──
  const { morningTasks, afternoonTasks, unscheduled, completedCount, totalCount } = useMemo(() => {
    const morning = currentPlan?.tasks.filter((pt) =>
      pt.start_time && parseInt(pt.start_time.split(':')[0]) < 12
    ) || [];
    const afternoon = currentPlan?.tasks.filter((pt) =>
      pt.start_time && parseInt(pt.start_time.split(':')[0]) >= 12
    ) || [];
    const unsched = currentPlan?.tasks.filter((pt) => !pt.start_time) || [];
    const done = currentPlan?.tasks.filter((pt) => pt.task.status === 'completed').length || 0;
    const all = currentPlan?.tasks.length || 0;
    return {
      morningTasks: morning, afternoonTasks: afternoon,
      unscheduled: unsched, completedCount: done, totalCount: all,
    };
  }, [currentPlan]);

  // ── Task plan dates (for mini calendar dots) ──
  const planDates = useMemo(() => {
    // We don't have all plan dates here; just show dot on current selected date
    return new Set([displayDate]);
  }, [displayDate]);

  // ── Handlers ──

  /** Add a library task directly to plan with time */
  const handleAddFromLibrary = async (taskId: string, startTime: string, endTime: string) => {
    await addTaskToPlan(taskId, false, startTime, endTime);
  };

  /** Quick create a new task and add to plan (with or without time) */
  const handleQuickCreate = async (params: TaskFormParams) => {
    const taskDate = params.scheduled_date || displayDate;
    const task = await createTask({
      title: params.title,
      description: params.description,
      priority: params.priority,
      estimated_minutes: params.estimated_minutes,
      scheduled_date: taskDate,
      category_id: params.category_id ?? null,
    });
    if (task) {
      const startTime = params.start_time || '';
      if (params.start_time) {
        const [h, m] = params.start_time.split(':').map(Number);
        const startTotal = h * 60 + m;
        const dur = params.duration_minutes || 60;
        const endTotal = Math.min(startTotal + dur, 24 * 60);
        const endH = Math.floor(endTotal / 60);
        const endM = endTotal % 60;
        const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        if (taskDate === displayDate) {
          await addTaskToPlan(task.id, false, startTime, endTime);
        } else {
          const targetPlan = await planService.getDailyPlan(taskDate);
          await planService.addTaskToPlan(targetPlan.id, task.id, false, startTime, endTime);
        }
      } else {
        // No start time — add to plan as unscheduled
        if (taskDate === displayDate) {
          await addTaskToPlan(task.id, false, '', '');
        } else {
          const targetPlan = await planService.getDailyPlan(taskDate);
          await planService.addTaskToPlan(targetPlan.id, task.id, false, '', '');
        }
      }
    }
    setPanelOpen(false);
  };

  const toggleMit = async (pt: PlanTask) => {
    await addTaskToPlan(pt.task_id, !pt.is_mit, pt.start_time, pt.end_time);
  };

  const handleEditSave = async (taskId: string, startTime: string, endTime: string, isMit: boolean) => {
    await addTaskToPlan(taskId, isMit, startTime, endTime);
    setEditTask(null);
  };

  // ── Render ──
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div onClick={() => goDate(-1)} style={navBtn}><LeftOutlined /></div>
          <DatePicker
            value={dayjs(displayDate)}
            onChange={(d) => d && navigate(`/plan/${d.format('YYYY-MM-DD')}`)}
            allowClear={false} style={{ width: 140, borderRadius: 12 }}
          />
          <div onClick={() => goDate(1)} style={navBtn}><RightOutlined /></div>

          {/* Tab toggle */}
          <div style={{
            display: 'flex', marginLeft: 12, background: 'var(--bg-glass)',
            borderRadius: 12, padding: 3, border: '1px solid var(--border-subtle)',
          }}>
            <button
              onClick={() => setActiveTab('plan')}
              style={tabBtnStyle(activeTab === 'plan')}
            >
              <ScheduleOutlined style={{ fontSize: 13 }} />
              每日计划
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              style={tabBtnStyle(activeTab === 'tasks')}
            >
              <UnorderedListOutlined style={{ fontSize: 13 }} />
              任务库
            </button>
          </div>

          {activeTab === 'plan' && (
            <>
              <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {formatDate(displayDate, 'M月D日 dddd')}
              </Text>
              {isToday && <Tag color="blue" style={{ borderRadius: 8, marginLeft: 4 }}>今天</Tag>}
              {completedCount > 0 && (
                <Tag color="success" style={{ borderRadius: 8 }}>
                  <CheckCircleFilled style={{ marginRight: 4 }} />
                  {completedCount}/{totalCount}
                </Tag>
              )}
              <SyncStatusIndicator date={displayDate} />
            </>
          )}
        </div>
        {activeTab === 'plan' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              icon={<ExportOutlined />}
              onClick={() => setPreviewOpen(true)}
              style={{ borderRadius: 12, fontWeight: 500 }}
            >
              导出到 Obsidian
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setPanelOpen(true)}
              style={{ borderRadius: 12, fontWeight: 600, boxShadow: '0 2px 8px rgba(37,99,235,0.18)' }}
            >
              添加任务
            </Button>
          </div>
        )}
      </div>

      {/* Body */}
      {activeTab === 'tasks' ? (
        <div style={{ flex: 1, minHeight: 0 }}>
          <TasksPage />
        </div>
      ) : loading || !currentPlan ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0 }}>
          {/* ── Left: Mini Calendar + Unscheduled ── */}
          <div style={{
            width: SIDEBAR_W, flexShrink: 0,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {/* Mini Calendar */}
            <div className="glass-card" style={{ overflow: 'hidden', padding: 12 }}>
              <Calendar
                fullscreen={false}
                value={dayjs(displayDate)}
                onSelect={(d) => navigate(`/plan/${d.format('YYYY-MM-DD')}`)}
                fullCellRender={(date: Dayjs) => {
                  const dateStr = date.format('YYYY-MM-DD');
                  const hasPlan = planDates.has(dateStr);
                  const isTodayDate = dateStr === todayStr();
                  return (
                    <div style={{ textAlign: 'center', position: 'relative' }}>
                      <div style={{
                        width: 28, height: 28, lineHeight: '28px',
                        borderRadius: '50%',
                        margin: '0 auto',
                        fontSize: 13,
                        ...(isTodayDate ? {
                          background: '#2563EB',
                          color: 'white',
                          fontWeight: 600,
                        } : {}),
                      }}>
                        {date.date()}
                      </div>
                      {hasPlan && !isTodayDate && (
                        <div style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: '#2563EB',
                          margin: '2px auto 0',
                        }} />
                      )}
                    </div>
                  );
                }}
              />
            </div>

            {/* Unscheduled tasks */}
            <div className="glass-card" style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                  <InboxOutlined style={{ marginRight: 6 }} />
                  待安排
                </Text>
                <Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {unscheduled.length} 项
                </Text>
              </div>
              {unscheduled.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <Text style={{ fontSize: 13, color: 'var(--text-muted)' }}>全部已安排</Text>
                </div>
              ) : (
                unscheduled.map((pt) => (
                  <div
                    key={pt.task_id}
                    onClick={() => setPanelOpen(true)}
                    className="unscheduled-item"
                  >
                    <HolderOutlined style={{ color: 'var(--text-muted)', fontSize: 14, cursor: 'grab', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 13, color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pt.task.title}
                      </Text>
                      <Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {pt.task.estimated_minutes ? `${pt.task.estimated_minutes}分钟` : '未估时'} · P{pt.task.priority}
                      </Text>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Right: Morning + Afternoon Timeline ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            {/* Morning */}
            <div className="glass-card" style={{ flex: 1, padding: '20px 24px', overflow: 'auto' }}>
              <div style={{
                padding: '8px 16px', borderRadius: 10,
                background: 'linear-gradient(90deg, rgba(251,146,60,0.10), rgba(37,99,235,0.04))',
                marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <Text strong style={{ fontSize: 15, color: 'var(--text-primary)' }}>
                  <SunOutlined style={{ marginRight: 8, color: '#F97316' }} />
                  上午
                </Text>
                <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>7:00 — 12:00</Text>
              </div>
              {morningTasks.length === 0 ? (
                <EmptySlot icon={<SunOutlined />} text="上午还没有安排" />
              ) : (
                morningTasks
                  .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
                  .map((pt) => (
                    <TaskCard
                      key={pt.task_id} pt={pt}
                      onEdit={() => setEditTask(pt)}
                      onComplete={() => setReviewTask(pt)}
                      onRemove={() => removeTaskFromPlan(pt.task_id)}
                      onToggleMit={() => toggleMit(pt)}
                    />
                  ))
              )}
            </div>

            {/* Afternoon */}
            <div className="glass-card" style={{ flex: 1, padding: '20px 24px', overflow: 'auto' }}>
              <div style={{
                padding: '8px 16px', borderRadius: 10,
                background: 'linear-gradient(90deg, rgba(59,130,246,0.10), rgba(139,92,246,0.04))',
                marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <Text strong style={{ fontSize: 15, color: 'var(--text-primary)' }}>
                  <CloudOutlined style={{ marginRight: 8, color: '#3B82F6' }} />
                  下午
                </Text>
                <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>12:00 — 24:00</Text>
              </div>
              {afternoonTasks.length === 0 ? (
                <EmptySlot icon={<CloudOutlined />} text="下午还没有安排" />
              ) : (
                afternoonTasks
                  .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
                  .map((pt) => (
                    <TaskCard
                      key={pt.task_id} pt={pt}
                      onEdit={() => setEditTask(pt)}
                      onComplete={() => setReviewTask(pt)}
                      onRemove={() => removeTaskFromPlan(pt.task_id)}
                      onToggleMit={() => toggleMit(pt)}
                    />
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add Task Panel ── */}
      <AddTaskPanel
        open={panelOpen}
        displayDate={displayDate}
        onClose={() => setPanelOpen(false)}
        onAddFromLibrary={handleAddFromLibrary}
        onQuickCreate={handleQuickCreate}
      />

      {/* ── Completion review modal ── */}
      <CompletionReviewModal
        open={!!reviewTask} planTask={reviewTask}
        onComplete={async (actualMinutes, completionNote) => {
          if (reviewTask) { await completeTask(reviewTask.task_id, actualMinutes, completionNote); setReviewTask(null); }
        }}
        onSkip={async () => {
          if (reviewTask) { await completeTask(reviewTask.task_id); setReviewTask(null); }
        }}
        onCancel={() => setReviewTask(null)}
      />

      {/* ── Plan task edit modal ── */}
      <PlanTaskEditModal
        open={!!editTask}
        planTask={editTask}
        onSave={handleEditSave}
        onCancel={() => setEditTask(null)}
      />

      {/* ── Obsidian Daily Note export ── */}
      <DailyNotePreviewModal
        open={previewOpen}
        date={displayDate}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}

// ── Inline Components ──

function TaskCard({ pt, onEdit, onComplete, onRemove, onToggleMit }: {
  pt: PlanTask; onEdit: () => void; onComplete: () => void; onRemove: () => void; onToggleMit: () => void;
}) {
  const isCompleted = pt.task.status === 'completed';
  const [hover, setHover] = useState(false);
  const { Text } = Typography;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={isCompleted ? undefined : onEdit}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', borderRadius: 14, marginBottom: 8,
        cursor: isCompleted ? 'default' : 'pointer',
        background: isCompleted
          ? 'rgba(5,150,105,0.04)'
          : hover ? 'var(--bg-card-hover)' : 'var(--bg-glass)',
        border: isCompleted
          ? '1px solid rgba(5,150,105,0.15)'
          : '1px solid var(--border-subtle)',
        transition: 'all 0.2s var(--ease-out)',
      }}
    >
      {/* Time badge */}
      <div style={{
        minWidth: 50, height: 30, borderRadius: 10, flexShrink: 0,
        background: isCompleted ? 'rgba(5,150,105,0.10)' : 'rgba(37,99,235,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 600,
        color: isCompleted ? '#059669' : '#2563EB',
      }}>
        <ClockCircleOutlined style={{ marginRight: 4, fontSize: 11 }} />
        {pt.start_time?.slice(0, 5) || '--:--'}
      </div>

      {/* Priority dot */}
      <span style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: PRIORITY_COLORS[pt.task.priority],
        opacity: isCompleted ? 0.4 : 1,
      }} />

      {/* Title */}
      <span className={isCompleted ? 'task-completed' : ''} style={{
        flex: 1, fontSize: 14, fontWeight: pt.is_mit ? 600 : 400,
        color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
      }}>
        {pt.task.title}
      </span>

      {/* MIT star */}
      {!isCompleted && (
        <span onClick={(e) => { e.stopPropagation(); onToggleMit(); }}
          style={{ cursor: 'pointer', color: pt.is_mit ? '#F59E0B' : 'var(--text-muted)', fontSize: 15, flexShrink: 0 }}>
          {pt.is_mit ? <StarFilled /> : <StarOutlined />}
        </span>
      )}

      {/* Complete button */}
      {!isCompleted && (
        <span
          onClick={(e) => { e.stopPropagation(); onComplete(); }}
          style={{
            cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="完成任务"
        >
          <CheckCircleFilled style={{
            color: hover ? '#10b981' : 'var(--text-muted)',
            fontSize: 20,
            transition: 'color 0.2s',
            opacity: hover ? 1 : 0.5,
          }} />
        </span>
      )}

      {/* Delete */}
      {!isCompleted && hover && (
        <DeleteOutlined onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{ color: 'var(--text-muted)', fontSize: 14, flexShrink: 0 }} />
      )}

      {/* Completed */}
      {isCompleted && (
        <CheckCircleFilled style={{ color: '#059669', fontSize: 18, flexShrink: 0 }} />
      )}
    </div>
  );
}

function EmptySlot({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="empty-state" style={{ padding: '36px 20px' }}>
      <div style={{ fontSize: 28, color: 'var(--text-muted)', marginBottom: 8, opacity: 0.5 }}>
        {icon}
      </div>
      <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>{text}</Text>
      <Text style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, opacity: 0.6 }}>
        点击上方添加任务开始
      </Text>
    </div>
  );
}

function tabBtnStyle(isActive: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 6,
    height: 34, paddingInline: 14,
    border: 'none', borderRadius: 10,
    cursor: 'pointer',
    fontSize: 13, fontWeight: isActive ? 600 : 500,
    background: isActive
      ? 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(99,102,241,0.06))'
      : 'transparent',
    color: isActive ? '#2563EB' : 'var(--text-secondary)',
    boxShadow: isActive ? '0 1px 3px rgba(37,99,235,0.10)' : 'none',
    transition: 'all 0.2s var(--ease-out)',
  };
}

const navBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 12,
  background: 'var(--bg-glass)',
  border: '1px solid var(--border-subtle)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: 'var(--text-secondary)',
  transition: 'all 0.15s var(--ease-out)',
  flexShrink: 0,
};
