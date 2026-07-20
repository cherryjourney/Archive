import { useEffect, useState } from 'react';
import { Typography, Button, Modal, Form, Input, DatePicker, Select, Switch, message, Empty, Skeleton } from 'antd';
import { PlusOutlined, DeleteOutlined, HourglassOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCountdownStore } from '@/stores/countdownStore';
import { PRESET_CATEGORIES, calcDaysRemaining, getCategoryInfo } from '@/utils/countdownPresets';
import type { CountdownEvent, CreateCountdownParams, UpdateCountdownParams } from '@/types/countdown';

const { Title, Text } = Typography;

const CATEGORY_OPTIONS = Object.entries(PRESET_CATEGORIES).map(([key, val]) => ({
  value: key,
  label: `${val.icon} ${val.label}`,
}));

const PRESET_COLORS = ['#DC2626','#EC4899','#F59E0B','#10B981','#2563EB','#7C3AED','#94A3B8'];

export default function CountdownPage() {
  const { events, loading, fetchAll, create, update, remove } = useCountdownStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CountdownEvent | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => { await fetchAll(); })();
  }, []);

  const openAdd = () => {
    setEditingEvent(null);
    form.resetFields();
    form.setFieldsValue({
      target_date: dayjs(),
      category: '其他',
      repeat_yearly: false,
      show_on_dashboard: true,
    });
    setModalOpen(true);
  };

  const openEdit = (event: CountdownEvent) => {
    setEditingEvent(event);
    form.setFieldsValue({
      title: event.title,
      target_date: dayjs(event.target_date),
      category: event.category,
      repeat_yearly: event.repeat_yearly,
      show_on_dashboard: event.show_on_dashboard,
      color: event.color,
      notes: event.notes,
    });
    setModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editingEvent) {
        const params: UpdateCountdownParams = {
          title: values.title,
          target_date: values.target_date.format('YYYY-MM-DD'),
          category: values.category,
          repeat_yearly: values.repeat_yearly,
          show_on_dashboard: values.show_on_dashboard,
          color: values.color || undefined,
          notes: values.notes || undefined,
        };
        await update(editingEvent.id, params);
        message.success('已更新');
      } else {
        const params: CreateCountdownParams = {
          title: values.title,
          target_date: values.target_date.format('YYYY-MM-DD'),
          category: values.category,
          repeat_yearly: values.repeat_yearly ?? false,
          show_on_dashboard: values.show_on_dashboard ?? true,
          color: values.color || undefined,
          notes: values.notes || undefined,
        };
        await create(params);
        message.success('倒数日已添加');
      }
      setModalOpen(false);
      setEditingEvent(null);
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error('操作失败: ' + String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (event: CountdownEvent) => {
    Modal.confirm({
      title: '删除倒数日',
      content: `确定删除「${event.title}」吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        await remove(event.id);
        message.success('已删除');
      },
    });
  };

  const handleToggleDashboard = async (event: CountdownEvent, checked: boolean) => {
    try {
      await update(event.id, { show_on_dashboard: checked });
    } catch (e) {
      message.error('更新失败: ' + String(e));
    }
  };

  // Sort: closest dates first
  const sortedEvents = [...events].sort((a, b) => {
    const da = Math.abs(calcDaysRemaining(a.target_date, a.repeat_yearly));
    const db = Math.abs(calcDaysRemaining(b.target_date, b.repeat_yearly));
    return da - db;
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 24, flexShrink: 0,
      }}>
        <Title level={3} style={{ fontSize: 28, margin: 0 }}>
          <HourglassOutlined style={{ marginRight: 10 }} />
          倒数日
        </Title>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openAdd}
          style={{ borderRadius: 12, fontWeight: 600, fontSize: 15 }}>
          添加倒数日
        </Button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} active paragraph={{ rows: 1 }} />
            ))}
          </div>
        ) : sortedEvents.length === 0 ? (
          <Empty
            description="还没有倒数日"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
              添加第一个倒数日
            </Button>
          </Empty>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sortedEvents.map((event) => {
              const days = calcDaysRemaining(event.target_date, event.repeat_yearly);
              const catInfo = getCategoryInfo(event.category, event.color);
              const isPast = days < 0;
              const isToday = days === 0;

              return (
                <div key={event.id}
                  className="glass-card paper-card"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 20,
                    padding: '18px 24px', borderRadius: 16,
                    cursor: 'pointer',
                  }}
                  onClick={() => openEdit(event)}
                >
                  {/* Left: info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {event.title}
                      </span>
                      <span style={{
                        fontSize: 13, fontWeight: 500,
                        padding: '2px 10px', borderRadius: 12,
                        background: `${catInfo.color}18`, color: catInfo.color,
                      }}>
                        {catInfo.icon} {catInfo.label}
                      </span>
                      {event.repeat_yearly && (
                        <span style={{
                          fontSize: 12, padding: '1px 8px', borderRadius: 8,
                          background: 'var(--color-fill, rgba(0,0,0,0.04))',
                          color: 'var(--text-muted)',
                        }}>
                          每年
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                      {event.target_date}
                      {event.repeat_yearly && ` · 每年${dayjs(event.target_date).format('MM-DD')}`}
                    </div>
                  </div>

                  {/* Right: days */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontSize: 36, fontWeight: 700, lineHeight: 1.1,
                      color: isToday ? '#2563EB'
                            : isPast ? 'var(--text-muted)'
                            : 'var(--text-primary)',
                    }}>
                      {isToday ? '今' : isPast ? `+${Math.abs(days)}` : days}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                      {isToday ? '今天' : isPast ? '天 已经' : '天 还剩'}
                    </div>
                  </div>

                  {/* Dashboard switch */}
                  <div style={{ flexShrink: 0, textAlign: 'center' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Switch
                      checked={event.show_on_dashboard}
                      onChange={(checked) => handleToggleDashboard(event, checked)}
                    />
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      首页
                    </div>
                  </div>

                  {/* Delete button */}
                  <Button
                    type="text" danger size="middle"
                    icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                    onClick={(e) => { e.stopPropagation(); handleDelete(event); }}
                    style={{ flexShrink: 0 }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        title={editingEvent ? '编辑倒数日' : '添加倒数日'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => { setModalOpen(false); setEditingEvent(null); }}
        okText={editingEvent ? '保存' : '添加'}
        cancelText="取消"
        confirmLoading={saving}
        centered
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="事件名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input size="large" placeholder="例如：生日、论文截稿..." style={{ borderRadius: 10 }} />
          </Form.Item>

          <Form.Item name="target_date" label="目标日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker size="large" style={{ width: '100%', borderRadius: 10 }} format="YYYY-MM-DD" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 20 }}>
            <Form.Item name="category" label="分类" style={{ flex: 1 }} initialValue="其他">
              <Select size="large" style={{ borderRadius: 10 }} options={CATEGORY_OPTIONS} />
            </Form.Item>

            <Form.Item name="repeat_yearly" label="每年重复" style={{ flex: 1 }} initialValue={false} valuePropName="checked">
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>
          </div>

          <Form.Item name="show_on_dashboard" label="在首页显示" initialValue={true} valuePropName="checked">
            <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
          </Form.Item>

          <Form.Item name="color" label="自定义颜色" initialValue={PRESET_COLORS[4]}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((c) => (
                <div key={c}
                  onClick={() => form.setFieldValue('color', c)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: form.getFieldValue('color') === c ? '3px solid var(--text-primary)' : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <Input.TextArea size="large" placeholder="备注（可选）" rows={3} style={{ borderRadius: 10 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
