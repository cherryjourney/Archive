import { useState, useEffect } from 'react';
import { Modal, Input, DatePicker, message } from 'antd';
import dayjs from 'dayjs';
import type { CityNote, CreateCityNoteParams, UpdateCityNoteParams } from '@/types/travel';

const { TextArea } = Input;

interface Props {
  open: boolean;
  note: CityNote | null;      // null = 新建模式
  cityId: string;
  onSave: (params: CreateCityNoteParams | { id: string; params: UpdateCityNoteParams }) => Promise<void>;
  onClose: () => void;
}

export default function CityNoteEditor({ open, note, cityId, onSave, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteDate, setNoteDate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (note) {
        setTitle(note.title);
        setContent(note.content);
        setNoteDate(note.note_date);
      } else {
        setTitle('');
        setContent('');
        setNoteDate(null);
      }
    }
  }, [open, note]);

  const handleSave = async () => {
    if (!title.trim()) {
      message.warning('请输入标题');
      return;
    }
    setSaving(true);
    try {
      if (note) {
        await onSave({ id: note.id, params: { title: title.trim(), content, note_date: noteDate } });
      } else {
        await onSave({ city_id: cityId, title: title.trim(), content, note_date: noteDate });
      }
      onClose();
    } catch (e) {
      message.error('保存失败: ' + String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={note ? '编辑旅记' : '新增旅记'}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={saving}
      okText="保存"
      cancelText="取消"
      width={520}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
        <div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>标题</span>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="如：第三次来大理"
          />
        </div>
        <div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>日期</span>
          <DatePicker
            value={noteDate ? dayjs(noteDate) : null}
            onChange={d => setNoteDate(d ? d.format('YYYY-MM-DD') : null)}
            placeholder="选填"
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>内容</span>
          <TextArea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="记录这次旅行的见闻..."
            rows={6}
          />
        </div>
      </div>
    </Modal>
  );
}
