import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Input, Typography, Empty, Spin, message } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { usePackingStore } from '@/stores/packingStore';
import type { PackingList } from '@/types/packing';

const { Text } = Typography;

export default function TemplatesPage() {
  const navigate = useNavigate();
  const store = usePackingStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PackingList | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PackingList | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    store.fetchTemplates();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => { setFormTitle(''); setFormNotes(''); };

  // Create custom template
  const handleCreate = async () => {
    if (!formTitle.trim()) return;
    setSaving(true);
    try {
      await store.createList({
        title: formTitle.trim(),
        notes: formNotes.trim(),
        is_template: true,
      });
      setCreateOpen(false);
      resetForm();
      await store.fetchTemplates();
      message.success('模板已创建');
    } catch {
      message.error('创建失败');
    } finally {
      setSaving(false);
    }
  };

  // Edit template
  const openEdit = (tpl: PackingList) => {
    setEditTarget(tpl);
    setFormTitle(tpl.title);
    setFormNotes(tpl.notes);
  };
  const handleEdit = async () => {
    if (!editTarget || !formTitle.trim()) return;
    try {
      await store.updateList(editTarget.id, { title: formTitle.trim(), notes: formNotes.trim() });
      setEditTarget(null);
      resetForm();
      message.success('已更新');
    } catch {
      message.error('更新失败');
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await store.deleteList(deleteTarget.id);
      setDeleteTarget(null);
      message.success('已删除');
    } catch {
      message.error('删除失败');
    }
  };

  // Use template → create copy
  const handleUseTemplate = async (tpl: PackingList) => {
    try {
      await store.duplicateFromTemplate(tpl.id, `${tpl.title}（副本）`);
      message.success('已从模板创建新清单');
      navigate('/packing');
    } catch {
      message.error('创建失败');
    }
  };

  // Edit template items → navigate to detail
  const handleEditItems = (tpl: PackingList) => {
    navigate(`/packing/${tpl.id}`);
  };

  const templates = store.templates;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 24, maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/packing')}
            style={{ fontSize: 16, color: '#64748B' }} />
          <Text style={{ fontSize: 22, fontWeight: 700 }}>📋 模板库</Text>
          <Text style={{ fontSize: 12, color: '#94A3B8' }}>
            {templates.length} 个模板
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { resetForm(); setCreateOpen(true); }}
          style={{ background: '#8B5CF6', borderColor: '#8B5CF6', borderRadius: 8 }}>
          创建模板
        </Button>
      </div>

      {/* Content */}
      {store.loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </div>
      ) : templates.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty description="暂无模板，点击上方按钮创建" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {templates.map(tpl => (
            <div
              key={tpl.id}
              style={{
                display: 'flex', alignItems: 'center',
                background: 'var(--color-surface, #fff)',
                border: '1px solid var(--color-border, #E2E8F0)',
                borderRadius: 14,
                padding: '16px 20px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#C4B5FD';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(139,92,246,0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-border, #E2E8F0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text strong style={{ fontSize: 15 }}>{tpl.title}</Text>
                  <span style={{ fontSize: 10, color: '#8B5CF6', background: '#F5F3FF', padding: '1px 6px', borderRadius: 4 }}>
                    模板
                  </span>
                </div>
                {tpl.notes && (
                  <Text style={{ fontSize: 12, color: '#94A3B8' }}>{tpl.notes}</Text>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Button size="small" type="primary" icon={<CopyOutlined />}
                  style={{ background: '#10B981', borderColor: '#10B981', borderRadius: 6 }}
                  onClick={() => handleUseTemplate(tpl)}>
                  使用
                </Button>
                <Button size="small" icon={<EditOutlined />}
                  style={{ borderRadius: 6 }}
                  onClick={() => handleEditItems(tpl)}>
                  编辑物品
                </Button>
                <Button size="small" type="text" icon={<EditOutlined />}
                  style={{ color: '#94A3B8', borderRadius: 6 }}
                  onClick={() => openEdit(tpl)} />
                <Button size="small" type="text" icon={<DeleteOutlined />}
                  style={{ color: '#EF4444', borderRadius: 6 }}
                  onClick={() => setDeleteTarget(tpl)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Create Template Modal ─── */}
      <Modal
        title="创建模板"
        open={createOpen}
        onOk={handleCreate}
        onCancel={() => setCreateOpen(false)}
        okText="创建"
        cancelText="取消"
        confirmLoading={saving}
        okButtonProps={{ style: { background: '#8B5CF6', borderColor: '#8B5CF6' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>模板名称 *</label>
            <Input value={formTitle} onChange={e => setFormTitle(e.target.value)}
              placeholder="如：海岛度假" onPressEnter={handleCreate} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>备注</label>
            <Input.TextArea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2}
              placeholder="描述模板包含的内容" />
          </div>
        </div>
      </Modal>

      {/* ─── Edit Modal ─── */}
      <Modal
        title="编辑模板"
        open={!!editTarget}
        onOk={handleEdit}
        onCancel={() => { setEditTarget(null); resetForm(); }}
        okText="保存"
        cancelText="取消"
        okButtonProps={{ style: { background: '#8B5CF6', borderColor: '#8B5CF6' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>模板名称 *</label>
            <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} onPressEnter={handleEdit} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>备注</label>
            <Input.TextArea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} />
          </div>
        </div>
      </Modal>

      {/* ─── Delete Confirm ─── */}
      <Modal
        title="确认删除"
        open={!!deleteTarget}
        onOk={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Text>确定要删除模板「{deleteTarget?.title}」吗？此操作不可撤销。</Text>
      </Modal>
    </div>
  );
}
