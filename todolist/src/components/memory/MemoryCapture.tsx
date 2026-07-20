import { useState, useEffect, useRef } from 'react';
import { Modal, Input, App, Button } from 'antd';
import { BulbOutlined, ExpandOutlined, CompressOutlined } from '@ant-design/icons';
import { useMemoryStore } from '@/stores/memoryStore';

const { TextArea } = Input;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function MemoryCapture({ open, onClose }: Props) {
  const { create, saving } = useMemoryStore();
  const { message } = App.useApp();
  const [content, setContent] = useState('');
  const [context, setContext] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const inputRef = useRef<any>(null);

  // Auto-focus when modal opens
  useEffect(() => {
    if (open) {
      setContent('');
      setContext('');
      setFullscreen(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSave = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const mem = await create(trimmed, context.trim());
    if (mem) {
      message.success('记忆已保存');
      setContent('');
      setContext('');
      onClose();
    }
  };

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={saving}
      okText="保存"
      cancelText="取消"
      centered
      closable={false}
      width={fullscreen ? '96vw' : 680}
      style={fullscreen ? { top: 20 } : undefined}
      maskStyle={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      styles={{
        body: { padding: fullscreen ? '32px 40px' : '24px 28px' },
        content: {
          borderRadius: 20,
          background: 'var(--bg-card)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(37,99,235,0.08)',
          ...(fullscreen ? { height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' } as any : {}),
        },
        header: { display: 'none' },
      }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
          <span style={{ fontSize: 20 }}>💭</span> 记录记忆
        </div>
        <Button
          type="text"
          icon={fullscreen ? <CompressOutlined /> : <ExpandOutlined />}
          onClick={() => setFullscreen(!fullscreen)}
          style={{ color: 'var(--text-muted)' }}
        />
      </div>

      <div style={fullscreen ? { flex: 1, display: 'flex', flexDirection: 'column' } as any : {}}>
        <TextArea
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="此刻在想什么？"
          autoSize={fullscreen ? false : { minRows: 5, maxRows: 12 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSave();
            }
          }}
          style={{
            borderRadius: 12,
            fontSize: fullscreen ? 18 : 15,
            marginBottom: 12,
            ...(fullscreen ? {
              flex: 1,
              resize: 'none',
              lineHeight: 1.9,
            } : {}),
          }}
        />

        <Input
          prefix={<BulbOutlined style={{ color: 'var(--text-muted)' }} />}
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="上下文（可选，如当前窗口标题）"
          size="small"
          style={{ borderRadius: 8 }}
        />
      </div>
    </Modal>
  );
}
