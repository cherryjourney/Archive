import { useEffect, useState, useMemo } from 'react';
import { Typography, Button, message, Spin, Modal, Select, Input } from 'antd';
import { PlusOutlined, SearchOutlined, EnvironmentOutlined, GiftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useLifeEventStore } from '@/stores/lifeEventStore';
import { useTaskStore } from '@/stores/taskStore';
import VerticalTimeline from '@/components/life-event/VerticalTimeline';
import EventDetailModal from '@/components/life-event/EventDetailModal';
import EventFormModal from '@/components/life-event/EventFormModal';
import BirthDateSetupModal from '@/components/life-event/BirthDateSetupModal';
import { LIFE_EVENT_CATEGORIES } from '@/utils/lifeEventPresets';
import type { CreateLifeEventParams, UpdateLifeEventParams, CreateLifeEventLinkParams } from '@/types/lifeEvent';

const { Title } = Typography;

export default function LifeEventsPage() {
  const {
    events, selectedId, selectedLinks, selectedStats, loading, birthDate, birthDateLoaded,
    fetchAll, fetchBirthDate, setBirthDate,
    select, create, update, remove, addLink, removeLink,
    displayEvents, selectedDisplay,
  } = useLifeEventStore();

  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  // Search & filter
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);

  // Link modal
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkEntityType, setLinkEntityType] = useState('task');
  const [linkEntityId, setLinkEntityId] = useState('');
  const [linkLabel, setLinkLabel] = useState('');

  // Task store for link entity selector
  const { tasks: allTasks, fetchTasks: fetchAllTasks } = useTaskStore();

  useEffect(() => { fetchAll(); fetchBirthDate(); }, []);
  useEffect(() => { fetchAllTasks({ page: 1, page_size: 500 }); }, []);

  const rawDisplayData = displayEvents();
  const displayData = useMemo(() => {
    let filtered = rawDisplayData;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(e => e.title.toLowerCase().includes(q));
    }
    if (categoryFilter) {
      filtered = filtered.filter(e => e.category === categoryFilter);
    }
    return filtered;
  }, [rawDisplayData, search, categoryFilter]);
  const selectedData = selectedDisplay();

  // Birth date setup
  const handleBirthDateSave = async (date: string) => {
    await setBirthDate(date);
  };

  // Open event detail
  const handleSelect = async (id: string) => {
    await select(id);
    setDetailOpen(true);
  };

  // Close detail modal
  const handleDetailClose = () => {
    setDetailOpen(false);
  };

  // Open create form
  const handleCreate = () => {
    setFormMode('create');
    setFormOpen(true);
  };

  // Open edit form (from detail modal)
  const handleEdit = () => {
    if (!selectedData) return;
    setFormMode('edit');
    setDetailOpen(false);
    setFormOpen(true);
  };

  // Form submit
  const handleFormSave = async (params: any, isEdit: boolean) => {
    if (isEdit && selectedId) {
      await update(selectedId, params as UpdateLifeEventParams);
      message.success('已更新');
    } else {
      await create(params as CreateLifeEventParams);
      message.success('已创建');
    }
    setFormOpen(false);
  };

  // Delete
  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await remove(selectedId);
      message.success('已删除');
      setDetailOpen(false);
    } catch (e) {
      message.error('删除失败: ' + String(e));
    }
  };

  // Add link
  const handleAddLink = async () => {
    if (!selectedId) return;
    const trimmedId = linkEntityId.trim();
    if (!trimmedId) { message.error('请输入实体ID或标题'); return; }
    try {
      const params: CreateLifeEventLinkParams = {
        life_event_id: selectedId,
        entity_type: linkEntityType,
        entity_id: trimmedId,
        label: linkLabel || '',
      };
      await addLink(params);
      message.success('已添加关联');
      setLinkModalOpen(false);
      setLinkEntityId('');
      setLinkLabel('');
    } catch (e) {
      message.error('添加失败: ' + String(e));
    }
  };

  // Remove link
  const handleRemoveLink = async (id: string) => {
    try {
      await removeLink(id);
      message.success('已删除关联');
    } catch (e) {
      message.error('删除失败: ' + String(e));
    }
  };

  // Calculate years since birth
  const birthYears = birthDate ? dayjs().diff(dayjs(birthDate), 'year') : null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px 12px', flexShrink: 0,
        borderBottom: '1px solid var(--color-border)',
      }}>
        <Title level={4} style={{ margin: 0 }}><EnvironmentOutlined style={{ marginRight: 8 }} />人生事件</Title>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {birthDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
              <span><GiftOutlined style={{ marginRight: 4 }} />出生于</span>
              <strong style={{ color: '#2563EB', fontSize: 15 }}>
                {dayjs(birthDate).format('YYYY年M月D日')}
              </strong>
              {birthYears !== null && (
                <span style={{ color: '#94A3B8' }}>· {birthYears}年</span>
              )}
            </div>
          )}
          <Input
            placeholder="搜索事件..."
            prefix={<SearchOutlined />}
            style={{ width: 200, borderRadius: 12 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            placeholder="全部分类"
            style={{ width: 140 }}
            options={Object.entries(LIFE_EVENT_CATEGORIES).map(([key, cat]) => ({ value: key, label: cat.label }))}
            value={categoryFilter}
            onChange={(v) => setCategoryFilter(v)}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            添加人生事件
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Spin spinning={loading}>
          {birthDate ? (
            <VerticalTimeline
              events={displayData}
              selectedId={selectedId}
              birthDate={birthDate}
              onSelect={handleSelect}
            />
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', color: 'var(--color-muted)',
            }}>
              正在加载...
            </div>
          )}
        </Spin>
      </div>

      {/* Birth date setup */}
      <BirthDateSetupModal
        open={birthDateLoaded && !birthDate}
        onSave={handleBirthDateSave}
      />

      {/* Event detail modal */}
      <EventDetailModal
        open={detailOpen}
        event={selectedData}
        links={selectedLinks}
        stats={selectedStats}
        onClose={handleDetailClose}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddLink={() => {
          setLinkEntityType('task');
          setLinkEntityId('');
          setLinkLabel('');
          setLinkModalOpen(true);
        }}
        onRemoveLink={handleRemoveLink}
      />

      {/* Event form modal */}
      <EventFormModal
        open={formOpen}
        mode={formMode}
        event={formMode === 'edit' ? selectedData : null}
        onSave={handleFormSave}
        onCancel={() => setFormOpen(false)}
      />

      {/* Add link modal */}
      <Modal
        title="添加关联"
        open={linkModalOpen}
        onOk={handleAddLink}
        onCancel={() => setLinkModalOpen(false)}
        okText="添加"
        cancelText="取消"
        width={400}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <div>
            <div style={{ marginBottom: 4, fontSize: 13, fontWeight: 500 }}>类型</div>
            <Select
              value={linkEntityType}
              onChange={setLinkEntityType}
              style={{ width: '100%' }}
              options={[
                { value: 'task', label: '任务' },
                { value: 'paper', label: '论文' },
                { value: 'experiment', label: '实验' },
                { value: 'countdown', label: '倒数日' },
              ]}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4, fontSize: 13, fontWeight: 500 }}>实体</div>
            {linkEntityType === 'task' ? (
              <Select
                showSearch
                value={linkEntityId || undefined}
                onChange={(v) => setLinkEntityId(v || '')}
                placeholder="搜索并选择任务"
                style={{ width: '100%' }}
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
                options={allTasks.map(t => ({ value: t.id, label: t.title }))}
                allowClear
              />
            ) : (
              <Input
                value={linkEntityId}
                onChange={e => setLinkEntityId(e.target.value)}
                placeholder="输入实体ID或标题"
              />
            )}
          </div>
          <div>
            <div style={{ marginBottom: 4, fontSize: 13, fontWeight: 500 }}>标注</div>
            <Input
              value={linkLabel}
              onChange={e => setLinkLabel(e.target.value)}
              placeholder="如：写毕业论文"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
