import React from 'react';

interface Props {
  packed: number;
  total: number;
}

/**
 * Progress bar for packing checklist.
 * Shows percentage + animated bar. Turns green at 100%.
 */
export default function PackingProgress({ packed, total }: Props) {
  const pct = total > 0 ? Math.round((packed / total) * 100) : 0;
  const done = pct === 100;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
      {/* Bar */}
      <div style={{
        flex: 1,
        height: 8,
        borderRadius: 4,
        background: 'var(--color-border, #E2E8F0)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 4,
          background: done
            ? 'linear-gradient(90deg, #10B981, #34D399)'
            : 'linear-gradient(90deg, #10B981, #6EE7B7)',
          transition: 'width 0.3s ease-out',
        }} />
      </div>

      {/* Label */}
      <span style={{
        fontSize: 13,
        fontWeight: 600,
        color: done ? '#059669' : 'var(--color-muted, #64748B)',
        whiteSpace: 'nowrap',
        minWidth: 60,
        textAlign: 'right',
      }}>
        {done ? '✅ 完成' : `${packed}/${total}`}
      </span>
    </div>
  );
}
