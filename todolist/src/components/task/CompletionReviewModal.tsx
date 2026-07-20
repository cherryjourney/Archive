import { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Typography, Space, Tag } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import type { PlanTask } from '@/types/plan';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/types/task';

const { TextArea } = Input;
const { Text } = Typography;

interface Props {
  open: boolean;
  planTask: PlanTask | null;
  onComplete: (actualMinutes?: number, completionNote?: string) => Promise<void>;
  onSkip: () => Promise<void>;
  onCancel: () => void;
}

export default function CompletionReviewModal({ open, planTask, onComplete, onSkip, onCancel }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && planTask) {
      form.setFieldsValue({
        actual_minutes: planTask.task.estimated_minutes || undefined,
        completion_note: '',
      });
    }
  }, [open, planTask, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onComplete(values.actual_minutes || undefined, values.completion_note || undefined);
      form.resetFields();
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await onSkip();
    } finally {
      setLoading(false);
    }
  };

  if (!planTask) return null;

  const task = planTask.task;
  const startTime = planTask.start_time?.slice(0, 5) || '';
  const endTime = planTask.end_time?.slice(0, 5) || '';

  return (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined style={{ color: '#10b981' }} />
          <span>完成任务复盘</span>
        </Space>
      }
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onCancel(); }}
      confirmLoading={loading}
      okText="💾 保存复盘"
      cancelText="取消"
      width={480}
      destroyOnClose
      footer={(_, { OkBtn, CancelBtn }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <CancelBtn />
          <Space>
            <button
              onClick={handleSkip}
              disabled={loading}
              style={{
                border: '1px solid rgba(0,0,0,0.15)',
                background: 'transparent',
                color: '#6b658b',
                padding: '4px 16px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                height: 32,
              }}
            >
              ⏭️ 跳过
            </button>
            <OkBtn />
          </Space>
        </div>
      )}
    >
      {/* Task info banner */}
      <div style={{
        background: 'rgba(108,92,231,0.04)',
        borderRadius: 10,
        padding: '12px 14px',
        marginBottom: 18,
      }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: '#1e1b4b', marginBottom: 6 }}>
          {task.title}
        </div>
        <Space size={6} wrap>
          <Tag style={{
            background: `${PRIORITY_COLORS[task.priority]}15`,
            border: `1px solid ${PRIORITY_COLORS[task.priority]}30`,
            color: PRIORITY_COLORS[task.priority],
            borderRadius: 6,
            margin: 0,
          }}>
            {PRIORITY_LABELS[task.priority]}
          </Tag>
          {startTime && (
            <Text style={{ fontSize: 12, color: '#a49ebf' }}>
              ⏰ {startTime}{endTime ? ` — ${endTime}` : ''}
            </Text>
          )}
          {task.estimated_minutes && (
            <Text style={{ fontSize: 12, color: '#a49ebf' }}>
              📏 预估 {task.estimated_minutes} 分钟
            </Text>
          )}
        </Space>
      </div>

      <Form form={form} layout="vertical">
        <Form.Item name="actual_minutes" label="实际耗时（分钟）">
          <InputNumber
            placeholder="实际花费的时间"
            min={1}
            max={480}
            style={{ width: '100%', borderRadius: 10 }}
            size="large"
          />
        </Form.Item>

        <Form.Item name="completion_note" label="完成总结">
          <TextArea
            placeholder="简单总结一下完成情况、遇到的问题或收获..."
            rows={3}
            maxLength={1000}
            style={{ borderRadius: 10 }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
