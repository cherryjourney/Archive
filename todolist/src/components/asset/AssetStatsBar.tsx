import React from 'react';
import { Typography } from 'antd';
import { DollarOutlined, AppstoreOutlined } from '@ant-design/icons';
import type { AssetStats } from '@/types/asset';

const { Text } = Typography;

interface Props {
  stats: AssetStats;
}

/**
 * Top statistics bar showing total value and item count.
 */
export default function AssetStatsBar({ stats }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 32,
        padding: '16px 24px',
        borderRadius: 14,
        background: 'var(--color-surface, #fff)',
        border: '1px solid var(--color-border, #E2E8F0)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #10B981, #34D399)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}
        >
          <DollarOutlined style={{ color: '#fff' }} />
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 11, display: 'block', letterSpacing: '0.5px' }}>
            总价值
          </Text>
          <Text strong style={{ fontSize: 20, color: 'var(--color-foreground, #1E293B)' }}>
            ¥{stats.total_value.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </Text>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #6366F1, #818CF8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}
        >
          <AppstoreOutlined style={{ color: '#fff' }} />
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 11, display: 'block', letterSpacing: '0.5px' }}>
            物品总数
          </Text>
          <Text strong style={{ fontSize: 20, color: 'var(--color-foreground, #1E293B)' }}>
            {stats.total_count} 件
          </Text>
        </div>
      </div>
    </div>
  );
}
