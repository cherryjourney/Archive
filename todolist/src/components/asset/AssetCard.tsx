import React from 'react';
import type { Asset } from '@/types/asset';
import { getCategoryIcon, getStatusColor, getStatusLabel, getWarrantyDays, getWarrantyColor, formatWarranty } from '@/types/asset';

interface Props {
  asset: Asset;
  onClick: () => void;
}

/**
 * Compact asset card for 4-column grid.
 * Shows: category icon + name + price + purchase date + status + warranty countdown.
 */
export default function AssetCard({ asset, onClick }: Props) {
  const warrantyDays = getWarrantyDays(asset.warranty_expiry);
  const warrantyColor = getWarrantyColor(warrantyDays);
  const warrantyText = formatWarranty(warrantyDays);
  const statusColor = getStatusColor(asset.status);

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--color-surface, #fff)',
        border: '1px solid var(--color-border, #E2E8F0)',
        borderRadius: 12,
        padding: '16px 18px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minHeight: 150,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#818CF8';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.1)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--color-border, #E2E8F0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Top row: category icon + status badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 28 }}>{getCategoryIcon(asset.category)}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: statusColor,
            background: `${statusColor}18`,
            padding: '2px 10px',
            borderRadius: 10,
            letterSpacing: '0.3px',
          }}
        >
          {getStatusLabel(asset.status)}
        </span>
      </div>

      {/* Name */}
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--color-foreground, #1E293B)',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {asset.name}
        {asset.quantity > 1 && (
          <span style={{ fontSize: 12, fontWeight: 400, color: '#94A3B8', marginLeft: 6 }}>
            ×{asset.quantity}
          </span>
        )}
      </div>

      {/* Bottom info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 'auto' }}>
        {/* Price + Date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#EF4444' }}>
            ¥{asset.price.toLocaleString('zh-CN')}
          </span>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>
            {asset.purchase_date}
          </span>
        </div>

        {/* Warranty countdown */}
        {warrantyText && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: warrantyColor,
              marginTop: 2,
            }}
          >
            🛡️ {warrantyText}
          </div>
        )}
      </div>
    </div>
  );
}
