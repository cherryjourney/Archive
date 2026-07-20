import { useState } from 'react';
import { Rate } from 'antd';

interface Props {
  value?: number | null;
  onChange?: (value: number) => void;
  disabled?: boolean;
}

const labels: Record<number, string> = {
  1: '还需努力',
  2: '有待提高',
  3: '中规中矩',
  4: '效率不错',
  5: '非常高效',
};

export default function StarRating({ value, onChange, disabled }: Props) {
  const [hoverValue, setHoverValue] = useState(0);
  const displayValue = hoverValue || value || 0;

  return (
    <span>
      <Rate
        value={value || 0}
        onChange={onChange}
        disabled={disabled}
        onHoverChange={setHoverValue}
        style={{ color: '#ffd43b', fontSize: 28 }}
      />
      {displayValue > 0 && (
        <span style={{ marginLeft: 12, color: '#868e96', fontSize: 14 }}>
          {labels[displayValue]}
        </span>
      )}
    </span>
  );
}
