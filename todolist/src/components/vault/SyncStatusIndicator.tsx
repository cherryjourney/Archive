import { useState } from 'react';
import { Tag, Tooltip, message } from 'antd';
import { CheckCircleOutlined, SyncOutlined, WarningOutlined } from '@ant-design/icons';
import { vaultService } from '@/services/vaultService';
import type { BatchSyncResult } from '@/types/obsidianSync';

interface Props {
  date: string;
}

export default function SyncStatusIndicator({ date }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<BatchSyncResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'synced' | 'conflict' | 'error'>('idle');

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await vaultService.fullBidirectionalSync(date);
      setLastResult(result);
      if (result.conflicts > 0) {
        setStatus('conflict');
        message.warning(`同步完成，${result.conflicts} 个冲突需要处理`);
      } else if (result.errors.length > 0) {
        setStatus('error');
        message.error('同步时有错误');
      } else {
        setStatus('synced');
        message.success(
          `同步完成：推送 ${result.synced_to_obsidian}，拉取 ${result.synced_from_obsidian}`
        );
      }
    } catch (e: any) {
      setStatus('error');
      message.error('同步失败: ' + e);
    } finally {
      setSyncing(false);
    }
  };

  const icon = syncing
    ? <SyncOutlined spin style={{ fontSize: 12 }} />
    : status === 'synced'
      ? <CheckCircleOutlined style={{ fontSize: 12, color: '#059669' }} />
      : status === 'conflict'
        ? <WarningOutlined style={{ fontSize: 12, color: '#F59E0B' }} />
        : <SyncOutlined style={{ fontSize: 12 }} />;

  const label = syncing ? '同步中...' : status === 'synced' ? '已同步' : status === 'conflict' ? '有冲突' : '同步';

  const tooltip = lastResult
    ? `推送: ${lastResult.synced_to_obsidian} | 拉取: ${lastResult.synced_from_obsidian} | 冲突: ${lastResult.conflicts}`
    : '点击手动同步任务状态';

  return (
    <Tooltip title={tooltip}>
      <Tag
        onClick={syncing ? undefined : handleSync}
        style={{
          cursor: syncing ? 'default' : 'pointer',
          borderRadius: 8,
          margin: 0,
          fontSize: 11,
          background: status === 'conflict'
            ? 'rgba(245,158,11,0.10)'
            : status === 'synced'
              ? 'rgba(5,150,105,0.08)'
              : 'rgba(37,99,235,0.06)',
          border: status === 'conflict'
            ? '1px solid rgba(245,158,11,0.25)'
            : status === 'synced'
              ? '1px solid rgba(5,150,105,0.20)'
              : '1px solid rgba(37,99,235,0.15)',
          color: status === 'conflict' ? '#D97706' : status === 'synced' ? '#059669' : '#2563EB',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {icon}
        {label}
      </Tag>
    </Tooltip>
  );
}
