import { useState, useEffect } from 'react';
import { Modal, Form, TimePicker, InputNumber, Switch, Typography, Space, Tag, Divider } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTagStore } from '@/stores/tagStore';
import BacklinkPanel from '@/components/vault/BacklinkPanel';
import type { PlanTask } from '@/types/plan';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/types/task';

const { Text } = Typography;

interface Props {
  open: boolean;
  planTask: PlanTask | null;
  onSave: (taskId: string, startTime: string, endTime: string, isMit: boolean) => Promise<void>;
  onCancel: () => void;
}

export default function PlanTaskEditModal({ open, planTask, onSave, onCancel }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(60);

  // Tag state for BacklinkPanel
  const { entityTags, fetchTagsForEntity } = useTagStore();
  const taskTags = (entityTags[planTask?.task_id || ''] || [])
    .filter((t: any) => t.source !== 'obsidian' || t.name)
    .map((t: any) => t.name);

  useEffect(() => {
    if (open && planTask) {
      const startTime = planTask.start_time?.slice(0, 5) || '09:00';
      const startH = parseInt(startTime.split(':')[0]);
      const startM = parseInt(startTime.split(':')[1]);
      const endTime = planTask.end_time?.slice(0, 5) || '';
      const endH = endTime ? parseInt(endTime.split(':')[0]) : startH + 1;
      const endM = endTime ? parseInt(endTime.split(':')[1]) : startM;
      const calculatedDuration = (endH * 60 + endM) - (startH * 60 + startM);

      form.setFieldsValue({
        start_time: dayjs(startTime, 'HH:mm'),
        is_mit: planTask.is_mit,
      });
      setDuration(calculatedDuration > 0 ? calculatedDuration : 60);

      // Fetch tags for BacklinkPanel
      fetchTagsForEntity('task', planTask.task_id);
    }
  }, [open, planTask, form, fetchTagsForEntity]);

  const handleOk = async () => {
    if (!planTask) return;
    try {
      const values = await form.validateFields();
      const startTime = values.start_time.format('HH:mm');
      const [h, m] = startTime.split(':').map(Number);
      const endTotal = Math.min(h * 60 + m + duration, 24 * 60);
      const endH = Math.floor(endTotal / 60);
      const endM = endTotal % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      setLoading(true);
      await onSave(planTask.task_id, startTime, endTime, values.is_mit);
      form.resetFields();
    } finally {
      setLoading(false);
    }
  };

  if (!planTask) return null;

  const task = planTask.task;

  return (
    <Modal
      title={
        <Space>
          <EditOutlined style={{ color: '#2563EB' }} />
          <span>修改计划</span>
        </Space>
      }
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onCancel(); }}
      confirmLoading={loading}
      okText="保存"
      cancelText="取消"
      width={480}
      destroyOnClose
    >
      {/* Task info banner */}
      <div style={{
        background: 'rgba(37,99,235,0.04)',
        borderRadius: 10,
        padding: '12px 14px',
        marginBottom: 18,
      }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>
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
          {planTask.start_time && (
            <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              ⏰ {planTask.start_time.slice(0, 5)}{planTask.end_time ? ` — ${planTask.end_time.slice(0, 5)}` : ''}
            </Text>
          )}
        </Space>
      </div>

      <Form form={form} layout="vertical">
        <Form.Item
          name="start_time"
          label="开始时间"
          rules={[{ required: true, message: '请选择开始时间' }]}
        >
          <TimePicker
            format="HH:mm"
            minuteStep={15}
            style={{ width: '100%', borderRadius: 10 }}
            size="large"
          />
        </Form.Item>

        <Form.Item label="持续时长">
          <InputNumber
            value={duration}
            onChange={(v) => v && setDuration(v)}
            min={15}
            max={480}
            step={15}
            style={{ width: '100%', borderRadius: 10 }}
            size="large"
            addonAfter="分钟"
          />
        </Form.Item>

        <Form.Item
          name="is_mit"
          label="今日要事 (MIT)"
          valuePropName="checked"
        >
          <Switch checkedChildren="⭐ MIT" unCheckedChildren="普通" />
        </Form.Item>
      </Form>

      <Divider style={{ margin: '8px 0 12px', borderColor: 'var(--border-subtle)' }} />

      {/* Obsidian BacklinkPanel */}
      <BacklinkPanel
        tags={taskTags}
        taskId={planTask.task_id}
      />
    </Modal>
  );
}
