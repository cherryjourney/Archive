import { useState } from 'react';
import { Card, Button, List, Space, Typography, Modal, Tag, Tooltip } from 'antd';
import { PlusOutlined, StarOutlined, StarFilled, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { DailyPlan } from '@/types/plan';
import type { Task } from '@/types/task';
import PriorityBadge from '@/components/common/PriorityBadge';
import EmptyState from '@/components/common/EmptyState';
import TaskFormModal from '@/components/task/TaskFormModal';
import { useTaskStore } from '@/stores/taskStore';
import { usePlanStore } from '@/stores/planStore';

const { Text, Title } = Typography;

interface Props {
  plan: DailyPlan;
}

export default function MorningPanel({ plan }: Props) {
  const [taskPoolOpen, setTaskPoolOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { taskLibrary, fetchTaskLibrary, createTask } = useTaskStore();
  const { addTaskToPlan, removeTaskFromPlan } = usePlanStore();

  // 快速创建并加入今日计划
  const handleQuickCreate = async (params: any) => {
    const task = await createTask({
      ...params,
      scheduled_date: plan.date,
    });
    if (task) {
      await addTaskToPlan(task.id, false);
    }
  };

  return (
    <div>
      {/* MIT 关键目标区域 */}
      <Card
        size="small"
        style={{ marginBottom: 16, background: 'linear-gradient(135deg, #fff9db 0%, #fff3bf 100%)', border: '1px solid #ffd43b' }}
      >
        <Title level={5} style={{ marginTop: 0 }}>
          ⭐ 今日关键目标 (MIT)
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          选择 1-3 个最重要的任务，聚焦完成
        </Text>
        {plan.tasks.filter((pt) => pt.is_mit).length === 0 && (
          <div style={{ marginTop: 12 }}>
            <Text type="secondary">点击任务旁的 ☆ 设为今日关键目标</Text>
          </div>
        )}
        {plan.tasks
          .filter((pt) => pt.is_mit)
          .map((pt) => (
            <Card key={pt.task_id} size="small" style={{ marginTop: 8 }}>
              <Space>
                <StarFilled style={{ color: '#ffd43b' }} />
                <Text strong>{pt.task.title}</Text>
                <PriorityBadge priority={pt.task.priority} size="small" />
              </Space>
            </Card>
          ))}
      </Card>

      {/* 今日任务列表 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Title level={5} style={{ margin: 0 }}>
          📋 今日任务 ({plan.tasks.length})
        </Title>
        <Space>
          <Button size="small" onClick={() => { fetchTaskLibrary(); setTaskPoolOpen(true); }}>
            + 从任务库添加
          </Button>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            快速新建
          </Button>
        </Space>
      </div>

      {plan.tasks.length === 0 ? (
        <EmptyState description="还没有今日任务，开始规划吧！" />
      ) : (
        <List
          dataSource={plan.tasks}
          renderItem={(pt) => (
            <List.Item
              key={pt.task_id}
              actions={[
                <Tooltip title={pt.is_mit ? '取消关键目标' : '设为关键目标'} key="mit">
                  <Button
                    type="text"
                    size="small"
                    icon={pt.is_mit ? <StarFilled style={{ color: '#ffd43b' }} /> : <StarOutlined />}
                    onClick={() => addTaskToPlan(pt.task_id, !pt.is_mit)}
                  />
                </Tooltip>,
                <Button
                  key="remove"
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeTaskFromPlan(pt.task_id)}
                />,
              ]}
            >
              <List.Item.Meta
                avatar={<PriorityBadge priority={pt.task.priority} size="small" />}
                title={pt.task.title}
                description={
                  pt.task.estimated_minutes &&
                  `预估 ${pt.task.estimated_minutes} 分钟`
                }
              />
            </List.Item>
          )}
        />
      )}

      {/* 任务库抽屉 */}
      <Modal
        title="任务库 — 选择添加到今日"
        open={taskPoolOpen}
        onCancel={() => setTaskPoolOpen(false)}
        footer={null}
        width={560}
      >
        <List
          dataSource={taskLibrary.filter((t) => !plan.tasks.find((pt) => pt.task_id === t.id))}
          renderItem={(task) => (
            <List.Item
              key={task.id}
              actions={[
                <Button
                  key="add"
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    addTaskToPlan(task.id, false);
                  }}
                >
                  添加
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={task.title}
                description={
                  <Space>
                    <PriorityBadge priority={task.priority} size="small" />
                    {task.estimated_minutes && <Text type="secondary">{task.estimated_minutes}分钟</Text>}
                  </Space>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: '任务库为空，快去创建任务吧！' }}
          style={{ maxHeight: 400, overflow: 'auto' }}
        />
      </Modal>

      {/* 快速新建弹窗 */}
      <TaskFormModal
        open={createModalOpen}
        task={null}
        categories={[]}
        onOk={async (params) => { await handleQuickCreate(params); setCreateModalOpen(false); }}
        onCancel={() => setCreateModalOpen(false)}
      />
    </div>
  );
}
