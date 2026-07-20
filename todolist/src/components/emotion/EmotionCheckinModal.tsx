import { useState, useEffect } from 'react';
import { Modal, Slider, Input, Typography, Button, message } from 'antd';
import { useEmotionStore } from '@/stores/emotionStore';

const { Text } = Typography;
const { TextArea } = Input;

const EMOJI_OPTIONS = [
  { emoji: '😊', label: '开心' },
  { emoji: '😐', label: '平静' },
  { emoji: '😢', label: '难过' },
  { emoji: '😤', label: '焦虑' },
  { emoji: '🤩', label: '兴奋' },
  { emoji: '😴', label: '疲惫' },
  { emoji: '😡', label: '烦躁' },
  { emoji: '🥰', label: '满足' },
  { emoji: '🤔', label: '沉思' },
  { emoji: '😎', label: '自信' },
  { emoji: '🙃', label: '无奈' },
  { emoji: '🥺', label: '感动' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function EmotionCheckinModal({ open, onClose }: Props) {
  const { todayEntry, saveToday } = useEmotionStore();
  const [emojis, setEmojis] = useState<string[]>(['', '', '', '', '']);
  const [controlScore, setControlScore] = useState(50);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && todayEntry) {
      setEmojis([
        todayEntry.emoji_1 || '',
        todayEntry.emoji_2 || '',
        todayEntry.emoji_3 || '',
        todayEntry.emoji_4 || '',
        todayEntry.emoji_5 || '',
      ]);
      setControlScore(todayEntry.control_score || 50);
      setNotes(todayEntry.notes || '');
    }
  }, [open, todayEntry]);

  const handleEmojiClick = (slotIndex: number, emoji: string) => {
    setEmojis((prev) => {
      const next = [...prev];
      // Toggle off if same emoji clicked
      next[slotIndex] = next[slotIndex] === emoji ? '' : emoji;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveToday({
        emoji_1: emojis[0],
        emoji_2: emojis[1],
        emoji_3: emojis[2],
        emoji_4: emojis[3],
        emoji_5: emojis[4],
        control_score: controlScore,
        notes: notes.slice(0, 140),
        weather: '',
        task_completed_count: 0,
      });
      message.success('情绪已记录 ✨');
      onClose();
    } catch (e) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
      closable={false}
      maskStyle={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      styles={{
        body: { padding: '28px 32px' },
        content: {
          borderRadius: 20,
          background: 'var(--bg-card)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(37,99,235,0.08)',
        },
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, margin: '0 auto 12px',
          background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26,
        }}>
          🧠
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
          今日科研情绪
        </div>
        <Text style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          用5个表情记录今天的心情吧
        </Text>
      </div>

      {/* 5 emoji slots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
        {emojis.map((selected, idx) => (
          <div key={idx} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
              #{idx + 1}
            </div>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
              background: selected ? 'linear-gradient(135deg, #EDE9FE, #C4B5FD)' : 'var(--color-fill)',
              border: selected ? '2px solid #8B5CF6' : '2px dashed var(--border-default)',
              transition: 'all 0.2s ease',
            }}>
              {selected || '❓'}
            </div>
          </div>
        ))}
      </div>

      {/* Emoji picker grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8,
        marginBottom: 24, padding: '12px', borderRadius: 14,
        background: 'var(--color-fill)',
      }}>
        {EMOJI_OPTIONS.map((opt) => (
          <div
            key={opt.emoji}
            onClick={() => {
              // Pick first empty slot
              const emptyIdx = emojis.findIndex((e) => !e);
              if (emptyIdx >= 0) {
                handleEmojiClick(emptyIdx, opt.emoji);
              } else {
                // Replace last slot
                handleEmojiClick(4, opt.emoji);
              }
            }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '6px 4px', borderRadius: 10, cursor: 'pointer',
              background: emojis.some((e) => e === opt.emoji)
                ? 'rgba(139,92,246,0.12)' : 'transparent',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: 22 }}>{opt.emoji}</span>
            <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{opt.label}</span>
          </div>
        ))}
      </div>

      {/* Control score slider */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 13, color: 'var(--text-secondary)' }}>🎮 掌控感</Text>
          <Text style={{ fontSize: 13, fontWeight: 600, color: '#8B5CF6' }}>{controlScore}</Text>
        </div>
        <Slider
          min={0} max={100} value={controlScore}
          onChange={setControlScore}
          styles={{
            track: { background: 'linear-gradient(90deg, #C4B5FD, #8B5CF6)' },
            handle: { borderColor: '#8B5CF6' },
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 10, color: 'var(--text-muted)' }}>完全失控</Text>
          <Text style={{ fontSize: 10, color: 'var(--text-muted)' }}>尽在掌控</Text>
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 24 }}>
        <TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="写点什么吧…（最多140字）"
          maxLength={140}
          rows={2}
          style={{ borderRadius: 12 }}
        />
        <Text style={{ fontSize: 10, color: 'var(--text-muted)', float: 'right', marginTop: 2 }}>
          {notes.length}/140
        </Text>
      </div>

      <Button
        block
        type="primary"
        size="large"
        loading={saving}
        onClick={handleSave}
        style={{
          height: 46, borderRadius: 12, fontWeight: 600, fontSize: 15,
          background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', border: 'none',
        }}
      >
        记录情绪
      </Button>
    </Modal>
  );
}
