import { useState } from 'react';
import { Card, Button, Checkbox, List, Space, Typography, Modal, DatePicker, Input, Tag, Progress } from 'antd';
import { ClockCircleOutlined, ForwardOutlined, PauseCircleOutlined, CaretRightOutlined } from '@ant-design/icons';
import type { DailyPlan } from '@/types/plan';
import type { TaskStatus } from '@/types/task';
import PriorityBadge from '@/components/common/PriorityBadge';
import EmptyState from '@/components/common/EmptyState';
import { usePlanStore } from '@/stores/planStore';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface Props {
  plan: DailyPlan;
}

export default function AfternoonPanel({ plan }: Props) {
  const { completeTask, postponeTask } = usePlanStore();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [postponeModal, setPostponeModal] = useState<{ taskId: string; title: string } | null>(null);
  const [postponeDate, setPostponeDate] = useState<string>(dayjs().add(1, 'day').format('YYYY-MM-DD'));

  const pendingTasks = plan.tasks.filter((pt) => pt.task.status !== 'completed');
  const completedTasks = plan.tasks.filter((pt) => pt.task.status === 'completed');
  const completionPercent =
    plan.tasks.length > 0 ? Math.round((completedTasks.length / plan.tasks.length) * 100) : 0;

  return (
    <div>
      {/* 进度概览 */}
      <Card size="small" style={{ marginBottom: 16, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Title level={5} style={{ margin: 0 }}>
              📊 执行进度
            </Title>
            <Text type="secondary">
              {completedTasks.length}/{plan.tasks.length} 已完成
              {activeTaskId && (
                <Tag color="processing" style={{ marginLeft: 8 }}>
                  进行中
                </Tag>
              )}
            </Text>
          </div>
          <Progress
            type="circle"
            percent={completionPercent}
            size={60}
            strokeColor="#69db7c"
          />
        </Space>
      </Card>

      {/* 任务执行列表 */}
      <Title level={5}>📋 待执行 ({pendingTasks.length})</Title>

      {pendingTasks.length === 0 && completedTasks.length === 0 ? (
        <EmptyState description="上午还没有规划任务，切换回上午面板添加！" />
      ) : pendingTasks.length === 0 ? (
        <EmptyState description="🎉 全部完成！太棒了！" />
      ) : (
        <List
          dataSource={pendingTasks}
          renderItem={(pt) => {
            const isActive = activeTaskId === pt.task_id;
            const isCompleted = pt.task.status === 'completed';

            return (
              <Card
                key={pt.task_id}
                size="small"
                style={{
                  marginBottom: 8,
                  borderLeft: isActive ? '3px solid #4c6ef5' : undefined,
                  opacity: isCompleted ? 0.6 : 1,
                  background: isCompleted ? '#f6ffed' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Space>
                    <Checkbox
                      checked={isCompleted}
                      onChange={() => {
                        if (!isCompleted) {
                          completeTask(pt.task_id);
                          if (isActive) setActiveTaskId(null);
                        }
                      }}
                    />
                    <span className={isCompleted ? 'task-completed' : ''} style={{ fontWeight: isActive ? 600 : 400 }}>
                      {pt.task.title}
                    </span>
                    <PriorityBadge priority={pt.task.priority} size="small" />
                    {pt.task.estimated_minutes && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <ClockCircleOutlined /> {pt.task.estimated_minutes}分钟
                      </Text>
                    )}
                  </Space>

                  <Space>
                    {!isCompleted && (
                      <>
                        {isActive ? (
                          <Button
                            size="small"
                            icon={<PauseCircleOutlined />}
                            onClick={() => setActiveTaskId(null)}
                          >
                            暂停
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            type="primary"
                            ghost
                            icon={<CaretRightOutlined />}
                            onClick={() => setActiveTaskId(pt.task_id)}
                          >
                            开始
                          </Button>
                        )}
                        <Button
                          size="small"
                          icon={<ForwardOutlined />}
                          onClick={() => setPostponeModal({ taskId: pt.task_id, title: pt.task.title })}
                        >
                          顺延
                        </Button>
                      </>
                    )}
                  </Space>
                </div>
              </Card>
            );
          }}
        />
      )}

      {/* 已完成 */}
      {completedTasks.length > 0 && (
        <>
          <Title level={5} style={{ marginTop: 16 }}>
            ✅ 已完成 ({completedTasks.length})
          </Title>
          {completedTasks.map((pt) => (
            <Card key={pt.task_id} size="small" style={{ marginBottom: 4, opacity: 0.7, background: '#fafafa' }}>
              <Space>
                <Checkbox checked disabled />
                <span className="task-completed">{pt.task.title}</span>
              </Space>
            </Card>
          ))}
        </>
      )}

      {/* 顺延弹窗 */}
      <Modal
        title="顺延任务"
        open={!!postponeModal}
        onOk={() => {
          if (postponeModal) {
            postponeTask(postponeModal.taskId, postponeDate);
            setPostponeModal(null);
          }
        }}
        onCancel={() => setPostponeModal(null)}
        okText="确认顺延"
        cancelText="取消"
      >
        <p>
          将「{postponeModal?.title}」顺延到：
        </p>
        <DatePicker
          value={dayjs(postponeDate)}
          onChange={(d) => d && setPostponeDate(d.format('YYYY-MM-DD'))}
          style={{ width: '100%' }}
        />
      </Modal>
    </div>
  );
}
