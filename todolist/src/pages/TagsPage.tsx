import { useEffect, useState } from 'react';
import { Typography, Button, Space, Spin, Modal, Form, Input, Drawer, Tag, Empty, message, Popconfirm, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, CloudOutlined, TagsOutlined, FileTextOutlined, ExperimentOutlined, UnorderedListOutlined, CalendarOutlined, PushpinOutlined } from '@ant-design/icons';
import { useTagStore } from '@/stores/tagStore';
import { tagService } from '@/services/tagService';
import { vaultService } from '@/services/vaultService';
import { paperService } from '@/services/paperService';
import { experimentService } from '@/services/experimentService';
import { taskService } from '@/services/taskService';
import type { Tag as TagType } from '@/types/tags';
import { listen } from '@tauri-apps/api/event';

const { Title, Text } = Typography;

const PRESET_COLORS = [
  '#2563EB', '#3B82F6', '#059669', '#f59e0b', '#DC2626',
  '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
  '#14b8a6', '#3B82F6', '#e11d48', '#0ea5e9', '#a855f7',
];

const ENTITY_TYPE_LABELS: Record<string, React.ReactNode> = {
  paper: <><FileTextOutlined /> 论文</>,
  experiment: <><ExperimentOutlined /> 实验</>,
  task: <><UnorderedListOutlined /> 任务</>,
  gantt_task: <><CalendarOutlined /> 时间线</>,
};

const ENTITY_TYPE_COLORS: Record<string, string> = {
  paper: '#2563EB',
  experiment: '#F76707',
  task: '#059669',
  gantt_task: '#7C3AED',
};

export default function TagsPage() {
  const { tags, loading, fetchTags, createTag, deleteTag } = useTagStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagType | null>(null);
  const [tagEntities, setTagEntities] = useState<[string, string][]>([]);
  const [entityNames, setEntityNames] = useState<Record<string, string>>({});
  const [entitiesLoading, setEntitiesLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTags();
    // Listen for vault tag sync events
    const unlisten = listen('vault-tags-changed', () => {
      fetchTags();
    });
    return () => { unlisten.then(fn => fn()); };
  }, []);

  const handleCreate = async () => {
    const values = await form.validateFields();
    await createTag({ name: values.name, color: values.color || PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)] });
    setModalOpen(false);
    form.resetFields();
    message.success('标签已创建');
  };

  const handleDelete = async (tag: TagType) => {
    await deleteTag(tag.id);
    message.success('标签已删除');
  };

  const handleOpenDetail = async (tag: TagType) => {
    setSelectedTag(tag);
    setEntitiesLoading(true);
    setTagEntities([]);
    setEntityNames({});
    try {
      const entities = await tagService.getEntitiesByTag(tag.id);
      setTagEntities(entities);
      // Resolve entity names
      const names: Record<string, string> = {};
      await Promise.all(entities.map(async ([entityType, entityId]) => {
        try {
          switch (entityType) {
            case 'paper': {
              const paper = await paperService.get(entityId);
              names[entityId] = paper.title;
              break;
            }
            case 'experiment': {
              const exp = await experimentService.get(entityId);
              names[entityId] = exp.title;
              break;
            }
            case 'task':
            case 'gantt_task': {
              const task = await taskService.getTask(entityId);
              names[entityId] = task.title;
              break;
            }
            default:
              names[entityId] = entityId;
          }
        } catch {
          names[entityId] = entityId;
        }
      }));
      setEntityNames(names);
    } catch {
      message.error('获取关联实体失败');
    }
    setEntitiesLoading(false);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexShrink: 0 }}>
        <Title level={3} style={{ margin: 0, fontSize: 22 }}><TagsOutlined style={{ marginRight: 8 }} />标签管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}
          style={{ borderRadius: 8, fontWeight: 600, background: 'linear-gradient(135deg, #f59e0b, #f97316)', border: 'none' }}>
          新建标签
        </Button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div> :
          tags.length === 0 ? <Empty description="暂无标签" style={{ marginTop: 60 }} /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {tags.map((tag) => (
                <div key={tag.id}
                  onClick={() => handleOpenDetail(tag)}
                  className="glass-card"
                  style={{
                    borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = tag.color; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                >
                  <Space>
                    <div style={{ width: 12, height: 12, borderRadius: 4, background: tag.color, flexShrink: 0 }} />
                    <Text strong style={{ fontSize: 14 }}>{tag.name}</Text>
                    {tag.source === 'obsidian' && (
                      <Tooltip title="来自 Obsidian Vault">
                        <CloudOutlined style={{ color: '#2563EB', fontSize: 11 }} />
                      </Tooltip>
                    )}
                  </Space>
                  <Popconfirm title="确定删除此标签？" onConfirm={(e) => { e?.stopPropagation(); handleDelete(tag); }}
                    onCancel={(e) => e?.stopPropagation()} okText="删除" cancelText="取消">
                    <Button size="small" type="text" danger icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()} />
                  </Popconfirm>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Create tag modal */}
      <Modal title="新建标签" open={modalOpen} onOk={handleCreate} onCancel={() => setModalOpen(false)}
        okText="创建" cancelText="取消" centered width={400}>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="name" label="标签名称" rules={[{ required: true, message: '请输入标签名称' }]}>
            <Input placeholder="如：Transformer" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="color" label="颜色" initialValue={PRESET_COLORS[0]}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((c) => (
                <div key={c}
                  onClick={() => form.setFieldValue('color', c)}
                  style={{
                    width: 28, height: 28, borderRadius: 6, background: c, cursor: 'pointer',
                    border: form.getFieldValue('color') === c ? '3px solid var(--text-primary)' : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Tag detail drawer */}
      <Drawer
        title={selectedTag ? (
          <Space>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: selectedTag.color }} />
            <Text strong style={{ fontSize: 16 }}>{selectedTag.name}</Text>
          </Space>
        ) : null}
        open={!!selectedTag}
        onClose={() => setSelectedTag(null)}
        width={420}
      >
        {selectedTag && (
          <>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
              创建于 {selectedTag.created_at?.slice(0, 10)}
            </Text>
            {entitiesLoading ? <Spin /> :
              tagEntities.length === 0 ? <Empty description="暂无关联实体" /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tagEntities.map(([entityType, entityId]) => (
                    <div key={`${entityType}:${entityId}`} style={{
                      padding: '8px 12px', borderRadius: 8, background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)', fontSize: 13,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <Tag color={ENTITY_TYPE_COLORS[entityType] || 'default'} style={{ margin: 0, borderRadius: 6 }}>
                        {ENTITY_TYPE_LABELS[entityType] || <><PushpinOutlined /> 其他</>}
                      </Tag>
                      <Text>{entityNames[entityId] || entityId.slice(0, 8) + '…'}</Text>
                    </div>
                  ))}
                </div>
              )}
          </>
        )}
      </Drawer>
    </div>
  );
}
