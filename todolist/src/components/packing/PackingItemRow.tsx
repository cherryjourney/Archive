import React from 'react';
import type { PackingItem } from '@/types/packing';

interface Props {
  item: PackingItem;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Single packing item row.
 * - Checkbox (44px touch target)
 * - Name (strikethrough + gray when packed)
 * - Quantity badge
 * - Edit/Delete hover icons
 */
export default function PackingItemRow({ item, onToggle, onEdit, onDelete }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 10,
        background: item.is_packed ? 'var(--bg-glass, rgba(255,255,255,0.03))' : 'var(--color-surface, #fff)',
        border: `1px solid ${item.is_packed ? 'transparent' : 'var(--color-border, #E2E8F0)'}`,
        transition: 'all 0.2s ease',
        cursor: 'default',
        minHeight: 48,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#A7F3D0';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = item.is_packed ? 'transparent' : 'var(--color-border, #E2E8F0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Checkbox — 44px touch target */}
      <div
        onClick={onToggle}
        style={{
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          borderRadius: 8,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        role="checkbox"
        aria-checked={item.is_packed}
      >
        <span style={{
          fontSize: 20,
          color: item.is_packed ? '#10B981' : '#CBD5E1',
          transition: 'color 0.15s, transform 0.2s',
          transform: item.is_packed ? 'scale(1.1)' : 'scale(1)',
        }}>
          {item.is_packed ? '☑' : '☐'}
        </span>
      </div>

      {/* Name */}
      <span style={{
        flex: 1,
        fontSize: 14,
        color: item.is_packed ? '#94A3B8' : 'var(--color-foreground, #1E293B)',
        textDecoration: item.is_packed ? 'line-through' : 'none',
        transition: 'color 0.2s, text-decoration 0.2s',
        lineHeight: 1.4,
      }}>
        {item.name}
      </span>

      {/* Quantity badge */}
      {item.quantity > 1 && (
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: item.is_packed ? '#94A3B8' : '#64748B',
          background: item.is_packed ? 'transparent' : '#F1F5F9',
          padding: '2px 8px',
          borderRadius: 10,
          transition: 'color 0.2s',
        }}>
          ×{item.quantity}
        </span>
      )}

      {/* Edit / Delete — visible on hover via CSS */}
      <div style={{ display: 'flex', gap: 4, opacity: 0, transition: 'opacity 0.15s' }}
        className="item-actions"
        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '0'; }}
      >
        <button
          onClick={onEdit}
          style={{
            width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', background: 'transparent',
            cursor: 'pointer', borderRadius: 6,
            fontSize: 13, color: '#94A3B8',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#3B82F6'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
        >
          ✏️
        </button>
        <button
          onClick={onDelete}
          style={{
            width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', background: 'transparent',
            cursor: 'pointer', borderRadius: 6,
            fontSize: 13, color: '#94A3B8',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
        >
          🗑
        </button>
      </div>
    </div>
  );
}
