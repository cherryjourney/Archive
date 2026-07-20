import { useState, useEffect } from 'react';
import { Typography, Empty, Spin, Tag, Tooltip } from 'antd';
import {
  NodeIndexOutlined, LinkOutlined, BookOutlined,
  FileTextOutlined, LoadingOutlined,
} from '@ant-design/icons';
import { knowledgeGraphService } from '@/services/knowledgeGraphService';
import { vaultService } from '@/services/vaultService';
import type { KnowledgeContext, GraphNodeData } from '@/types/knowledgeGraph';

const { Text } = Typography;

interface Props {
  taskId: string;
}

/** Extract vault name from path */
function vaultName(path: string): string {
  const parts = path.replace(/\\/g, '/').replace(/\/$/, '').split('/');
  return parts[parts.length - 1] || 'vault';
}

export default function KnowledgeGraphPanel({ taskId }: Props) {
  const [context, setContext] = useState<KnowledgeContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [vaultPath, setVaultPath] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    vaultService.getVaultConfig()
      .then(cfg => setVaultPath(cfg.vault_path))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!taskId || !vaultPath) return;
    setLoading(true);
    setError('');
    knowledgeGraphService
      .getTaskKnowledgeContext(taskId)
      .then(setContext)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [taskId, vaultPath]);

  const handleOpen = (notePath: string) => {
    if (!vaultPath) return;
    const name = vaultName(vaultPath);
    const uri = `obsidian://open?vault=${encodeURIComponent(name)}&file=${encodeURIComponent(notePath)}`;
    window.open(uri, '_blank');
  };

  if (!vaultPath) {
    return (
      <div style={{ padding: 16, textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          请先在设置中连接 Obsidian Vault
        </Text>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 20 }} />} />
        <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
          构建知识图谱...
        </Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 16, textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {error.includes('Vault') ? '请先配置 Vault 路径' : '图谱加载失败'}
        </Text>
      </div>
    );
  }

  if (!context) return null;

  const { graph_neighbors, suggested_reading } = context;

  if (graph_neighbors.length === 0) {
    return (
      <div style={{ padding: 16 }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              图谱中暂无关联节点
            </Text>
          }
          style={{ margin: 0 }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Neighbor nodes */}
      <div>
        <Text style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
          <NodeIndexOutlined style={{ color: '#7c3aed' }} />
          图谱邻居 ({graph_neighbors.length})
        </Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {graph_neighbors.slice(0, 10).map((node) => (
            <div
              key={node.path}
              onClick={() => handleOpen(node.path)}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                background: 'rgba(124,58,237,0.03)',
                border: '1px solid rgba(124,58,237,0.08)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s var(--ease-out)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(124,58,237,0.07)';
                e.currentTarget.style.borderColor = 'rgba(124,58,237,0.20)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(124,58,237,0.03)';
                e.currentTarget.style.borderColor = 'rgba(124,58,237,0.08)';
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FileTextOutlined style={{ color: '#7c3aed', fontSize: 11 }} />
                  <Text
                    ellipsis
                    style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}
                  >
                    {node.title}
                  </Text>
                </div>
                <Text type="secondary" style={{ fontSize: 10, marginLeft: 16 }}>
                  {node.path}
                  {node.degree > 0 && ` · ${node.degree} 连接`}
                </Text>
              </div>
              <Tooltip title={`${node.inlink_count} 入链 · ${node.outlink_count} 出链`}>
                <Tag
                  style={{
                    borderRadius: 4, fontSize: 10, margin: 0, flexShrink: 0,
                    background: 'rgba(124,58,237,0.10)', border: 'none', color: '#7c3aed',
                  }}
                >
                  <LinkOutlined style={{ fontSize: 9, marginRight: 2 }} />
                  {node.degree}
                </Tag>
              </Tooltip>
            </div>
          ))}
          {graph_neighbors.length > 10 && (
            <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
              ...还有 {graph_neighbors.length - 10} 个关联节点
            </Text>
          )}
        </div>
      </div>

      {/* Suggested reading */}
      {suggested_reading.length > 0 && (
        <div>
          <Text style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <BookOutlined style={{ color: '#059669' }} />
            推荐阅读 ({suggested_reading.length})
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {suggested_reading.map((path) => (
              <div
                key={path}
                onClick={() => handleOpen(path)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 8,
                  background: 'rgba(5,150,105,0.03)',
                  border: '1px solid rgba(5,150,105,0.08)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s var(--ease-out)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(5,150,105,0.07)';
                  e.currentTarget.style.borderColor = 'rgba(5,150,105,0.20)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(5,150,105,0.03)';
                  e.currentTarget.style.borderColor = 'rgba(5,150,105,0.08)';
                }}
              >
                <FileTextOutlined style={{ color: '#059669', fontSize: 11 }} />
                <Text ellipsis style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {path}
                </Text>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
