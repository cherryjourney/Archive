import { useState, useRef, useEffect, useCallback } from 'react';
import { Tag } from 'antd';
import { EditOutlined } from '@ant-design/icons';

interface Props {
  value: string;
  onChange: (binding: string) => void;
}

function keyCodeToLabel(e: React.KeyboardEvent): string | null {
  const { key, code } = e;
  // Ignore modifier-only presses
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) return null;
  // Map common keys
  const keyMap: Record<string, string> = {
    ' ': 'Space',
    'ArrowUp': 'Up', 'ArrowDown': 'Down', 'ArrowLeft': 'Left', 'ArrowRight': 'Right',
  };
  let label = keyMap[key] || key;
  if (code?.startsWith('Digit') && code.length === 6) {
    label = code[5]; // Digit0-9 → 0-9
  }
  if (code?.startsWith('Key') && code.length === 4) {
    label = code[3]; // KeyA-KeyZ → A-Z
  }
  if (code?.startsWith('F') && /^F\d+$/.test(code)) {
    label = code;
  }
  if (label.length === 1) label = label.toUpperCase();
  return label;
}

export default function ShortcutKeyCapture({ value, onChange }: Props) {
  const [capturing, setCapturing] = useState(false);
  const [preview, setPreview] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const label = keyCodeToLabel(e);
      if (!label) return;
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
      if (e.shiftKey) parts.push('Shift');
      if (e.altKey) parts.push('Alt');
      parts.push(label);
      const binding = parts.join('+');
      if (parts.length >= 2) {
        setCapturing(false);
        onChange(binding);
      } else {
        setPreview(binding);
      }
    },
    [onChange],
  );

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    // If only modifiers were pressed, clear preview
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
      setPreview('');
    }
  }, []);

  useEffect(() => {
    if (capturing) {
      ref.current?.focus();
    }
  }, [capturing]);

  if (capturing) {
    return (
      <Tag
        ref={ref}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={() => { setCapturing(false); setPreview(''); }}
        style={{
          borderRadius: 10, fontSize: 15, padding: '8px 20px', cursor: 'text',
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
          color: '#EA580C', border: '1px solid rgba(234,88,12,0.3)',
          fontWeight: 700, letterSpacing: 1, outline: 'none',
          animation: 'pulseGlow 1.2s ease-in-out infinite',
        }}
      >
        {preview || '按下快捷键...'}
      </Tag>
    );
  }

  return (
    <Tag
      onClick={() => setCapturing(true)}
      style={{
        borderRadius: 10, fontSize: 15, padding: '8px 20px', cursor: 'pointer',
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
        color: '#2563EB', border: '1px solid rgba(37,99,235,0.25)',
        fontWeight: 700, letterSpacing: 1,
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, #DBEAFE, #BFDBFE)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, #EFF6FF, #DBEAFE)';
      }}
    >
      {value} <EditOutlined style={{ marginLeft: 6, fontSize: 12, opacity: 0.5 }} />
    </Tag>
  );
}
