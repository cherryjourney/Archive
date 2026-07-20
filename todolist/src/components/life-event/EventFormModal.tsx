import { useState, useEffect } from 'react';
import { Modal, Input, Select, InputNumber, Checkbox, message } from 'antd';
import type { CreateLifeEventParams, UpdateLifeEventParams, LifeEventDisplay } from '@/types/lifeEvent';
import { LIFE_EVENT_CATEGORIES, CATEGORY_KEYS } from '@/utils/lifeEventPresets';

const { TextArea } = Input;

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  event?: LifeEventDisplay | null;
  onSave: (params: CreateLifeEventParams | UpdateLifeEventParams, isEdit: boolean) => Promise<void>;
  onCancel: () => void;
}

export default function EventFormModal({ open, mode, event, onSave, onCancel }: Props) {
  const isEdit = mode === 'edit';
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('other');
  const [startYear, setStartYear] = useState<number>(new Date().getFullYear());
  const [startMonth, setStartMonth] = useState<number>(1);
  const [startDay, setStartDay] = useState<number | null>(null);
  const [endYear, setEndYear] = useState<number | null>(null);
  const [endMonth, setEndMonth] = useState<number | null>(null);
  const [endDay, setEndDay] = useState<number | null>(null);
  const [isOngoing, setIsOngoing] = useState(false);
  const [description, setDescription] = useState('');
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear + 10; y >= 1900; y--) years.push(y);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // Populate form when editing
  useEffect(() => {
    if (!event || !open) return;
    const start = event.start_date.split('-');
    setTitle(event.title);
    setCategory(event.category);
    setStartYear(parseInt(start[0]));
    setStartMonth(parseInt(start[1]));
    setStartDay(event.startPrecision === 'day' ? parseInt(start[2]) : null);
    if (event.end_date) {
      const end = event.end_date.split('-');
      setEndYear(parseInt(end[0]));
      setEndMonth(parseInt(end[1]));
      setEndDay(event.endPrecision === 'day' ? parseInt(end[2]) : null);
      setIsOngoing(false);
    } else {
      setEndYear(null); setEndMonth(null); setEndDay(null);
      setIsOngoing(true);
    }
    setDescription(event.description || '');
    setIsHighlighted(event.is_highlighted);
  }, [event, open]);

  // Reset form for create mode
  useEffect(() => {
    if (open && !isEdit) {
      setTitle('');
      setCategory('other');
      setStartYear(currentYear);
      setStartMonth(1);
      setStartDay(null);
      setEndYear(null); setEndMonth(null); setEndDay(null);
      setIsOngoing(false);
      setDescription('');
      setIsHighlighted(false);
    }
  }, [open, isEdit]);

  const pad = (n: number) => String(n).padStart(2, '0');

  const handleSubmit = async () => {
    if (!title.trim()) { message.error('请输入标题'); return; }
    if (!startYear || !startMonth) { message.error('请填写开始年月'); return; }

    setSaving(true);
    try {
      const startDate = `${startYear}-${pad(startMonth)}-${pad(startDay || 1)}`;
      const startPrecision = startDay ? 'day' : 'month';

      let endDate: string | null | undefined;
      let endPrecision: string | undefined;
      if (isOngoing) {
        endDate = isEdit ? '' : null;
        endPrecision = 'month';
      } else if (endYear && endMonth) {
        endDate = `${endYear}-${pad(endMonth)}-${pad(endDay || 1)}`;
        endPrecision = endDay ? 'day' : 'month';
      } else {
        // No end date set and not ongoing → single-day event
        endDate = startDate;
        endPrecision = startPrecision;
      }

      const baseParams: any = {
        title: title.trim(),
        category,
        start_date: startDate,
        start_precision: startPrecision,
        end_date: endDate,
        end_precision: endPrecision || 'month',
        description,
        is_highlighted: isHighlighted,
      };

      await onSave(baseParams, isEdit);
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error('保存失败: ' + String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑人生事件' : '添加人生事件'}
      open={open}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={saving}
      okText="保存"
      cancelText="取消"
      width={480}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
        {/* Title */}
        <div>
          <div style={{ marginBottom: 4, fontSize: 13, fontWeight: 500 }}>标题 *</div>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="如：读研、小学、第一份工作"
          />
        </div>

        {/* Category */}
        <div>
          <div style={{ marginBottom: 4, fontSize: 13, fontWeight: 500 }}>分类 *</div>
          <Select
            value={category}
            onChange={setCategory}
            style={{ width: '100%' }}
            options={CATEGORY_KEYS.map(key => {
              const cat = LIFE_EVENT_CATEGORIES[key];
              return { value: key, label: cat.label };
            })}
          />
        </div>

        {/* Start time */}
        <div>
          <div style={{ marginBottom: 4, fontSize: 13, fontWeight: 500 }}>开始时间 *</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Select
              value={startYear}
              onChange={setStartYear}
              style={{ width: 100 }}
              options={years.slice(0, 80).map(y => ({ value: y, label: `${y}年` }))}
              showSearch
            />
            <Select
              value={startMonth}
              onChange={setStartMonth}
              style={{ width: 72 }}
              options={months.map(m => ({ value: m, label: `${m}月` }))}
            />
            <InputNumber
              value={startDay}
              onChange={v => setStartDay(v)}
              min={1} max={31}
              style={{ width: 64 }}
              placeholder="日"
            />
          </div>
        </div>

        {/* End time */}
        <div>
          <div style={{ marginBottom: 4, fontSize: 13, fontWeight: 500 }}>结束时间</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Select
              value={endYear}
              onChange={(v) => setEndYear(v ?? null)}
              style={{ width: 100 }}
              placeholder="年"
              options={years.slice(0, 80).map(y => ({ value: y, label: `${y}年` }))}
              disabled={isOngoing}
              allowClear
              showSearch
            />
            <Select
              value={endMonth}
              onChange={(v) => setEndMonth(v ?? null)}
              style={{ width: 72 }}
              placeholder="月"
              options={months.map(m => ({ value: m, label: `${m}月` }))}
              disabled={isOngoing}
              allowClear
            />
            <InputNumber
              value={endDay}
              onChange={v => setEndDay(v ?? null)}
              min={1} max={31}
              style={{ width: 64 }}
              placeholder="日"
              disabled={isOngoing}
            />
          </div>
          <Checkbox
            checked={isOngoing}
            onChange={e => setIsOngoing(e.target.checked)}
            style={{ marginTop: 6 }}
          >
            至今
          </Checkbox>
        </div>

        {/* Description */}
        <div>
          <div style={{ marginBottom: 4, fontSize: 13, fontWeight: 500 }}>备注</div>
          <TextArea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="自由描述..."
          />
        </div>

        {/* Highlighted */}
        <Checkbox
          checked={isHighlighted}
          onChange={e => setIsHighlighted(e.target.checked)}
        >
          标记为里程碑 ⭐
        </Checkbox>
      </div>
    </Modal>
  );
}
