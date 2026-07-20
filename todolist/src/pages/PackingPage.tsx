import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Input, DatePicker, Typography, Empty, Spin, Progress, message } from 'antd';
import { PlusOutlined, UnorderedListOutlined, DeleteOutlined, EditOutlined, BookOutlined } from '@ant-design/icons';
import { usePackingStore } from '@/stores/packingStore';
import type { PackingList } from '@/types/packing';
import dayjs from 'dayjs';

const { Text } = Typography;

// ── 统一表单 Modal ──────────────────────────────

interface PackingFormModalProps {
  open: boolean;
  editingList: PackingList | null;
  onCancel: () => void;
  onSave: () => void;
  formTitle: string; setFormTitle: (v: string) => void;
  formDest: string; setFormDest: (v: string) => void;
  formDep: string | null; setFormDep: (v: string | null) => void;
  formRet: string | null; setFormRet: (v: string | null) => void;
  formNotes: string; setFormNotes: (v: string) => void;
}

function PackingFormModal({
  open,
  editingList,
  onCancel,
  onSave,
  formTitle, setFormTitle,
  formDest, setFormDest,
  formDep, setFormDep,
  formRet, setFormRet,
  formNotes, setFormNotes,
}: PackingFormModalProps) {
  const isCreate = !editingList;
  return (
    <Modal
      title={isCreate ? '新建清单' : '编辑清单'}
      open={open}
      onOk={onSave}
      onCancel={onCancel}
      okText={isCreate ? '创建' : '保存'}
      cancelText="取消"
      okButtonProps={{ style: { background: '#10B981', borderColor: '#10B981' } }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>名称 *</label>
          <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="如：云南7日行李" />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>目的地</label>
          <Input value={formDest} onChange={e => setFormDest(e.target.value)} placeholder="可选，如：大理、丽江" />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>出发日期</label>
            <DatePicker
              value={formDep ? dayjs(formDep) : null}
              onChange={d => setFormDep(d ? d.format('YYYY-MM-DD') : null)}
              style={{ width: '100%' }}
              placeholder="可选"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>返回日期</label>
            <DatePicker
              value={formRet ? dayjs(formRet) : null}
              onChange={d => setFormRet(d ? d.format('YYYY-MM-DD') : null)}
              style={{ width: '100%' }}
              placeholder="可选"
            />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>备注</label>
          <Input.TextArea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2}
            placeholder="可选备注" />
        </div>
      </div>
    </Modal>
  );
}

// ── Page ────────────────────────────────────────

export default function PackingPage() {
  const navigate = useNavigate();
  const store = usePackingStore();
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<PackingList | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PackingList | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDest, setFormDest] = useState('');
  const [formDep, setFormDep] = useState<string | null>(null);
  const [formRet, setFormRet] = useState<string | null>(null);
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    store.fetchLists();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setFormTitle('');
    setFormDest('');
    setFormDep(null);
    setFormRet(null);
    setFormNotes('');
  };

  const openCreate = () => {
    setEditingList(null);
    resetForm();
    setFormModalOpen(true);
  };

  const openEdit = (list: PackingList) => {
    setEditingList(list);
    setFormTitle(list.title);
    setFormDest(list.destination);
    setFormDep(list.departure_date);
    setFormRet(list.return_date);
    setFormNotes(list.notes);
    setFormModalOpen(true);
  };

  const handleFormSave = async () => {
    if (!formTitle.trim()) return;
    try {
      if (editingList) {
        await store.updateList(editingList.id, {
          title: formTitle.trim(),
          destination: formDest.trim(),
          departure_date: formDep,
          return_date: formRet,
          notes: formNotes.trim(),
        });
        message.success('已更新');
      } else {
        await store.createList({
          title: formTitle.trim(),
          destination: formDest.trim(),
          departure_date: formDep,
          return_date: formRet,
          notes: formNotes.trim(),
        });
      }
      setFormModalOpen(false);
      setEditingList(null);
      resetForm();
    } catch {
      message.error(editingList ? '更新失败' : '创建失败');
    }
  };

  const handleFormCancel = () => {
    setFormModalOpen(false);
    setEditingList(null);
  };

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

  const lists = store.lists;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: 700 }}>
            <UnorderedListOutlined style={{ marginRight: 10, color: '#10B981' }} />
            出行清单
          </Text>
          <Text style={{ fontSize: 12, color: '#94A3B8' }}>
            {lists.length} 个清单
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<BookOutlined />} onClick={() => navigate('/packing/templates')}
            style={{ borderRadius: 8, borderColor: '#8B5CF6', color: '#8B5CF6' }}>
            模板库
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
            style={{ background: '#10B981', borderColor: '#10B981', borderRadius: 8 }}>
            新建清单
          </Button>
        </div>
      </div>

      {/* Content */}
      {store.loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </div>
      ) : lists.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <Empty
            description="暂无清单"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
              style={{ background: '#10B981', borderColor: '#10B981', borderRadius: 8 }}>
              创建第一个清单
            </Button>
          </Empty>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
          }}>
            {lists.map(list => (
              <div
                key={list.id}
                onClick={() => navigate(`/packing/${list.id}`)}
                style={{
                  background: 'var(--color-surface, #fff)',
                  border: '1px solid var(--color-border, #E2E8F0)',
                  borderRadius: 14,
                  padding: '18px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 140,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#A7F3D0';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.12)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border, #E2E8F0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {/* Title */}
                <Text strong style={{ fontSize: 15, marginBottom: 8, lineHeight: 1.4 }}
                  ellipsis={{ tooltip: list.title }}>
                  {list.title}
                </Text>

                {/* Destination */}
                {list.destination && (
                  <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}
                    ellipsis={{ tooltip: list.destination }}>
                    📍 {list.destination}
                  </Text>
                )}

                {/* Dates */}
                {(list.departure_date || list.return_date) && (
                  <Text style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>
                    {list.departure_date && `📅 ${list.departure_date}`}
                    {list.return_date && ` → ${list.return_date}`}
                  </Text>
                )}

                {/* Progress indicator */}
                {list.total_count != null && list.total_count > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <Progress
                      percent={Math.round(((list.checked_count ?? 0) / list.total_count) * 100)}
                      size="small"
                      strokeColor="#2563EB"
                      format={() => `${list.checked_count ?? 0}/${list.total_count} 件`}
                    />
                  </div>
                )}

                {/* Spacer */}
                <div style={{ flex: 1 }} />

                {/* Bottom actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginTop: 8, opacity: 0.6 }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; }}
                >
                  <Button size="small" type="text" icon={<EditOutlined />}
                    style={{ color: '#94A3B8', borderRadius: 6, fontSize: 12 }}
                    onClick={e => { e.stopPropagation(); openEdit(list); }} />
                  <Button size="small" type="text" icon={<DeleteOutlined />}
                    style={{ color: '#EF4444', borderRadius: 6, fontSize: 12 }}
                    onClick={e => { e.stopPropagation(); setDeleteTarget(list); }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── PackingFormModal ─── */}
      <PackingFormModal
        open={formModalOpen}
        editingList={editingList}
        onCancel={handleFormCancel}
        onSave={handleFormSave}
        formTitle={formTitle} setFormTitle={setFormTitle}
        formDest={formDest} setFormDest={setFormDest}
        formDep={formDep} setFormDep={setFormDep}
        formRet={formRet} setFormRet={setFormRet}
        formNotes={formNotes} setFormNotes={setFormNotes}
      />

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
        <Text>确定要删除清单「{deleteTarget?.title}」吗？清单中的所有物品也会被删除，此操作不可撤销。</Text>
      </Modal>
    </div>
  );
}
