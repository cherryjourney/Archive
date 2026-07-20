import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Modal, Form, Input, Select, InputNumber, DatePicker, TimePicker, Typography, Segmented, Switch, Button } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import type { Task, CreateTaskParams, UpdateTaskParams } from '@/types/task';
import { parseNaturalLanguage } from '@/utils/nlp';
import BacklinkPanel from '@/components/vault/BacklinkPanel';

const { TextArea } = Input;
const { Text } = Typography;

export interface TaskFormParams extends CreateTaskParams {
  start_time?: string;       // HH:mm
  duration_minutes?: number;  // estimated duration → end_time = start + duration
}

interface Props {
  open: boolean;
  task?: Task | null;
  categories: { id: string; name: string; color: string }[];
  /** Pre-fill scheduled_date (used when creating from calendar/plan page) */
  initialDate?: string;
  /** Pre-fill start_time from PlanTask (used when editing a planned task) */
  initialStartTime?: string;
  /** Pre-fill duration from PlanTask end-start or task.estimated_minutes */
  initialDuration?: number;
  onOk: (params: TaskFormParams, taskId?: string) => Promise<void>;
  onCancel: () => void;
}

const PRIORITY_OPTIONS = [
  { label: '🔴 P0 紧急', value: 0 },
  { label: '🟠 P1 重要', value: 1 },
  { label: '🔵 P2 普通', value: 2 },
  { label: '⚪ P3 低优', value: 3 },
];

/** CSS for transient field highlight animation after NLP parse */
const HIGHLIGHT_STYLE: React.CSSProperties = {
  borderColor: '#2563EB',
  boxShadow: '0 0 0 2px rgba(37,99,235,0.12)',
  transition: 'border-color 0.35s ease, box-shadow 0.35s ease',
};

export default function TaskFormModal({
  open, task, categories,
  initialDate, initialStartTime, initialDuration,
  onOk, onCancel,
}: Props) {
  const [form] = Form.useForm();
  const isEdit = !!task;
  const [loading, setLoading] = useState(false);
  const [smartInput, setSmartInput] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [parsedFields, setParsedFields] = useState<Set<string>>(new Set());
  const watchedTags: string[] = Form.useWatch('tags', form) || [];

  // ── Lifecycle ──
  useEffect(() => {
    if (open) {
      if (task) {
        form.setFieldsValue({
          title: task.title,
          description: task.description,
          priority: task.priority,
          estimated_minutes: initialDuration ?? task.estimated_minutes,
          scheduled_date: task.scheduled_date ? dayjs(task.scheduled_date) : (initialDate ? dayjs(initialDate) : null),
          start_time: initialStartTime ? dayjs(initialStartTime, 'HH:mm') : null,
          category_id: null,
          tags: [],
        });
        setIsRecurring(task.is_recurring);
      } else {
        form.resetFields();
        form.setFieldsValue({
          priority: 2,
          scheduled_date: initialDate ? dayjs(initialDate) : null,
          start_time: initialStartTime ? dayjs(initialStartTime, 'HH:mm') : null,
          estimated_minutes: initialDuration ?? null,
        });
        setIsRecurring(false);
      }
      setSmartInput('');
      setParsedFields(new Set());
    }
  }, [open, task, initialDate, initialStartTime, initialDuration, form]);

  // Clear highlight after a delay
  useEffect(() => {
    if (parsedFields.size === 0) return;
    const timer = setTimeout(() => setParsedFields(new Set()), 2200);
    return () => clearTimeout(timer);
  }, [parsedFields]);

  // ── NLP smart parse ──
  const handleSmartParse = () => {
    if (!smartInput.trim()) return;
    const parsed = parseNaturalLanguage(smartInput);

    const fields: Record<string, unknown> = {
      title: parsed.title,
      priority: parsed.priority,
    };
    const filled = new Set<string>(['title', 'priority']);

    if (parsed.date) {
      fields.scheduled_date = dayjs(parsed.date);
      filled.add('scheduled_date');
    }
    if (parsed.time) {
      fields.start_time = dayjs(parsed.time, 'HH:mm');
      filled.add('start_time');
    }
    if (parsed.isRecurring) {
      setIsRecurring(true);
      filled.add('recurring');
    }

    form.setFieldsValue(fields);
    setParsedFields(filled);
    setSmartInput('');
  };

  // ── Submit ──
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const startTime = values.start_time ? values.start_time.format('HH:mm') : undefined;

      const params: TaskFormParams = {
        title: values.title,
        description: values.description || '',
        priority: values.priority ?? 2,
        estimated_minutes: values.estimated_minutes || null,
        scheduled_date: values.scheduled_date ? values.scheduled_date.format('YYYY-MM-DD') : null,
        category_id: values.category_id || null,
        start_time: startTime,
        duration_minutes: values.estimated_minutes || undefined,
      };

      await onOk(params, task?.id);
      form.resetFields();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setParsedFields(new Set());
    onCancel();
  };

  // ── Derived state ──
  const isFieldHighlighted = (name: string) => parsedFields.has(name);

  const inputStyle = (name: string): React.CSSProperties => ({
    borderRadius: 10,
    ...(isFieldHighlighted(name) ? HIGHLIGHT_STYLE : {}),
  });

  // ── Render ──
  return (
    <Modal
      title={
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: '-0.3px',
        }}>
          {isEdit ? '编辑任务' : '新建任务'}
        </span>
      }
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText={isEdit ? '保存' : '创建任务'}
      cancelText="取消"
      width={620}
      destroyOnClose
      styles={{
        body: { padding: '8px 24px 24px' },
        header: { padding: '24px 24px 12px' },
        footer: { padding: '12px 24px 24px' },
      }}
    >
      <Form form={form} layout="vertical" size="middle">
        {/* ═══════════════════════════════════════
            Smart Input — Hero (create mode only)
            ═══════════════════════════════════════ */}
        {!isEdit && (
          <div
            style={{
              background: 'var(--bg-glass-strong)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--border-default)',
              borderRadius: 16,
              padding: 18,
              marginBottom: 8,
              transition: 'border-color 0.25s var(--ease-out), box-shadow 0.25s var(--ease-out)',
            }}
            className="smart-input-shell"
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {/* Icon */}
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(37,99,235,0.10)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 0,
              }}>
                <ThunderboltOutlined style={{ color: '#2563EB', fontSize: 20 }} />
              </div>

              {/* Input + actions */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <TextArea
                  placeholder="用自然语言描述，自动提取日期、时间、优先级…"
                  value={smartInput}
                  onChange={(e) => setSmartInput(e.target.value)}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSmartParse();
                    }
                  }}
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    boxShadow: 'none',
                    fontSize: 15,
                    lineHeight: 1.55,
                    resize: 'none',
                    padding: '2px 0',
                  }}
                />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 12,
                  gap: 12,
                }}>
                  <Text style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, flex: 1 }}>
                    试试：明天下午3点读论文 P1 每天 · 下周一上午开会 P0
                  </Text>
                  <Button
                    type="primary"
                    size="small"
                    icon={<ThunderboltOutlined />}
                    onClick={handleSmartParse}
                    disabled={!smartInput.trim()}
                    style={{ borderRadius: 10, fontWeight: 500, flexShrink: 0 }}
                  >
                    智能解析
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            Form Fields
            ═══════════════════════════════════════ */}
        <div
          style={{
            background: isEdit ? 'transparent' : 'var(--bg-glass)',
            backdropFilter: isEdit ? undefined : 'blur(14px)',
            border: isEdit ? 'none' : '1px solid var(--border-subtle)',
            borderRadius: 16,
            padding: isEdit ? 0 : '20px 20px 6px',
            marginBottom: 8,
          }}
        >
          {/* ── Title ── */}
          <Form.Item
            name="title"
            label={<FieldLabel>标题</FieldLabel>}
            rules={[{ required: true, message: '请输入任务标题' }]}
            style={{ marginBottom: 14 }}
          >
            <Input
              placeholder="任务标题"
              maxLength={200}
              style={inputStyle('title')}
            />
          </Form.Item>

          {/* ── Description ── */}
          <Form.Item
            name="description"
            label={<FieldLabel>备注</FieldLabel>}
            style={{ marginBottom: 14 }}
          >
            <TextArea
              placeholder="详细描述…"
              rows={2}
              maxLength={2000}
              style={{ borderRadius: 10 }}
            />
          </Form.Item>

          {/* ── Date · Time · Duration ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
          }}>
            <Form.Item
              name="scheduled_date"
              label={<FieldLabel>日期</FieldLabel>}
              style={{ marginBottom: 14 }}
            >
              <DatePicker
                style={{ width: '100%', borderRadius: 10, ...(isFieldHighlighted('scheduled_date') ? HIGHLIGHT_STYLE : {}) }}
                placeholder="选择日期"
              />
            </Form.Item>

            <Form.Item
              name="start_time"
              label={<FieldLabel>时间</FieldLabel>}
              style={{ marginBottom: 14 }}
            >
              <TimePicker
                format="HH:mm"
                minuteStep={15}
                style={{ width: '100%', borderRadius: 10, ...(isFieldHighlighted('start_time') ? HIGHLIGHT_STYLE : {}) }}
                placeholder="选择时间"
              />
            </Form.Item>

            <Form.Item
              name="estimated_minutes"
              label={<FieldLabel>预估耗时</FieldLabel>}
              style={{ marginBottom: 14 }}
            >
              <InputNumber
                placeholder="分钟"
                min={15}
                max={480}
                step={15}
                style={{ width: '100%', borderRadius: 10 }}
                addonAfter="分钟"
              />
            </Form.Item>
          </div>

          {/* ── Priority ── */}
          <Form.Item
            name="priority"
            label={<FieldLabel>优先级</FieldLabel>}
            initialValue={2}
            style={{ marginBottom: 14 }}
          >
            <Segmented
              options={PRIORITY_OPTIONS}
              block
              style={{
                padding: 4,
                background: 'var(--bg-glass)',
                borderRadius: 12,
                ...(isFieldHighlighted('priority') ? {
                  outline: '2px solid rgba(37,99,235,0.20)',
                  outlineOffset: 1,
                } : {}),
              }}
            />
          </Form.Item>

          {/* ── Category · Tags ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '150px 1fr',
            gap: 12,
          }}>
            <Form.Item
              name="category_id"
              label={<FieldLabel>分类</FieldLabel>}
              style={{ marginBottom: 14 }}
            >
              <Select
                placeholder="选择分类"
                allowClear
                style={{ borderRadius: 10 }}
                options={categories.map((c) => ({ label: c.name, value: c.id }))}
              />
            </Form.Item>

            <Form.Item
              name="tags"
              label={<FieldLabel>标签</FieldLabel>}
              style={{ marginBottom: 14 }}
            >
              <Select
                mode="tags"
                placeholder="输入标签，回车添加"
                style={{ borderRadius: 10 }}
                tokenSeparators={[',', '，']}
              />
            </Form.Item>
          </div>

          {/* ── Recurring Toggle ── */}
          {!isEdit && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: isRecurring
                  ? 'rgba(37,99,235,0.05)'
                  : 'var(--bg-glass)',
                borderRadius: 12,
                border: isRecurring
                  ? '1px solid rgba(37,99,235,0.14)'
                  : '1px solid var(--border-subtle)',
                transition: 'all 0.2s var(--ease-out)',
                marginBottom: 14,
                ...(isFieldHighlighted('recurring') ? HIGHLIGHT_STYLE : {}),
              }}
            >
              <div>
                <Text style={{ fontWeight: 500, fontSize: 13 }}>🔁 重复任务</Text>
                <br />
                <Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  设置后每次完成自动生成下一个
                </Text>
              </div>
              <Switch checked={isRecurring} onChange={setIsRecurring} size="small" />
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════
            Obsidian Backlinks
            ═══════════════════════════════════════ */}
        <div
          style={{
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(14px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 16,
            padding: '14px 18px',
          }}
        >
          <Text
            style={{
              fontWeight: 600,
              fontSize: 11,
              color: 'var(--text-muted)',
              display: 'block',
              marginBottom: 8,
              letterSpacing: '0.04em',
            }}
          >
            📓 Obsidian 关联笔记
          </Text>
          <BacklinkPanel tags={watchedTags} />
        </div>
      </Form>

      {/* ── Injected styles for focus/highlight ── */}
      <style>{`
        .smart-input-shell:focus-within {
          border-color: rgba(37,99,235,0.25) !important;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.08) !important;
        }
        .smart-input-shell textarea::placeholder {
          color: var(--text-placeholder) !important;
          opacity: 0.7;
        }
        .smart-input-shell textarea:focus {
          outline: none;
        }
        /* Round the InputNumber addon */
        .ant-input-number-group-wrapper {
          border-radius: 10px !important;
        }
        .ant-input-number-group-wrapper .ant-input-number {
          border-radius: 10px 0 0 10px !important;
        }
        .ant-input-number-group-wrapper .ant-input-number-group-addon {
          border-radius: 0 10px 10px 0 !important;
        }
      `}</style>
    </Modal>
  );
}

/** Reusable field label component */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-secondary)' }}>
      {children}
    </span>
  );
}
