import { useEffect, useState, useCallback, useMemo } from 'react';
import { Typography, Button, Space, Spin, Modal, Form, Input, Select, DatePicker, Tag, message } from 'antd';
import { PlusOutlined, LinkOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTaskStore } from '@/stores/taskStore';
import type { Task, TaskRelationship, CreateTaskRelationshipParams } from '@/types/task';
import { PRIORITY_LABELS } from '@/types/task';
import { randomTimelineColor } from '@/utils/constants';
import TimelineTable, { calcAutoProgress, calcAutoStatus } from '@/components/timeline/TimelineTable';
import TimelineChart, { type ZoomLevel, ZOOM_DAY_W } from '@/components/timeline/TimelineChart';
import EmptyState from '@/components/common/EmptyState';

const { Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

export default function TimelinePage() {
  const {
    tasks,
    relationships,
    loading,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    fetchRelationships,
    createRelationship,
    deleteRelationship,
  } = useTaskStore();

  // ── Local state ──
  const [zoom, setZoom] = useState<ZoomLevel>('week');
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [connectForm] = Form.useForm();
  const [bodyScrollRef, setBodyScrollRef] = useState<HTMLDivElement | null>(null);

  // ── Data fetching ──
  useEffect(() => {
    fetchTasks({ page_size: 3000 });
    fetchRelationships();
  }, []);

  // Timeline tasks = tasks with BOTH start_date AND end_date, sorted by start_date
  const timelineTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.start_date && t.end_date)
        .sort((a, b) => a.start_date!.localeCompare(b.start_date!)),
    [tasks],
  );

  // Split into active (non-completed/cancelled) and completed
  const activeTasks = useMemo(
    () => timelineTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled'),
    [timelineTasks],
  );
  const completedTasks = useMemo(
    () => timelineTasks.filter(t => t.status === 'completed' || t.status === 'cancelled'),
    [timelineTasks],
  );
  const [showCompleted, setShowCompleted] = useState(false);

  // Zoom label
  const zoomLabel = useMemo(() => {
    if (zoom === 'day') return '天';
    if (zoom === 'month') return '月';
    return '周';
  }, [zoom]);

  // Backfill colors for active timeline tasks without one
  useEffect(() => {
    if (loading) return;
    const needsColor = activeTasks.filter((t) => !t.color);
    if (needsColor.length === 0) return;
    needsColor.forEach((t) => {
      updateTask(t.id, { color: randomTimelineColor() });
    });
  }, [loading]);

  // ── Scroll-to-bar ──
  const handleScrollToBar = useCallback(
    (taskId: string) => {
      if (!bodyScrollRef) return;
      const bar = bodyScrollRef.querySelector(`[data-task-id="${taskId}"]`);
      if (bar) {
        const barLeft = (bar as HTMLElement).offsetLeft;
        bodyScrollRef.scrollTo({ left: Math.max(0, barLeft - 120), behavior: 'smooth' });
      }
    },
    [bodyScrollRef],
  );

  // ── Handlers ──
  const handleOpenAdd = () => {
    setEditingTask(null);
    form.resetFields();
    form.setFieldsValue({
      dateRange: [dayjs(), dayjs().add(7, 'day')],
      status: 'in_progress',
      priority: 2,
    });
    setModalOpen(true);
  };

  const handleClickTask = useCallback(
    (t: Task) => {
      setSelectedTaskId(t.id);
      setEditingTask(t);
      form.setFieldsValue({
        title: t.title,
        description: t.description,
        dateRange: [dayjs(t.start_date), dayjs(t.end_date)],
        status: t.status,
        priority: t.priority,
        color: t.color,
      });
      setModalOpen(true);
    },
    [form],
  );

  const handleTaskUpdate = useCallback(
    async (taskId: string, updates: { start_date?: string; end_date?: string }) => {
      try {
        await updateTask(taskId, updates);
      } catch (e) {
        message.error('更新失败: ' + String(e));
      }
    },
    [updateTask],
  );

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const params: any = {
        title: values.title,
        description: values.description || '',
        start_date: values.dateRange[0].format('YYYY-MM-DD'),
        end_date: values.dateRange[1].format('YYYY-MM-DD'),
        status: values.status,
        priority: values.priority ?? 2,
        color: values.color || randomTimelineColor(),
      };

      if (editingTask) {
        await updateTask(editingTask.id, params);
        message.success('任务已更新');
      } else {
        await createTask(params);
        message.success('时间线任务已创建');
      }
      setModalOpen(false);
      setSelectedTaskId(null);
      fetchTasks({ page_size: 3000 });
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error('操作失败: ' + String(e));
    }
  };

  const handleDeleteTask = () => {
    if (!editingTask) return;
    Modal.confirm({
      title: '删除任务',
      content: `确定删除「${editingTask.title}」吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        await deleteTask(editingTask.id);
        message.success('已删除');
        setModalOpen(false);
        setSelectedTaskId(null);
        fetchTasks({ page_size: 3000 });
      },
    });
  };

  const handleRelationClick = (rel: TaskRelationship) => {
    Modal.confirm({
      title: '任务连线',
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>
            类型: <strong>{rel.relationship_type === 'depends_on' ? '依赖关系' : '关联关系'}</strong>
          </p>
          <p style={{ marginBottom: 8 }}>
            强依赖: <strong>{rel.is_blocking ? '是 — 阻塞后续任务' : '否 — 仅视觉连线'}</strong>
          </p>
          {rel.label && <p style={{ marginBottom: 0 }}>标签: {rel.label}</p>}
        </div>
      ),
      okText: '删除连线',
      cancelText: '关闭',
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteRelationship(rel.id);
        fetchRelationships();
      },
    });
  };

  const handleOpenConnectModal = () => {
    if (activeTasks.length < 2) {
      message.warning('至少需要两个时间线任务才能创建连线');
      return;
    }
    connectForm.resetFields();
    setConnectModalOpen(true);
  };

  const handleConnectOk = async () => {
    try {
      const values = await connectForm.validateFields();
      await createRelationship({
        source_task_id: values.source_task_id,
        target_task_id: values.target_task_id,
        relationship_type: values.relationship_type || 'depends_on',
      });
      message.success('连线创建成功');
      setConnectModalOpen(false);
      fetchRelationships();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error('连线创建失败: ' + String(e));
    }
  };

  // ── Task options for connect modal ──
  const taskOptions = activeTasks.map((t) => ({
    value: t.id,
    label: t.title,
  }));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── Toolbar ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          flexShrink: 0,
        }}
      >
        <Title level={3} style={{ fontSize: 22, margin: 0 }}>
          <CalendarOutlined style={{ marginRight: 8 }} />
          时间线
        </Title>
        <Space size={10}>
          {/* Zoom controls */}
          <Tag style={{ borderRadius: 6, fontSize: 11 }}>{zoomLabel}</Tag>
          <Button
            size="small"
            type={zoom === 'day' ? 'primary' : 'default'}
            onClick={() => setZoom('day')}
            style={{ borderRadius: 6, fontSize: 12 }}
          >
            日
          </Button>
          <Button
            size="small"
            type={zoom === 'week' ? 'primary' : 'default'}
            onClick={() => setZoom('week')}
            style={{ borderRadius: 6, fontSize: 12 }}
          >
            周
          </Button>
          <Button
            size="small"
            type={zoom === 'month' ? 'primary' : 'default'}
            onClick={() => setZoom('month')}
            style={{ borderRadius: 6, fontSize: 12 }}
          >
            月
          </Button>

          <div style={{ width: 1, height: 20, background: 'var(--border-subtle, rgba(0,0,0,0.1))', margin: '0 4px' }} />

          <Button
            icon={<LinkOutlined />}
            onClick={handleOpenConnectModal}
            style={{ borderRadius: 8, borderColor: 'rgba(0,0,0,0.12)', color: 'var(--text-secondary)' }}
          >
            添加连线
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenAdd}
            style={{
              borderRadius: 8, fontWeight: 600,
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              border: 'none',
              boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
            }}
          >
            添加任务
          </Button>
        </Space>
      </div>

      {/* ── Dual panel ── */}
      <div style={{ flex: 1, display: 'flex', gap: 12, minHeight: 0 }}>
        {/* Left table */}
        <div
          style={{
            width: 280,
            flexShrink: 0,
            borderRadius: 10,
            border: '1px solid var(--border-subtle, rgba(0,0,0,0.07))',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <TimelineTable
            tasks={activeTasks}
            hoveredTaskId={hoveredTaskId}
            selectedTaskId={selectedTaskId}
            onHoverTask={setHoveredTaskId}
            onClickTask={handleClickTask}
            onScrollToBar={handleScrollToBar}
            completedCount={completedTasks.length}
            completedTasks={completedTasks}
            showCompleted={showCompleted}
            onToggleCompleted={() => setShowCompleted(!showCompleted)}
            onCompletedTaskClick={handleClickTask}
          />
        </div>

        {/* Right timeline */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            borderRadius: 10,
            border: '1px solid var(--border-subtle, rgba(0,0,0,0.07))',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: 80 }}>
              <Spin size="default" />
            </div>
          ) : activeTasks.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <EmptyState icon="📅" title="暂无时间线任务" description="添加任务到时间线开始规划" />
            </div>
          ) : (
            <TimelineChart
              tasks={activeTasks}
              relationships={relationships}
              zoom={zoom}
              hoveredTaskId={hoveredTaskId}
              selectedTaskId={selectedTaskId}
              onHoverTask={setHoveredTaskId}
              onClickTask={handleClickTask}
              onTaskUpdate={handleTaskUpdate}
              onRelationClick={handleRelationClick}
              onBarScrollRef={setBodyScrollRef}
            />
          )}
        </div>
      </div>

      {/* ── Task Create/Edit Modal ── */}
      <Modal
        title={editingTask ? '编辑任务' : '添加时间线任务'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => {
          setModalOpen(false);
          setEditingTask(null);
          setSelectedTaskId(null);
        }}
        okText={editingTask ? '保存' : '创建'}
        cancelText="取消"
        centered
        destroyOnClose
        width={520}
        footer={[
          editingTask ? (
            <Button key="delete" danger onClick={handleDeleteTask} style={{ marginRight: 'auto', borderRadius: 8 }}>
              删除
            </Button>
          ) : null,
          <Button
            key="cancel"
            onClick={() => {
              setModalOpen(false);
              setEditingTask(null);
              setSelectedTaskId(null);
            }}
            style={{ borderRadius: 8 }}
          >
            取消
          </Button>,
          <Button key="ok" type="primary" onClick={handleModalOk} style={{ borderRadius: 8 }}>
            {editingTask ? '保存' : '创建'}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="title" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}>
            <Input placeholder="输入任务名称" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="description" label="备注">
            <TextArea placeholder="备注（可选）" rows={2} style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item
            name="dateRange"
            label="开始日期 — 结束日期"
            rules={[{ required: true, message: '请选择日期范围' }]}
          >
            <RangePicker
              style={{ width: '100%', borderRadius: 8 }}
              placeholder={['开始日期', '结束日期']}
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="status" label="状态" style={{ flex: 1 }} initialValue="pending">
              <Select
                style={{ borderRadius: 8 }}
                options={[
                  { value: 'pending', label: '待开始' },
                  { value: 'in_progress', label: '进行中' },
                  { value: 'review', label: '审核中' },
                  { value: 'completed', label: '已完成' },
                  { value: 'cancelled', label: '已取消' },
                  { value: 'paused', label: '已暂停' },
                ]}
              />
            </Form.Item>
            <Form.Item name="priority" label="优先级" style={{ flex: 1 }} initialValue={2}>
              <Select
                style={{ borderRadius: 8 }}
                options={[
                  { value: 0, label: 'P0 紧急' },
                  { value: 1, label: 'P1 重要' },
                  { value: 2, label: 'P2 普通' },
                  { value: 3, label: 'P3 低优' },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item name="color" label="颜色（可选）">
            <Input type="color" style={{ width: 48, height: 32, borderRadius: 6, padding: 2 }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Connection Modal ── */}
      <Modal
        title={
          <>
            <LinkOutlined style={{ marginRight: 6 }} />
            添加任务连线
          </>
        }
        open={connectModalOpen}
        onOk={handleConnectOk}
        onCancel={() => setConnectModalOpen(false)}
        okText="创建连线"
        cancelText="取消"
        centered
      >
        <Form form={connectForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="source_task_id" label="前置任务" rules={[{ required: true }]}>
            <Select
              placeholder="选择前置任务"
              showSearch
              filterOption={(input: string, option: any) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={taskOptions}
            />
          </Form.Item>
          <Form.Item name="target_task_id" label="后续任务" rules={[{ required: true }]}>
            <Select
              placeholder="选择后续任务"
              showSearch
              filterOption={(input: string, option: any) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={taskOptions}
            />
          </Form.Item>
          <Form.Item name="relationship_type" label="关系类型" initialValue="depends_on">
            <Select
              options={[
                { value: 'depends_on', label: '依赖关系' },
                { value: 'related_to', label: '关联关系' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
