import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Modal, Input, InputNumber, Select, Typography, Empty, Spin, message } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, CheckOutlined, UndoOutlined } from '@ant-design/icons';
import { usePackingStore } from '@/stores/packingStore';
import PackingProgress from '@/components/packing/PackingProgress';
import PackingItemRow from '@/components/packing/PackingItemRow';
import { PACKING_CATEGORIES } from '@/types/packing';
import type { PackingItem } from '@/types/packing';

const { Text } = Typography;

export default function PackingDetailPage() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const store = usePackingStore();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PackingItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PackingItem | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCat, setFormCat] = useState('other');
  const [formQty, setFormQty] = useState(1);
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    if (listId) store.selectList(listId);
  }, [listId]); // eslint-disable-line react-hooks/exhaustive-deps

  const detail = store.detail;
  const list = detail?.list;
  const items = detail?.items ?? [];

  const packed = items.filter(i => i.is_packed).length;
  const total = items.length;

  const resetForm = () => {
    setFormName('');
    setFormCat('other');
    setFormQty(1);
    setFormNotes('');
  };

  // Add item
  const handleAdd = async () => {
    if (!formName.trim() || !listId) return;
    try {
      await store.addItem({
        list_id: listId,
        name: formName.trim(),
        category: formCat,
        quantity: formQty,
        notes: formNotes.trim(),
      });
      setAddModalOpen(false);
      resetForm();
    } catch {
      message.error('添加失败');
    }
  };

  // Edit item
  const openEdit = (item: PackingItem) => {
    setEditTarget(item);
    setFormName(item.name);
    setFormCat(item.category);
    setFormQty(item.quantity);
    setFormNotes(item.notes);
  };

  const handleEdit = async () => {
    if (!editTarget || !formName.trim()) return;
    try {
      await store.updateItem(editTarget.id, {
        name: formName.trim(),
        category: formCat,
        quantity: formQty,
        notes: formNotes.trim(),
      });
      setEditTarget(null);
      resetForm();
    } catch {
      message.error('更新失败');
    }
  };

  // Delete item
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await store.deleteItem(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      message.error('删除失败');
    }
  };

  // Toggle item
  const handleToggle = (item: PackingItem) => {
    store.toggleItem(item.id);
  };

  if (store.loading || !detail) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 1000, margin: '0 auto', padding: '20px 24px' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexShrink: 0 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/packing')}
          style={{ fontSize: 16, color: '#64748B', borderRadius: 8 }}
        />
        <div style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: 700, display: 'block' }}>{list?.title}</Text>
          <Text style={{ fontSize: 12, color: '#94A3B8' }}>
            {list?.destination ? `📍 ${list.destination}` : ''}
            {list?.departure_date ? ` · 出发: ${list.departure_date}` : ''}
            {list?.return_date ? ` · 返回: ${list.return_date}` : ''}
          </Text>
        </div>
      </div>

      {/* Progress bar — sticky */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--color-bg, #F8FAFC)',
        padding: '12px 0',
        borderBottom: '1px solid var(--color-border, #E2E8F0)',
        marginBottom: 12,
        flexShrink: 0,
      }}>
        <PackingProgress packed={packed} total={total} />
      </div>

      {/* Items grid — 4 columns, fill left-to-right */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {total === 0 ? (
          <Empty description="还没有物品，点击下方按钮添加" image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 60 }} />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            alignContent: 'start',
          }}>
            {items.map(item => (
              <PackingItemRow
                key={item.id}
                item={item}
                onToggle={() => handleToggle(item)}
                onEdit={() => openEdit(item)}
                onDelete={() => setDeleteTarget(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom actions — sticky */}
      <div style={{
        position: 'sticky', bottom: 0, zIndex: 10,
        background: 'var(--color-bg, #F8FAFC)',
        borderTop: '1px solid var(--color-border, #E2E8F0)',
        padding: '12px 0',
        display: 'flex', gap: 8, flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        <Button icon={<PlusOutlined />} onClick={() => { resetForm(); setAddModalOpen(true); }}
          style={{ borderRadius: 8, borderColor: '#10B981', color: '#10B981' }}>
          添加物品
        </Button>
        <Button icon={<CheckOutlined />} onClick={() => store.completeAll()} disabled={total === 0}
          style={{ borderRadius: 8 }}>
          全部完成
        </Button>
        <Button icon={<UndoOutlined />} onClick={() => store.resetAll()} disabled={total === 0}
          style={{ borderRadius: 8 }}>
          全部取消
        </Button>
      </div>

      {/* ─── Add Item Modal ─── */}
      <Modal
        title="添加物品"
        open={addModalOpen}
        onOk={handleAdd}
        onCancel={() => setAddModalOpen(false)}
        okText="添加"
        cancelText="取消"
        okButtonProps={{ style: { background: '#10B981', borderColor: '#10B981' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>名称 *</label>
            <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="如：手机、充电器"
              onPressEnter={handleAdd} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>分类</label>
              <Select value={formCat} onChange={setFormCat} style={{ width: '100%' }}>
                {PACKING_CATEGORIES.map(c => (
                  <Select.Option key={c.key} value={c.key}>{c.icon} {c.label}</Select.Option>
                ))}
              </Select>
            </div>
            <div style={{ width: 80 }}>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>数量</label>
              <InputNumber min={1} max={99} value={formQty} onChange={v => setFormQty(v ?? 1)}
                style={{ width: '100%' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>备注</label>
            <Input value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="可选"
              onPressEnter={handleAdd} />
          </div>
        </div>
      </Modal>

      {/* ─── Edit Item Modal ─── */}
      <Modal
        title="编辑物品"
        open={!!editTarget}
        onOk={handleEdit}
        onCancel={() => { setEditTarget(null); resetForm(); }}
        okText="保存"
        cancelText="取消"
        okButtonProps={{ style: { background: '#10B981', borderColor: '#10B981' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>名称 *</label>
            <Input value={formName} onChange={e => setFormName(e.target.value)}
              onPressEnter={handleEdit} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>分类</label>
              <Select value={formCat} onChange={setFormCat} style={{ width: '100%' }}>
                {PACKING_CATEGORIES.map(c => (
                  <Select.Option key={c.key} value={c.key}>{c.icon} {c.label}</Select.Option>
                ))}
              </Select>
            </div>
            <div style={{ width: 80 }}>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>数量</label>
              <InputNumber min={1} max={99} value={formQty} onChange={v => setFormQty(v ?? 1)}
                style={{ width: '100%' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>备注</label>
            <Input value={formNotes} onChange={e => setFormNotes(e.target.value)}
              onPressEnter={handleEdit} />
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
        <Text>确定要删除「{deleteTarget?.name}」吗？</Text>
      </Modal>
    </div>
  );
}
