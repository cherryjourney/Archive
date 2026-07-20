import { useEffect, useState } from 'react';
import { Typography, Button, Modal, Input, Select, Popconfirm, message, Slider, Popover, Switch } from 'antd';
import { PlusOutlined, AimOutlined, DeleteOutlined, LinkOutlined, SettingOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useContactStore } from '@/stores/contactStore';
import { contactService } from '@/services/contactService';
import ContactGraph from '@/components/contact/ContactGraph';
import type { Contact, CreateContactParams } from '@/types/contact';
import { RELATION_PRESETS, ME_RELATION_LABELS } from '@/utils/relationPresets';
const { Text, Title } = Typography;
const { TextArea } = Input;

// DB values → display labels
const REL_TYPES = ['亲情', '友情', '爱情', '同学', '学术合作', '职业发展', '日常服务'];
const REL_LABELS: Record<string, string> = {
  '亲情': '家人们', '友情': '朋友', '爱情': '爱情',
  '同学': '同学', '学术合作': '学术', '职业发展': '职业', '日常服务': '日常',
};
const FILTERS = [
  { key: null, label: '全部', color: '#8C8CAA' },
  { key: '亲情', label: '家人们', color: '#C08497' },
  { key: '友情', label: '朋友', color: '#7B9EC7' },
  { key: '爱情', label: '爱情', color: '#CF8B9B' },
  { key: '同学', label: '同学', color: '#8EA876' },
  { key: '学术合作', label: '学术', color: '#9B8EC4' },
  { key: '职业发展', label: '职业', color: '#6DA7B5' },
  { key: '日常服务', label: '日常', color: '#AA9887' },
];

// Grouped relation presets (for contact↔contact linking)
const PRESET_GROUPS = ['家庭', '社交', '同学'];
const groupedPresetOptions = PRESET_GROUPS.map(g => ({
  label: g,
  options: RELATION_PRESETS.filter(p => p.category === g).map(p => ({
    value: p.label,
    label: p.label,
  })),
}));

// Me relation options (for me↔contact linking)
const ME_GROUPS = ['直系长辈', '平辈', '直系晚辈', '姻亲', '父系', '母系', '社交', '同学'];
const meRelationOptions = ME_GROUPS.map(g => ({
  label: g,
  options: ME_RELATION_LABELS.filter(p => p.category === g).map(p => ({
    value: p.label,
    label: p.label,
  })),
}));

// ── RelationRow for the add/edit form ────────────────────
interface RelationRow {
  key: string;
  contactId: string;
  label: string;     // selected preset label, or '' for custom
  customLabel: string; // filled when user chooses "自定义"
}
let _rowKey = 0;
function nextRowKey() { return `rel-${++_rowKey}`; }

export default function ContactsPage() {
  const {
    contacts, graph, selectedId, links, filterType,
    fetchAll, selectContact, create, update, remove,
    createRelation, deleteRelation, setFilterType,
  } = useContactStore();

  // ── Form state ──
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [name, setName] = useState(''); const [contactInfo, setContactInfo] = useState('');
  const [relType, setRelType] = useState('亲情'); const [customTags, setCustomTags] = useState('');
  const [experiences, setExperiences] = useState(''); const [notes, setNotes] = useState('');
  const [relationRows, setRelationRows] = useState<RelationRow[]>([]);
  const [connectToMe, setConnectToMe] = useState(false);
  const [meLinkLabel, setMeLinkLabel] = useState('');
  const [meLinkCustom, setMeLinkCustom] = useState('');
  // Family tree fields (only for 亲情)
  const [familyFather, setFamilyFather] = useState<string | null>(null);
  const [familyMother, setFamilyMother] = useState<string | null>(null);
  const [familySpouse, setFamilySpouse] = useState<string | null>(null);

  // ── Link modal state ──
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState<string | null>(null);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkCustom, setLinkCustom] = useState('');
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);

  // ── Physics sliders ──
  const [nodeSize, setNodeSize] = useState(1.0);
  const [repulsion, setRepulsion] = useState(1.0);
  const [attraction, setAttraction] = useState(1.0);
  const [labelSize, setLabelSize] = useState(1.0);

  useEffect(() => { fetchAll(); }, []);

  // ── Handlers ─────────────────────────────────────────────

  const resetForm = () => {
    setName(''); setContactInfo(''); setRelType('亲情'); setCustomTags('');
    setExperiences(''); setNotes(''); setEditing(null); setRelationRows([]);
    setConnectToMe(false); setMeLinkLabel(''); setMeLinkCustom('');
    setFamilyFather(null); setFamilyMother(null); setFamilySpouse(null);
  };

  const addRelationRow = () => {
    setRelationRows(prev => [...prev, { key: nextRowKey(), contactId: '', label: '', customLabel: '' }]);
  };

  const updateRelationRow = (key: string, patch: Partial<RelationRow>) => {
    setRelationRows(prev => prev.map(r => r.key === key ? { ...r, ...patch } : r));
  };

  const removeRelationRow = (key: string) => {
    setRelationRows(prev => prev.filter(r => r.key !== key));
  };

  const handleSubmit = async () => {
    if (!name) return;
    const params: CreateContactParams = {
      name, contact_info: contactInfo, relationship_type: relType,
      custom_tags: customTags ? JSON.stringify(customTags.split(/[,，]/).filter(Boolean).map((s) => s.trim())) : '[]',
      common_experiences: experiences, notes, important_dates: '[]', met_date: undefined,
    };

    let targetId: string;
    if (editing) {
      targetId = editing.id;
      await update(targetId, params);
    } else {
      targetId = crypto.randomUUID();
      await contactService.create(targetId, params);
    }

    // Link to "me"
    const meFinalLabel = meLinkLabel === '__custom__' ? meLinkCustom : meLinkLabel;
    if (connectToMe && !editing) {
      try { await createRelation({ source_id: targetId, target_id: '__me__', label: meFinalLabel }); } catch {}
    }

    // Link to selected contacts
    for (const row of relationRows) {
      if (!row.contactId) continue;
      const finalLabel = row.label === '__custom__' ? row.customLabel : row.label;
      try { await createRelation({ source_id: targetId, target_id: row.contactId, label: finalLabel }); } catch {}
    }

    // Family tree links (only for 亲情)
    if (relType === '亲情') {
      try { await contactService.setFamilyLink(targetId, 'father', familyFather); } catch {}
      try { await contactService.setFamilyLink(targetId, 'mother', familyMother); } catch {}
      try { await contactService.setFamilyLink(targetId, 'spouse', familySpouse); } catch {}
    }

    message.success(editing ? '已更新' : '已添加');
    setFormOpen(false); resetForm();
    await fetchAll();
  };

  const handleLinkContact = async () => {
    if (!linkTarget || !linkSourceId) return;
    const finalLabel = linkLabel === '__custom__' ? linkCustom : linkLabel;
    await createRelation({ source_id: linkSourceId, target_id: linkTarget, label: finalLabel });
    setLinkOpen(false); setLinkTarget(null); setLinkLabel(''); setLinkCustom(''); setLinkSourceId(null);
    message.success('关联成功');
  };

  // ── Helpers ──────────────────────────────────────────────

  const selected = contacts.find((c) => c.id === selectedId);
  const filterColor = FILTERS.find(f => f.key === (filterType || selected?.relationship_type))?.color;

  /** Contacts available to link (exclude current editing target) */
  const linkableContacts = contacts.filter(c => c.id !== (editing?.id || ''));

  // ── Render ───────────────────────────────────────────────

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Slim top bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 10, flexShrink: 0,
      }}>
        <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
          <AimOutlined style={{ marginRight: 8, color: '#9B8EC4' }} />人脉图谱
        </Title>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {contacts.length} 人
          </Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { resetForm(); setFormOpen(true); }}
            style={{ borderRadius: 8, background: 'linear-gradient(135deg,#9B8EC4,#7B9EC7)', border: 'none', boxShadow: 'none' }}>
            添加
          </Button>
        </div>
      </div>

      {/* Body: filter bar + graph */}
      <div style={{ flex: 1, display: 'flex', gap: 10, minHeight: 0 }}>
        {/* Relationship filter — vertical pills */}
        <div style={{
          width: 120, flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {FILTERS.map(({ key, label, color }) => {
            const active = key === filterType;
            const count = key ? contacts.filter(c => c.relationship_type === key).length : contacts.length;
            return (
              <div key={label}
                onClick={() => setFilterType(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                  background: active ? `${color}15` : 'transparent',
                  border: active ? `1px solid ${color}33` : '1px solid transparent',
                  transition: 'all 0.12s',
                  userSelect: 'none',
                }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: active ? color : `${color}77`,
                  flexShrink: 0,
                  boxShadow: active ? `0 0 6px ${color}44` : 'none',
                }} />
                <span style={{
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? color : 'var(--text-secondary)',
                }}>{label}</span>
                <span style={{
                  marginLeft: 'auto', fontSize: 11,
                  color: active ? color : 'var(--text-muted)',
                  fontWeight: active ? 600 : 400,
                }}>{count}</span>
              </div>
            );
          })}

          {/* Physics tuning */}
          <Popover
            trigger="click"
            placement="rightTop"
            content={
              <div style={{ width: 210, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={{ fontSize: 12 }}>节点大小</Text>
                    <Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>{nodeSize.toFixed(1)}</Text>
                  </div>
                  <Slider min={0.5} max={2.5} step={0.1} value={nodeSize} onChange={setNodeSize}
                    tooltip={{ formatter: (v) => `${v}x` }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={{ fontSize: 12 }}>排斥力</Text>
                    <Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>{repulsion.toFixed(1)}</Text>
                  </div>
                  <Slider min={0.5} max={3.0} step={0.1} value={repulsion} onChange={setRepulsion}
                    tooltip={{ formatter: (v) => `${v}x` }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={{ fontSize: 12 }}>吸引力</Text>
                    <Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>{attraction.toFixed(1)}</Text>
                  </div>
                  <Slider min={0.1} max={3.0} step={0.1} value={attraction} onChange={setAttraction}
                    tooltip={{ formatter: (v) => `${v}x` }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={{ fontSize: 12 }}>文字大小</Text>
                    <Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>{labelSize.toFixed(1)}</Text>
                  </div>
                  <Slider min={0.5} max={3.0} step={0.1} value={labelSize} onChange={setLabelSize}
                    tooltip={{ formatter: (v) => `${v}x` }} />
                </div>
                <Button size="small" block onClick={() => { setNodeSize(1); setRepulsion(1); setAttraction(1); setLabelSize(1); }}
                  style={{ fontSize: 12 }}>
                  重置默认
                </Button>
              </div>
            }
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
              fontSize: 12, color: 'var(--text-secondary)',
              marginTop: 'auto',
              border: '1px solid var(--border-subtle)',
              transition: 'all 0.12s',
              userSelect: 'none',
            }}>
              <SettingOutlined style={{ fontSize: 12 }} />
              <span>调节</span>
            </div>
          </Popover>
        </div>

        {/* Graph */}
        <div style={{
          flex: 1, minWidth: 0, borderRadius: 14,
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden', position: 'relative',
        }}>
          {!graph ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', color: 'var(--text-muted)', fontSize: 14,
            }}>图谱加载中…</div>
          ) : (
            <ContactGraph
              nodes={graph.nodes}
              edges={graph.edges}
              selectedId={selectedId}
              filterType={filterType}
              nodeSizeMult={nodeSize}
              repulsionMult={repulsion}
              attractionMult={attraction}
              labelSizeMult={labelSize}
              onSelect={(id) => selectContact(id)}
            />
          )}

          {/* Hint */}
          {!selectedId && (
            <div style={{
              position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
              color: 'var(--text-muted)', fontSize: 11,
              background: 'var(--bg-card)', borderRadius: 20, padding: '4px 14px',
              border: '1px solid var(--border-subtle)', opacity: 0.7,
              pointerEvents: 'none',
            }}>
              {filterType === '亲情' ? '拖拽平移 · 滚轮缩放 · 点击看详情' : '拖拽节点 · 滚轮缩放 · 悬停看连线 · 点击看详情'}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Add / Edit Contact Modal ═══════════════════════════════ */}
      <Modal title={editing ? '编辑联系人' : '添加联系人'} open={formOpen}
        onCancel={() => setFormOpen(false)} onOk={handleSubmit}
        width={520} okText="保存" destroyOnClose>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input placeholder="姓名" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <Input placeholder="联系方式" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} />
          <Select value={relType} onChange={setRelType}
            options={REL_TYPES.map((t) => ({ value: t, label: REL_LABELS[t] || t }))} />
          <Input placeholder="自定义标签（逗号分隔）" value={customTags}
            onChange={(e) => setCustomTags(e.target.value)} />
          <TextArea placeholder="共同经历" value={experiences}
            onChange={(e) => setExperiences(e.target.value)} rows={2} />
          <TextArea placeholder="备注" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />

          {/* ── Link to existing contacts ── */}
          <div style={{
            background: 'var(--bg-page)', borderRadius: 10, padding: '10px 14px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>关联已有联系人</Text>

            {relationRows.map((row) => {
              const isCustom = row.label === '__custom__';
              return (
                <div key={row.key} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Select
                    showSearch
                    placeholder="选择联系人"
                    value={row.contactId || undefined}
                    onChange={(v) => updateRelationRow(row.key, { contactId: v })}
                    style={{ flex: 1, minWidth: 0 }}
                    options={linkableContacts.map(c => ({
                      value: c.id,
                      label: `${c.name} (${REL_LABELS[c.relationship_type] || c.relationship_type})`,
                    }))}
                    filterOption={(input, option) => (option?.label as string || '').includes(input)}
                  />
                  {isCustom ? (
                    <Input
                      placeholder="输入关系"
                      value={row.customLabel}
                      onChange={(e) => updateRelationRow(row.key, { customLabel: e.target.value })}
                      style={{ width: 110 }}
                      size="small"
                    />
                  ) : (
                    <Select
                      placeholder="关系"
                      value={row.label || undefined}
                      onChange={(v) => updateRelationRow(row.key, { label: v, customLabel: '' })}
                      style={{ width: 140 }}
                      options={[
                        ...groupedPresetOptions,
                        { label: '其他', options: [{ value: '__custom__', label: '✏️ 自定义…' }] },
                      ]}
                      allowClear
                    />
                  )}
                  <Button
                    type="text" size="small" danger
                    icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                    onClick={() => removeRelationRow(row.key)}
                    style={{ minWidth: 24, height: 24, padding: 0, flexShrink: 0 }}
                  />
                </div>
              );
            })}

            <Button
              type="dashed" size="small" block
              icon={<PlusOutlined />}
              onClick={addRelationRow}
              style={{ fontSize: 12 }}
            >
              添加关联
            </Button>
          </div>

          {/* ── Family tree fields (only for 亲情) ── */}
          {relType === '亲情' && (
            <div style={{
              background: 'var(--bg-page)', borderRadius: 10, padding: '10px 14px',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>族谱关系</Text>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>父亲</Text>
                  <Select
                    allowClear
                    placeholder="选择父亲"
                    value={familyFather}
                    onChange={setFamilyFather}
                    style={{ width: '100%' }}
                    options={linkableContacts
                      .filter(c => c.relationship_type === '亲情' && c.id !== (editing?.id || ''))
                      .map(c => ({ value: c.id, label: c.name }))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>母亲</Text>
                  <Select
                    allowClear
                    placeholder="选择母亲"
                    value={familyMother}
                    onChange={setFamilyMother}
                    style={{ width: '100%' }}
                    options={linkableContacts
                      .filter(c => c.relationship_type === '亲情' && c.id !== (editing?.id || ''))
                      .map(c => ({ value: c.id, label: c.name }))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>配偶</Text>
                  <Select
                    allowClear
                    placeholder="选择配偶"
                    value={familySpouse}
                    onChange={setFamilySpouse}
                    style={{ width: '100%' }}
                    options={linkableContacts
                      .filter(c => c.id !== (editing?.id || ''))
                      .map(c => ({ value: c.id, label: c.name }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Connect to me (only when creating) ── */}
          {!editing && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Switch checked={connectToMe} onChange={(v) => { setConnectToMe(v); if (!v) { setMeLinkLabel(''); setMeLinkCustom(''); } }} size="small" />
                <Text style={{ fontSize: 13 }}>同时关联我</Text>
              </div>
              {connectToMe && (
                meLinkLabel === '__custom__' ? (
                  <Input
                    placeholder="输入与你的关系"
                    value={meLinkCustom}
                    onChange={(e) => setMeLinkCustom(e.target.value)}
                  />
                ) : (
                  <Select
                    showSearch
                    placeholder="选择与你的关系（可选）"
                    value={meLinkLabel || undefined}
                    onChange={(v) => setMeLinkLabel(v)}
                    allowClear
                    style={{ width: '100%' }}
                    options={[
                      ...meRelationOptions,
                      { label: '其他', options: [{ value: '__custom__', label: '✏️ 自定义…' }] },
                    ]}
                    filterOption={(input, option) => (option?.label as string || '').includes(input)}
                  />
                )
              )}
            </>
          )}
        </div>
      </Modal>

      {/* ═══ Link Contact Modal ════════════════════════════════════ */}
      <Modal title="关联联系人" open={linkOpen}
        onCancel={() => { setLinkOpen(false); setLinkTarget(null); setLinkLabel(''); setLinkCustom(''); setLinkSourceId(null); }}
        onOk={handleLinkContact} okText="确认关联" okButtonProps={{ disabled: !linkTarget }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Select showSearch placeholder={'选择联系人（可选「我」）'} value={linkTarget} onChange={(v) => { setLinkTarget(v); setLinkLabel(''); setLinkCustom(''); }}
            style={{ width: '100%' }}
            options={[
              { value: '__me__', label: '⭐ 我' },
              ...contacts.filter(c => c.id !== linkSourceId).map(c => ({
                value: c.id, label: `${c.name} (${REL_LABELS[c.relationship_type] || c.relationship_type})`,
              })),
            ]}
            filterOption={(input, option) => (option?.label as string || '').includes(input)} />

          {linkTarget === '__me__' ? (
            linkLabel === '__custom__' ? (
              <Input
                placeholder="输入与你的关系"
                value={linkCustom}
                onChange={(e) => setLinkCustom(e.target.value)}
              />
            ) : (
              <Select
                showSearch
                placeholder="选择与你的关系（可选）"
                value={linkLabel || undefined}
                onChange={(v) => setLinkLabel(v)}
                allowClear
                style={{ width: '100%' }}
                options={[
                  ...meRelationOptions,
                  { label: '其他', options: [{ value: '__custom__', label: '✏️ 自定义…' }] },
                ]}
                filterOption={(input, option) => (option?.label as string || '').includes(input)}
              />
            )
          ) : (
            linkLabel === '__custom__' ? (
              <Input
                placeholder="输入关系"
                value={linkCustom}
                onChange={(e) => setLinkCustom(e.target.value)}
              />
            ) : (
              <Select
                showSearch
                placeholder="选择关系（可选）"
                value={linkLabel || undefined}
                onChange={(v) => setLinkLabel(v)}
                allowClear
                style={{ width: '100%' }}
                options={[
                  ...groupedPresetOptions,
                  { label: '其他', options: [{ value: '__custom__', label: '✏️ 自定义…' }] },
                ]}
                filterOption={(input, option) => (option?.label as string || '').includes(input)}
              />
            )
          )}
        </div>
      </Modal>

      {/* ═══ Node Detail Modal ════════════════════════════════════ */}
      <Modal
        title={null}
        open={!!selected}
        onCancel={() => selectContact(null)}
        footer={null}
        width={400}
        destroyOnClose
        centered
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 8 }}>
            {/* Avatar */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: `linear-gradient(135deg, ${filterColor || '#8C8CAA'}, ${filterColor || '#8C8CAA'}88)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 24,
              boxShadow: `0 4px 16px ${filterColor || '#8C8CAA'}33`,
            }}>{selected.name[0]}</div>

            {/* Name + type */}
            <div style={{ textAlign: 'center' }}>
              <Title level={4} style={{ margin: 0 }}>{selected.name}</Title>
              <span style={{
                fontSize: 12, padding: '2px 10px', borderRadius: 6,
                background: `${filterColor || '#8C8CAA'}18`,
                color: filterColor || '#8C8CAA',
                marginTop: 4, display: 'inline-block',
              }}>{REL_LABELS[selected.relationship_type] || selected.relationship_type}</span>
            </div>

            {/* Info fields */}
            {selected.contact_info && (
              <div style={{ width: '100%', background: 'var(--bg-page)', borderRadius: 10, padding: '10px 14px' }}>
                <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>联系方式</Text>
                <div><Text style={{ fontSize: 13 }}>{selected.contact_info}</Text></div>
              </div>
            )}
            {selected.common_experiences && (
              <div style={{ width: '100%', background: 'var(--bg-page)', borderRadius: 10, padding: '10px 14px' }}>
                <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>共同经历</Text>
                <div><Text style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{selected.common_experiences}</Text></div>
              </div>
            )}
            {selected.notes && (
              <div style={{ width: '100%', background: 'var(--bg-page)', borderRadius: 10, padding: '10px 14px' }}>
                <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>备注</Text>
                <div><Text style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{selected.notes}</Text></div>
              </div>
            )}

            {/* Custom tags */}
            {(() => {
              try {
                const tags = JSON.parse(selected.custom_tags) as string[];
                if (tags.length > 0) {
                  return (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {tags.map((t: string, i: number) => (
                        <span key={i} style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 10,
                          background: 'var(--bg-page)', color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                        }}>{t}</span>
                      ))}
                    </div>
                  );
                }
              } catch {}
              return null;
            })()}

            {/* Connected people — relations list */}
            {links.length > 0 && (
              <div style={{ width: '100%', background: 'var(--bg-page)', borderRadius: 10, padding: '10px 14px' }}>
                <Text style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>
                  关联的人 · {links.length}
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {links.map((link) => {
                    const isMeLink = link.entity_type === '__me__';
                    const isContactLink = link.entity_type === 'contact';
                    const targetId = isMeLink ? '__me__' : link.entity_id;
                    const targetContact = isContactLink ? contacts.find(c => c.id === targetId) : null;
                    const targetName = isMeLink ? '我' : (targetContact?.name || targetId.slice(0, 8));
                    const relationLabel = link.label || (isMeLink ? '家人' : '认识');

                    return (
                      <div key={link.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '4px 8px', borderRadius: 6,
                        background: 'var(--bg-card)',
                      }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%',
                          background: isMeLink
                            ? 'linear-gradient(135deg, #D4A853, #D4A85388)'
                            : `linear-gradient(135deg, ${FILTERS.find(f => f.key === targetContact?.relationship_type)?.color || '#8C8CAA'}, ${FILTERS.find(f => f.key === targetContact?.relationship_type)?.color || '#8C8CAA'}88)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 600, fontSize: 11,
                          flexShrink: 0,
                        }}>{isMeLink ? '我' : targetName[0]}</div>
                        <Text style={{ fontSize: 13, flex: 1 }}>{targetName}</Text>
                        <Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>{relationLabel}</Text>
                        <Popconfirm
                          title="确定取消关联？"
                          onConfirm={async () => {
                            await deleteRelation({ source_id: selected.id, target_id: targetId });
                            await selectContact(selected.id);
                            message.success('已取消关联');
                          }}
                        >
                          <Button
                            type="text" size="small" danger
                            icon={<DisconnectOutlined style={{ fontSize: 12 }} />}
                            style={{ minWidth: 24, height: 24, padding: 0 }}
                          />
                        </Popconfirm>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <Button icon={<LinkOutlined />} onClick={() => { setLinkSourceId(selected!.id); selectContact(null); setLinkOpen(true); }}>关联</Button>
              <Button onClick={() => {
                const s = selected;
                // Pre-populate family tree fields from existing links
                const fatherLink = links.find(l => l.entity_type === 'father');
                const motherLink = links.find(l => l.entity_type === 'mother');
                const spouseLink = links.find(l => l.entity_type === 'spouse');
                selectContact(null);
                setEditing(s); setName(s.name); setContactInfo(s.contact_info);
                setRelType(s.relationship_type);
                try { setCustomTags((JSON.parse(s.custom_tags) as string[]).join(', ')); } catch { setCustomTags(''); }
                setExperiences(s.common_experiences); setNotes(s.notes);
                setFamilyFather(fatherLink?.entity_id || null);
                setFamilyMother(motherLink?.entity_id || null);
                setFamilySpouse(spouseLink?.entity_id || null);
                setFormOpen(true);
              }}>编辑</Button>
              <Popconfirm title="确定删除？" onConfirm={() => { remove(selected.id); selectContact(null); }}>
                <Button danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
