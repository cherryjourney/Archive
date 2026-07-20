import React, { useState } from 'react';
import type { PackingItem } from '@/types/packing';
import { getCategoryIcon, getCategoryLabel } from '@/types/packing';
import PackingItemRow from './PackingItemRow';

interface Props {
  categoryKey: string;
  items: PackingItem[];
  onToggle: (item: PackingItem) => void;
  onEdit: (item: PackingItem) => void;
  onDelete: (item: PackingItem) => void;
}

/**
 * Collapsible group of packing items by category.
 * Shows icon + label + (packed/total) count.
 */
export default function PackingCategoryGroup({ categoryKey, items, onToggle, onEdit, onDelete }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  if (items.length === 0) return null;

  const packed = items.filter(i => i.is_packed).length;
  const total = items.length;
  const allDone = packed === total;

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 0',
          cursor: 'pointer',
          userSelect: 'none',
          marginBottom: 8,
        }}
      >
        <span style={{
          fontSize: 14,
          transition: 'transform 0.2s',
          transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
        }}>
          ▾
        </span>
        <span style={{ fontSize: 16 }}>{getCategoryIcon(categoryKey)}</span>
        <span style={{
          fontSize: 14,
          fontWeight: 600,
          color: allDone ? '#059669' : 'var(--color-foreground, #1E293B)',
        }}>
          {getCategoryLabel(categoryKey)}
        </span>
        <span style={{
          fontSize: 12,
          color: allDone ? '#10B981' : '#94A3B8',
          fontWeight: 500,
        }}>
          ({packed}/{total}) {allDone ? '✅' : ''}
        </span>
      </div>

      {/* Items */}
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map(item => (
            <PackingItemRow
              key={item.id}
              item={item}
              onToggle={() => onToggle(item)}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
