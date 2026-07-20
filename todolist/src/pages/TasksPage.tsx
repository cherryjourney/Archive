import { useEffect, useState, useCallback } from 'react';
import { Button, Input, Table, Tag, Space, Modal, Typography, Select, Row, Col, DatePicker, InputNumber, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Task, TaskStatus } from '@/types/task';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/types/task';
import { useTaskStore } from '@/stores/taskStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { relativeTime } from '@/utils/date';
import TaskFormModal, { type TaskFormParams } from '@/components/task/TaskFormModal';

const { Text, Title } = Typography;

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  pending: { color: '#94A3B8', label: '待开始' },
  in_progress: { color: '#2563EB', label: '进行中' },
  completed: { color: '#059669', label: '已完成' },
  cancelled: { color: '#DC2626', label: '已取消' },
};

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待开始' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

const PRIORITY_OPTIONS = [
  { value: -1, label: '全部优先级' },
  { value: 0, label: 'P0 紧急' },
  { value: 1, label: 'P1 重要' },
  { value: 2, label: 'P2 普通' },
  { value: 3, label: 'P3 低优' },
];

// ── Auto Status ──

function calcAutoStatus(task: Pick<Task, 'status' | 'start_date' | 'due_date' | 'scheduled_date'>): string {
  if (task.status === 'completed' || task.status === 'cancelled') {
    return task.status;
  }
  const today = dayjs().startOf('day');
  const start = task.start_date ? dayjs(task.start_date).startOf('day') : null;
  const due = task.due_date ? dayjs(task.due_date).startOf('day') : null;
  const scheduled = task.scheduled_date ? dayjs(task.scheduled_date).startOf('day') : null;

  // Use start_date or scheduled_date as the effective start
  const effectiveStart = start || scheduled;

  if (effectiveStart && today.isBefore(effectiveStart)) return 'pending';
  if (due && today.isAfter(due)) return 'in_progress';
  if (effectiveStart) return 'in_progress';
  return 'in_progress';
}

export default function TasksPage() {
  const { tasks, total, loading, fetchTasks, createTask, updateTask, deleteTask } = useTaskStore();
  const { categories, fetchCategories } = useCategoryStore();

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<number>(-1);
  const [page, setPage] = useState(1);

  // Selection
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Modal (for creating new tasks only)
  const [modalOpen, setModalOpen] = useState(false);

  // ── Inline Edit Form State ──
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<number>(1);
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [editDueDate, setEditDueDate] = useState<string>('');
  const [editEstimatedMinutes, setEditEstimatedMinutes] = useState<number>(0);
  const [editCategoryId, setEditCategoryId] = useState<string | undefined>(undefined);

  // Sync form when selected task changes
  useEffect(() => {
    if (selectedTask) {
      setEditTitle(selectedTask.title);
      setEditDescription(selectedTask.description || '');
      setEditPriority(selectedTask.priority);
      setEditStartDate(selectedTask.start_date || '');
      setEditDueDate(selectedTask.due_date || '');
      setEditEstimatedMinutes(selectedTask.estimated_minutes || 0);
      setEditCategoryId(undefined);
    }
  }, [selectedTask]);

  const buildFilters = useCallback(() => {
    const f: Record<string, unknown> = { page, page_size: 50 };
    if (search) f.search = search;
    if (statusFilter) f.status = statusFilter;
    if (priorityFilter >= 0) f.priority = priorityFilter;
    return f;
  }, [search, statusFilter, priorityFilter, page]);

  useEffect(() => { fetchTasks(buildFilters()); }, []);
  useEffect(() => { fetchCategories(); }, []);

  const refresh = () => fetchTasks(buildFilters());
  const handleSearch = () => { setPage(1); setTimeout(refresh, 0); };

  const handleSaveEdit = async () => {
    if (!selectedTask) return;
    const autoStatus = calcAutoStatus({
      status: selectedTask.status,
      start_date: editStartDate,
      due_date: editDueDate,
      scheduled_date: selectedTask.scheduled_date,
    });
    await updateTask(selectedTask.id, {
      title: editTitle,
      description: editDescription,
      priority: editPriority,
      start_date: editStartDate || undefined,
      due_date: editDueDate || undefined,
      estimated_minutes: editEstimatedMinutes,
      category_id: editCategoryId,
      status: (['completed', 'cancelled'].includes(selectedTask.status) ? selectedTask.status : autoStatus) as TaskStatus,
    });
    message.success('已保存');
    refresh();
  };

  const handleCreate = () => setModalOpen(true);

  const handleOk = async (params: TaskFormParams, taskId?: string) => {
    if (taskId) await updateTask(taskId, params);
    else await createTask(params);
    setModalOpen(false);
    refresh();
    setSelectedTask(null);
  };

  const columns: ColumnsType<Task> = [
    {
      title: '任务', dataIndex: 'title', key: 'title',
      render: (_text: string, r: Task) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: PRIORITY_COLORS[r.priority],
            opacity: r.status === 'completed' ? 0.4 : 1,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                color: r.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)',
                textDecoration: r.status === 'completed' ? 'line-through' : 'none',
                display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {r.title}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: '优先级', dataIndex: 'priority', key: 'priority', width: 90,
      render: (p: number) => (
        <Tag style={{
          background: `${PRIORITY_COLORS[p]}14`, border: `1px solid ${PRIORITY_COLORS[p]}30`,
          color: PRIORITY_COLORS[p], borderRadius: 8, fontSize: 12,
        }}>
          {PRIORITY_LABELS[p]}
        </Tag>
      ),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (_s: string, r: Task) => {
        const auto = calcAutoStatus(r);
        const m = STATUS_MAP[auto] || { color: '#94A3B8', label: auto };
        return (
          <Tag style={{ background: `${m.color}12`, border: 'none', color: m.color, borderRadius: 8, fontSize: 12 }}>
            {m.label}
          </Tag>
        );
      },
    },
    {
      title: '更新', dataIndex: 'updated_at', key: 'updated_at', width: 90,
      render: (d: string) => <Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>{relativeTime(d)}</Text>,
    },
  ];

  // ── Render ──
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <Title level={3} style={{ margin: 0, fontSize: 24 }}>任务库</Title>
          <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>共 {total} 项任务</Text>
          <Text style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic', letterSpacing: 0.5, marginTop: 2, display: 'block' }}>
            那些不曾敷衍的朝夕，被安放于此。
          </Text>
        </div>
        <Space>
          <Input
            placeholder="搜索任务..." prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
            value={search} onChange={(e) => setSearch(e.target.value)}
            onPressEnter={handleSearch} allowClear
            style={{ width: 220, borderRadius: 12 }}
          />
          <Select
            value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); setTimeout(refresh, 0); }}
            style={{ width: 120, borderRadius: 12 }}
            options={STATUS_OPTIONS}
          />
          <Select
            value={priorityFilter} onChange={(v) => { setPriorityFilter(v); setPage(1); setTimeout(refresh, 0); }}
            style={{ width: 130, borderRadius: 12 }}
            options={PRIORITY_OPTIONS}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}
            style={{ borderRadius: 12, fontWeight: 600 }}>
            新建任务
          </Button>
        </Space>
      </div>

      {/* Dual Panel */}
      <Row gutter={16} style={{ flex: 1, minHeight: 0 }}>
        {/* Left: Task List */}
        <Col xs={24} lg={selectedTask ? 13 : 24} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="glass-card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Table
              columns={columns}
              dataSource={tasks}
              rowKey="id"
              loading={loading}
              size="middle"
              pagination={{
                total, current: page, pageSize: 50, showSizeChanger: false,
                showTotal: (t) => <Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>共 {t} 项</Text>,
                onChange: (p) => { setPage(p); setTimeout(refresh, 0); },
              }}
              onRow={(record) => ({
                onClick: () => setSelectedTask(record),
                style: {
                  background: selectedTask?.id === record.id ? 'var(--color-fill)' : 'transparent',
                  cursor: 'pointer',
                },
              })}
              style={{ background: 'transparent' }}
              rowClassName={() => 'task-table-row'}
            />
            <style>{`
              .task-table-row { background: transparent !important; }
              .task-table-row:hover { background: var(--color-fill) !important; }
              .ant-table { background: transparent !important; }
              .ant-table-thead > tr > th {
                background: var(--color-fill) !important;
                color: var(--text-secondary) !important;
                border-bottom: 1px solid var(--border-subtle) !important;
                font-size: 12px !important;
              }
              .ant-table-tbody > tr > td {
                border-bottom: 1px solid var(--border-subtle) !important;
              }
            `}</style>
          </div>
        </Col>

        {/* Right: Inline Edit Panel */}
        {selectedTask && (
          <Col xs={24} lg={11} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="glass-card" style={{ flex: 1, padding: '24px 28px', overflow: 'auto' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20, color: 'var(--color-primary)' }}>
                ✏️ 编辑任务
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* 任务名称 */}
                <div>
                  <Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>任务名称</Text>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{ borderRadius: 12 }}
                  />
                </div>

                {/* 描述 */}
                <div>
                  <Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>描述</Text>
                  <Input.TextArea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    style={{ borderRadius: 12 }}
                  />
                </div>

                {/* 优先级 */}
                <div>
                  <Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>优先级</Text>
                  <Select
                    value={editPriority}
                    onChange={setEditPriority}
                    style={{ width: '100%', borderRadius: 12 }}
                    options={PRIORITY_OPTIONS.filter(o => o.value >= 0)}
                  />
                </div>

                {/* 状态 — 只读展示（自动判定） */}
                <div>
                  <Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>状态</Text>
                  <Tag color={STATUS_MAP[selectedTask.status]?.color || '#94A3B8'} style={{ borderRadius: 8 }}>
                    {STATUS_MAP[selectedTask.status]?.label || '未知'}
                  </Tag>
                  <Text style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                    🔄 根据时间自动判定
                  </Text>
                </div>

                {/* 计划开始日期 */}
                <div>
                  <Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>计划开始</Text>
                  <DatePicker
                    value={editStartDate ? dayjs(editStartDate) : null}
                    onChange={(d) => setEditStartDate(d ? d.format('YYYY-MM-DD') : '')}
                    style={{ width: '100%', borderRadius: 12 }}
                  />
                </div>

                {/* 截止日期 */}
                <div>
                  <Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>截止日期</Text>
                  <DatePicker
                    value={editDueDate ? dayjs(editDueDate) : null}
                    onChange={(d) => setEditDueDate(d ? d.format('YYYY-MM-DD') : '')}
                    style={{ width: '100%', borderRadius: 12 }}
                  />
                </div>

                {/* 预估耗时 */}
                <div>
                  <Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>预估耗时（分钟）</Text>
                  <InputNumber
                    value={editEstimatedMinutes}
                    onChange={(v) => setEditEstimatedMinutes(v ?? 0)}
                    min={0} style={{ width: '100%', borderRadius: 12 }}
                  />
                </div>

                {/* 分类 */}
                <div>
                  <Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>分类</Text>
                  <Select
                    value={editCategoryId}
                    onChange={setEditCategoryId}
                    allowClear
                    style={{ width: '100%', borderRadius: 12 }}
                    options={categories.map(c => ({ value: c.id, label: c.name }))}
                  />
                </div>
              </div>

              {/* Actions */}
              <div style={{
                marginTop: 24, paddingTop: 20,
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex', gap: 10, justifyContent: 'flex-end',
              }}>
                <Button danger icon={<DeleteOutlined />} onClick={() => {
                  Modal.confirm({
                    title: '确认删除',
                    content: `删除「${selectedTask.title}」？`,
                    okText: '删除', okType: 'danger', cancelText: '取消',
                    centered: true,
                    onOk: async () => {
                      await deleteTask(selectedTask.id);
                      setSelectedTask(null);
                      refresh();
                    },
                  });
                }} style={{ borderRadius: 12 }}>
                  删除
                </Button>
                <Button type="primary" onClick={handleSaveEdit} style={{ borderRadius: 12 }}>
                  保存
                </Button>
              </div>
            </div>
          </Col>
        )}
      </Row>

      {/* Create Modal (new task only) */}
      <TaskFormModal
        open={modalOpen}
        task={null}
        categories={categories.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
}
