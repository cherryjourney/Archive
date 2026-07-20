import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Modal, Input, Typography, Tag, TimePicker,
  InputNumber, Button, Select, DatePicker, Empty,
} from 'antd';
import {
  ThunderboltOutlined, SearchOutlined, InboxOutlined,
  ClockCircleOutlined, PlusOutlined,
  CalendarOutlined, AppstoreOutlined,
  CloseCircleFilled,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { useTaskStore } from '@/stores/taskStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/types/task';
import { parseNaturalLanguage } from '@/utils/nlp';
import type { Task } from '@/types/task';
import type { TaskFormParams } from '@/components/task/TaskFormModal';

const { Text } = Typography;
const { Option } = Select;

type PanelMode = 'library' | 'create';

interface Props {
  open: boolean;
  displayDate: string;
  onClose: () => void;
  onAddFromLibrary: (taskId: string, startTime: string, endTime: string) => Promise<void>;
  onQuickCreate: (params: TaskFormParams) => Promise<void>;
}

// ── Quick-suggest time chips (context-aware) ──
function getSuggestionChips(): { label: string; text: string }[] {
  const hour = dayjs().hour();
  if (hour < 10) {
    return [
      { label: '上午9点', text: '上午9点 ' },
      { label: '上午10点', text: '上午10点 ' },
      { label: '下午2点', text: '下午2点 ' },
      { label: '明早', text: '明天上午9点 ' },
    ];
  }
  if (hour < 14) {
    return [
      { label: '下午2点', text: '下午2点 ' },
      { label: '下午3点', text: '下午3点 ' },
      { label: '今晚', text: '晚上8点 ' },
      { label: '明早', text: '明天上午9点 ' },
    ];
  }
  return [
    { label: '今晚', text: '晚上8点 ' },
    { label: '明早', text: '明天上午9点 ' },
    { label: '下午3点', text: '明天下午3点 ' },
    { label: '后天', text: '后天上午9点 ' },
  ];
}

// ── Smart default time for quick-add ──
function smartDefaultTime(): string {
  const now = dayjs();
  const hour = now.hour();
  const minute = now.minute();
  // Round up to next 15-min slot + 30 min buffer
  const totalMin = hour * 60 + minute + 30;
  const rounded = Math.ceil(totalMin / 15) * 15;
  const h = Math.min(Math.floor(rounded / 60), 23);
  const m = rounded % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ── Priority filter config ──
const PRIORITY_FILTERS = [
  { key: null, label: '全部', color: 'var(--text-secondary)' },
  { key: 0, label: 'P0', color: PRIORITY_COLORS[0] },
  { key: 1, label: 'P1', color: PRIORITY_COLORS[1] },
  { key: 2, label: 'P2', color: PRIORITY_COLORS[2] },
  { key: 3, label: 'P3', color: PRIORITY_COLORS[3] },
] as const;

export default function AddTaskPanel({ open, displayDate, onClose, onAddFromLibrary, onQuickCreate }: Props) {
  const { taskLibrary, fetchTaskLibrary } = useTaskStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [mode, setMode] = useState<PanelMode>('library');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<number | null>(null);

  // NLP smart input
  const [smartInput, setSmartInput] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ReturnType<typeof parseNaturalLanguage> | null>(null);
  const parseTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Inline time assignment for library tasks
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [taskTime, setTaskTime] = useState<string>('09:00');
  const [taskDuration, setTaskDuration] = useState<number>(60);

  // Quick create form
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(displayDate);
  const [formTime, setFormTime] = useState<string | null>(null);
  const [formDuration, setFormDuration] = useState<number | null>(null);
  const [formPriority, setFormPriority] = useState<number>(2);
  const [formCategoryId, setFormCategoryId] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      fetchTaskLibrary();
      fetchCategories();
      setFormDate(displayDate);
      setExpandedTaskId(null);
      setSmartInput('');
      setParsedPreview(null);
      setSearch('');
      setPriorityFilter(null);
      setMode('library');
    }
  }, [open, displayDate]);

  // ── Real-time NLP parsing ──
  const handleSmartInputChange = useCallback((value: string) => {
    setSmartInput(value);
    if (parseTimerRef.current) clearTimeout(parseTimerRef.current);
    if (value.trim().length >= 2) {
      parseTimerRef.current = setTimeout(() => {
        const parsed = parseNaturalLanguage(value);
        // Only show preview if something non-trivial was parsed
        const hasInfo = parsed.date || parsed.time || parsed.priority !== 2;
        setParsedPreview(hasInfo ? parsed : null);
      }, 200);
    } else {
      setParsedPreview(null);
    }
  }, []);

  // Cleanup timer
  useEffect(() => () => { if (parseTimerRef.current) clearTimeout(parseTimerRef.current); }, []);

  // ── Filtered task library ──
  const filteredLibrary = useMemo(() => {
    let list = taskLibrary;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (priorityFilter !== null) {
      list = list.filter((t) => t.priority === priorityFilter);
    }
    return list;
  }, [taskLibrary, search, priorityFilter]);

  // ── Suggestion chips ──
  const suggestions = useMemo(() => getSuggestionChips(), [open]);

  // ── NLP: apply suggestion chip ──
  const applySuggestion = (text: string) => {
    setSmartInput((prev) => (prev ? `${prev.trim()} ${text}` : text));
    // Trigger parse
    const combined = smartInput ? `${smartInput.trim()} ${text}` : text;
    setParsedPreview(parseNaturalLanguage(combined));
  };

  // ── NLP: quick-create from parsed input ──
  const handleSmartCreate = async () => {
    if (!smartInput.trim()) return;
    const parsed = parseNaturalLanguage(smartInput);
    if (!parsed.title || parsed.title === smartInput.trim()) return; // No meaningful parse
    setSubmitting(true);
    try {
      const params: TaskFormParams = {
        title: parsed.title,
        description: '',
        priority: parsed.priority,
        scheduled_date: parsed.date || displayDate,
        category_id: null,
        start_time: parsed.time || undefined,
      };
      await onQuickCreate(params);
      setSmartInput('');
      setParsedPreview(null);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Add task from library ──
  const handleAddFromLibrary = async (task: Task, useDefaultTime: boolean) => {
    let startTime: string;
    let duration: number;
    if (useDefaultTime) {
      startTime = smartDefaultTime();
      duration = task.estimated_minutes || 60;
    } else {
      startTime = taskTime;
      duration = taskDuration;
    }
    const [h, m] = startTime.split(':').map(Number);
    const endTotal = Math.min(h * 60 + m + duration, 24 * 60);
    const endH = Math.floor(endTotal / 60);
    const endM = endTotal % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    setSubmitting(true);
    try {
      await onAddFromLibrary(task.id, startTime, endTime);
    } finally {
      setSubmitting(false);
      setExpandedTaskId(null);
    }
  };

  // ── Quick create ──
  const handleQuickCreate = async () => {
    if (!formTitle.trim()) return;
    setSubmitting(true);
    try {
      const params: TaskFormParams = {
        title: formTitle,
        description: '',
        priority: formPriority,
        estimated_minutes: formDuration,
        scheduled_date: formDate,
        category_id: formCategoryId,
        start_time: formTime || undefined,
        duration_minutes: formDuration || undefined,
      };
      await onQuickCreate(params);
      setFormTitle('');
      setFormTime(null);
      setFormDuration(null);
      setFormPriority(2);
      setFormCategoryId(null);
    } finally {
      setSubmitting(false);
    }
  };

  const isToday = displayDate === dayjs().format('YYYY-MM-DD');
  const hasParsedInfo = parsedPreview !== null && (
    parsedPreview.date || parsedPreview.time || parsedPreview.priority !== 2
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={560}
      destroyOnClose
      footer={null}
      centered
      styles={{
        body: { padding: '0 24px 24px' },
        header: { padding: '20px 24px 16px', marginBottom: 0 },
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Text strong style={{ fontSize: 19, color: 'var(--text-primary)' }}>
              添加任务
            </Text>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
              background: isToday ? 'rgba(37,99,235,0.08)' : 'var(--bg-glass)',
              color: isToday ? '#2563EB' : 'var(--text-secondary)',
              border: `1px solid ${isToday ? 'rgba(37,99,235,0.15)' : 'var(--border-subtle)'}`,
            }}>
              <CalendarOutlined style={{ fontSize: 11 }} />
              {displayDate}
              {isToday && (
                <span style={{
                  marginLeft: 2,
                  padding: '0 5px',
                  borderRadius: 4,
                  background: '#2563EB',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 600,
                  lineHeight: '16px',
                }}>
                  今天
                </span>
              )}
            </span>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ════════════════════════════════════════════════════════
            Smart NLP Input — Hero
            ════════════════════════════════════════════════════════ */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(37,99,235,0.03) 0%, rgba(99,102,241,0.03) 100%)',
          borderRadius: 16,
          padding: '6px',
          border: '1px solid var(--border-subtle)',
          transition: 'border-color 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out)',
          boxShadow: hasParsedInfo ? '0 0 0 2px rgba(37,99,235,0.08)' : undefined,
        }}>
          {/* Input row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36, height: 36,
              flexShrink: 0,
              color: parsedPreview ? '#6366F1' : 'var(--text-muted)',
              transition: 'color 0.2s var(--ease-out)',
            }}>
              <ThunderboltOutlined style={{ fontSize: 18 }} />
            </span>
            <Input
              placeholder="说你想做什么… 如：明天下午3点读论文 P1"
              value={smartInput}
              onChange={(e) => handleSmartInputChange(e.target.value)}
              onPressEnter={handleSmartCreate}
              variant="borderless"
              size="large"
              style={{
                fontSize: 15,
                padding: '4px 0',
                background: 'transparent',
              }}
            />
            {smartInput && (
              <span
                onClick={() => { setSmartInput(''); setParsedPreview(null); }}
                style={{
                  cursor: 'pointer',
                  padding: '4px 8px',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                <CloseCircleFilled style={{ fontSize: 14 }} />
              </span>
            )}
          </div>

          {/* Parse preview */}
          {hasParsedInfo && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px 8px 38px',
              borderTop: '1px solid var(--border-subtle)',
              animation: 'fadeSlideIn 0.2s var(--ease-out)',
            }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {parsedPreview.title}
              </Text>
              {parsedPreview.date && (
                <Tag color="blue" style={{ margin: 0, borderRadius: 6, fontSize: 11 }}>{parsedPreview.date}</Tag>
              )}
              {parsedPreview.time && (
                <Tag color="purple" style={{ margin: 0, borderRadius: 6, fontSize: 11 }}>{parsedPreview.time}</Tag>
              )}
              {parsedPreview.priority !== 2 && (
                <Tag color="orange" style={{ margin: 0, borderRadius: 6, fontSize: 11 }}>P{parsedPreview.priority}</Tag>
              )}
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                loading={submitting}
                onClick={handleSmartCreate}
                style={{ borderRadius: 10, flexShrink: 0 }}
              >
                创建
              </Button>
            </div>
          )}

          {/* Suggestion chips */}
          {!smartInput && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 6px 6px 38px',
              flexWrap: 'wrap',
            }}>
              {suggestions.map((s) => (
                <span
                  key={s.label}
                  onClick={() => applySuggestion(s.text)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 14,
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    transition: 'all 0.15s var(--ease-out)',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(37,99,235,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(37,99,235,0.20)';
                    e.currentTarget.style.color = '#2563EB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-glass)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {s.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════
            Mode Tabs — custom pill design
            ════════════════════════════════════════════════════════ */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-glass)',
          borderRadius: 13,
          padding: 4,
          border: '1px solid var(--border-subtle)',
        }}>
          {([
            { key: 'library' as PanelMode, label: '任务库', icon: <AppstoreOutlined /> },
            { key: 'create' as PanelMode, label: '快速新建', icon: <PlusOutlined /> },
          ]).map((tab) => {
            const isActive = mode === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setMode(tab.key)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  height: 38,
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(99,102,241,0.06))'
                    : 'transparent',
                  color: isActive ? '#2563EB' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 1px 3px rgba(37,99,235,0.10)' : 'none',
                  transition: 'all 0.2s var(--ease-out)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#2563EB';
                    e.currentTarget.style.background = 'rgba(37,99,235,0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ════════════════════════════════════════════════════════
            Library Mode
            ════════════════════════════════════════════════════════ */}
        {mode === 'library' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflow: 'auto' }}>

            {/* Search + Priority filter */}
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
                placeholder={taskLibrary.length > 0 ? `搜索 ${taskLibrary.length} 个任务…` : '搜索任务库…'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
                style={{ borderRadius: 12, flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PRIORITY_FILTERS.map((f) => {
                const isActive = priorityFilter === f.key;
                return (
                  <span
                    key={f.key ?? 'all'}
                    onClick={() => setPriorityFilter(isActive ? null : f.key)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 14,
                      fontSize: 11,
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer',
                      background: isActive ? `${f.color}14` : 'var(--bg-glass)',
                      border: `1px solid ${isActive ? `${f.color}30` : 'var(--border-subtle)'}`,
                      color: isActive ? f.color : 'var(--text-muted)',
                      transition: 'all 0.15s var(--ease-out)',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = 'var(--border-default)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.color = 'var(--text-muted)';
                      }
                    }}
                  >
                    {f.key !== null && (
                      <span style={{
                        display: 'inline-block',
                        width: 6, height: 6, borderRadius: '50%',
                        background: f.color,
                        marginRight: 4,
                        verticalAlign: 'middle',
                      }} />
                    )}
                    {f.label}
                  </span>
                );
              })}
            </div>

            {/* Loading state */}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton" style={{ height: 56, borderRadius: 14 }} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && filteredLibrary.length === 0 && (
              <Empty
                image={
                  <InboxOutlined style={{ fontSize: 44, color: 'var(--text-muted)', opacity: 0.6 }} />
                }
                description={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Text style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>
                      {search || priorityFilter !== null ? '没有匹配的任务' : '任务库为空'}
                    </Text>
                    <Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {search || priorityFilter !== null
                        ? '试试其他搜索词或筛选条件'
                        : '所有任务都已安排或完成 · 使用「快速新建」创建新任务'}
                    </Text>
                  </div>
                }
                style={{ margin: '20px 0' }}
              />
            )}

            {/* Task cards */}
            {!loading && filteredLibrary.map((task, i) => {
              const isExpanded = expandedTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className="stagger-enter"
                  style={{
                    animationDelay: `${Math.min(i * 0.03, 0.3)}s`,
                    padding: isExpanded ? '14px 16px' : '10px 14px',
                    borderRadius: 14,
                    background: isExpanded ? 'var(--bg-card)' : 'var(--bg-glass)',
                    border: isExpanded
                      ? '1px solid rgba(37,99,235,0.15)'
                      : '1px solid var(--border-subtle)',
                    transition: 'all 0.2s var(--ease-out)',
                    cursor: 'default',
                  }}
                >
                  {/* Card header row */}
                  <div
                    onClick={() => {
                      if (!isExpanded) {
                        setExpandedTaskId(task.id);
                        setTaskTime(smartDefaultTime());
                        setTaskDuration(task.estimated_minutes || 60);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                    }}
                  >
                    {/* Priority indicator */}
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: PRIORITY_COLORS[task.priority],
                      boxShadow: `0 0 6px ${PRIORITY_COLORS[task.priority]}40`,
                    }} />

                    {/* Title + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{
                        fontSize: 14, fontWeight: 500,
                        color: 'var(--text-primary)',
                        display: 'block',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {task.title}
                      </Text>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                        <Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          预计 {task.estimated_minutes || '—'} 分钟
                        </Text>
                      </div>
                    </div>

                    {/* Priority badge */}
                    <Tag style={{
                      borderRadius: 6, margin: 0, fontSize: 10,
                      fontWeight: 600,
                      background: `${PRIORITY_COLORS[task.priority]}10`,
                      border: `1px solid ${PRIORITY_COLORS[task.priority]}25`,
                      color: PRIORITY_COLORS[task.priority],
                      flexShrink: 0,
                    }}>
                      {PRIORITY_LABELS[task.priority]}
                    </Tag>

                    {/* Quick-add button (visible on hover for collapsed card) */}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddFromLibrary(task, true);
                      }}
                      title="快速添加（智能时间）"
                      style={{
                        width: 28, height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 8,
                        flexShrink: 0,
                        cursor: 'pointer',
                        opacity: 0,
                        background: 'rgba(37,99,235,0.08)',
                        color: '#2563EB',
                        fontSize: 14,
                        transition: 'opacity 0.15s var(--ease-out), background 0.15s var(--ease-out)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(37,99,235,0.16)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(37,99,235,0.08)';
                      }}
                      ref={(el) => {
                        // Inline hover reveal via parent
                        if (el) {
                          const parent = el.closest<HTMLElement>('[style]');
                          if (!parent) return;
                          const cardParent = parent.parentElement;
                          if (!cardParent) return;
                          cardParent.addEventListener('mouseenter', () => { el.style.opacity = '1'; });
                          cardParent.addEventListener('mouseleave', () => { el.style.opacity = '0'; });
                        }
                      }}
                    >
                      <PlusOutlined style={{ fontSize: 13 }} />
                    </span>
                  </div>

                  {/* Inline time setter (expanded) */}
                  {isExpanded && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        marginTop: 12, paddingTop: 12,
                        borderTop: '1px solid var(--border-subtle)',
                        display: 'flex', alignItems: 'center', gap: 10,
                        animation: 'fadeSlideIn 0.2s var(--ease-out)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ClockCircleOutlined style={{ color: 'var(--text-muted)', fontSize: 13 }} />
                        <TimePicker
                          value={dayjs(taskTime, 'HH:mm')}
                          onChange={(t) => t && setTaskTime(t.format('HH:mm'))}
                          format="HH:mm"
                          minuteStep={15}
                          size="small"
                          style={{ width: 96, borderRadius: 10 }}
                        />
                      </div>
                      <InputNumber
                        value={taskDuration}
                        onChange={(v) => v && setTaskDuration(v)}
                        min={15}
                        max={480}
                        step={15}
                        size="small"
                        addonAfter="分钟"
                        style={{ width: 108, borderRadius: 10 }}
                      />
                      <div style={{ flex: 1 }} />
                      <Button
                        size="small"
                        onClick={() => setExpandedTaskId(null)}
                        style={{ borderRadius: 10, color: 'var(--text-muted)' }}
                      >
                        取消
                      </Button>
                      <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        loading={submitting}
                        onClick={() => handleAddFromLibrary(task, false)}
                        style={{ borderRadius: 10 }}
                      >
                        添加
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            Create Mode
            ════════════════════════════════════════════════════════ */}
        {mode === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Title — hero input */}
            <div>
              <Text style={{
                fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.04em',
                display: 'block', marginBottom: 8,
              }}>
                任务标题 <span style={{ color: '#DC2626', fontWeight: 400 }}>*</span>
              </Text>
              <Input
                placeholder="输入任务标题…"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                onPressEnter={handleQuickCreate}
                maxLength={200}
                size="large"
                style={{ borderRadius: 14, fontSize: 15 }}
                autoFocus
              />
            </div>

            {/* Date + Time + Duration */}
            <div style={{
              padding: '14px 16px',
              borderRadius: 14,
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-subtle)',
            }}>
              <Text style={{
                fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.04em',
                display: 'block', marginBottom: 10,
              }}>
                时间安排
              </Text>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 2 }}>
                  <DatePicker
                    value={dayjs(formDate)}
                    onChange={(d) => d && setFormDate(d.format('YYYY-MM-DD'))}
                    style={{ width: '100%', borderRadius: 12 }}
                    size="large"
                    allowClear={false}
                    placeholder="日期"
                  />
                </div>
                <div style={{ flex: 1.5 }}>
                  <TimePicker
                    value={formTime ? dayjs(formTime, 'HH:mm') : null}
                    onChange={(t) => setFormTime(t ? t.format('HH:mm') : null)}
                    format="HH:mm"
                    minuteStep={15}
                    style={{ width: '100%', borderRadius: 12 }}
                    size="large"
                    placeholder="可选"
                  />
                </div>
                <div style={{ flex: 1.5 }}>
                  <InputNumber
                    value={formDuration}
                    onChange={(v) => setFormDuration(v)}
                    placeholder="分钟"
                    min={15}
                    max={480}
                    step={15}
                    style={{ width: '100%', borderRadius: 12 }}
                    size="large"
                    addonAfter="分钟"
                  />
                </div>
              </div>
            </div>

            {/* Priority + Category */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                  display: 'block', marginBottom: 8,
                }}>
                  优先级
                </Text>
                <Select
                  value={formPriority}
                  onChange={setFormPriority}
                  size="large"
                  style={{ width: '100%', borderRadius: 12 }}
                  popupMatchSelectWidth={false}
                >
                  <Option value={0}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[0], display: 'inline-block' }} />
                      P0 · 紧急
                    </span>
                  </Option>
                  <Option value={1}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[1], display: 'inline-block' }} />
                      P1 · 重要
                    </span>
                  </Option>
                  <Option value={2}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[2], display: 'inline-block' }} />
                      P2 · 普通
                    </span>
                  </Option>
                  <Option value={3}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[3], display: 'inline-block' }} />
                      P3 · 低优
                    </span>
                  </Option>
                </Select>
              </div>
              <div style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                  display: 'block', marginBottom: 8,
                }}>
                  分类
                </Text>
                <Select
                  value={formCategoryId}
                  onChange={setFormCategoryId}
                  placeholder="选择分类"
                  allowClear
                  size="large"
                  style={{ width: '100%', borderRadius: 12 }}
                >
                  {categories.map((c) => (
                    <Option key={c.id} value={c.id}>{c.name}</Option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleQuickCreate}
              disabled={!formTitle.trim() || submitting}
              style={{
                width: '100%',
                height: 52,
                border: 'none',
                borderRadius: 16,
                cursor: formTitle.trim() && !submitting ? 'pointer' : 'not-allowed',
                background: formTitle.trim()
                  ? 'linear-gradient(135deg, #2563EB 0%, #4F46E5 50%, #7C3AED 100%)'
                  : 'var(--bg-glass)',
                color: formTitle.trim() ? '#FFFFFF' : 'var(--text-muted)',
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: '0.02em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                marginTop: 4,
                boxShadow: formTitle.trim()
                  ? '0 4px 20px rgba(37,99,235,0.30), 0 1px 3px rgba(37,99,235,0.15)'
                  : 'none',
                transition: 'all 0.2s var(--ease-out)',
                position: 'relative' as const,
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (!formTitle.trim()) return;
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 28px rgba(37,99,235,0.38), 0 2px 6px rgba(37,99,235,0.20)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,99,235,0.30), 0 1px 3px rgba(37,99,235,0.15)';
              }}
            >
              {submitting ? (
                <div style={{
                  width: 18, height: 18,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }} />
              ) : (
                <PlusOutlined style={{ fontSize: 17 }} />
              )}
              <span>创建并添加到计划</span>
              <span style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, height: '50%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
                borderRadius: '16px 16px 0 0',
                pointerEvents: 'none' as const,
              }} />
            </button>
          </div>
        )}
      </div>

      {/* Inline keyframes for spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Modal>
  );
}
