import { useState, useEffect } from 'react';
import { Typography, Empty, Spin, Tag, Tooltip } from 'antd';
import { FileTextOutlined, LinkOutlined, LoadingOutlined, NodeIndexOutlined } from '@ant-design/icons';
import { vaultService } from '@/services/vaultService';
import KnowledgeGraphPanel from '@/components/vault/KnowledgeGraphPanel';
import type { VaultNote } from '@/types/vault';

const { Text } = Typography;

interface Props {
  /** Tag names from the current task */
  tags: string[];
  /** Vault path for opening notes. Auto-detected if not provided. */
  vaultPath?: string;
  /** When provided, enables knowledge graph tab */
  taskId?: string;
}

/** Extract vault name from path like "D:/MyNote/MyNote" → "MyNote" */
function vaultName(path: string): string {
  const parts = path.replace(/\\/g, '/').replace(/\/$/, '').split('/');
  return parts[parts.length - 1] || 'vault';
}

export default function BacklinkPanel({ tags, vaultPath: propVaultPath, taskId }: Props) {
  const [notes, setNotes] = useState<VaultNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [vaultPath, setVaultPath] = useState(propVaultPath || '');
  const [activeTab, setActiveTab] = useState<'tags' | 'graph'>('tags');

  // Fetch vault config if not provided via props
  useEffect(() => {
    if (propVaultPath) {
      setVaultPath(propVaultPath);
    } else {
      vaultService.getVaultConfig()
        .then(cfg => setVaultPath(cfg.vault_path))
        .catch(() => setVaultPath(''));
    }
  }, [propVaultPath]);

  useEffect(() => {
    if (!tags.length || !vaultPath) {
      setNotes([]);
      return;
    }

    setLoading(true);
    vaultService
      .findRelatedNotes(tags)
      .then(setNotes)
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, [tags.join(','), vaultPath]);

  const handleOpen = (notePath: string) => {
    if (!vaultPath) return;
    const name = vaultName(vaultPath);
    const encodedPath = encodeURIComponent(notePath);
    const uri = `obsidian://open?vault=${encodeURIComponent(name)}&file=${encodedPath}`;
    window.open(uri, '_blank');
  };

  const hasTabs = !!taskId;

  // ── Tab bar ──
  const renderTabs = () => {
    if (!hasTabs) return null;
    return (
      <div style={{
        display: 'flex',
        gap: 0,
        marginBottom: 10,
        background: 'var(--bg-glass)',
        borderRadius: 8,
        padding: 3,
        border: '1px solid var(--border-subtle)',
      }}>
        {([
          { key: 'tags' as const, label: '标签匹配', icon: '🏷️' },
          { key: 'graph' as const, label: '图谱关联', icon: '🔗' },
        ]).map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                height: 32,
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                background: isActive ? 'rgba(124,58,237,0.10)' : 'transparent',
                color: isActive ? '#7c3aed' : 'var(--text-muted)',
                transition: 'all 0.15s var(--ease-out)',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>
    );
  };

  // ── Content ──
  if (!vaultPath) {
    return (
      <div style={{ padding: '8px 0' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          在设置中连接 Obsidian Vault 以查看关联笔记
        </Text>
      </div>
    );
  }

  return (
    <div>
      {renderTabs()}

      {/* Tag-matched notes tab */}
      {(activeTab === 'tags' || !hasTabs) && (
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 16 }}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 18 }} />} />
              <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                查找关联笔记...
              </Text>
            </div>
          ) : !tags.length ? (
            <div style={{ padding: '8px 0' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                添加标签后查找 Obsidian 关联笔记
              </Text>
            </div>
          ) : notes.length === 0 ? (
            <div style={{ padding: '8px 0' }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="未找到关联笔记"
                style={{ margin: 0 }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {!hasTabs && (
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>
                  📓 Obsidian 关联笔记 ({notes.length})
                </Text>
              )}
              {notes.slice(0, 8).map((note) => {
                const matchCount = note.tags.filter((t) => tags.includes(t)).length;
                return (
                  <div
                    key={note.path}
                    onClick={() => handleOpen(note.path)}
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
                      e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)';
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
                          style={{ fontSize: 12, fontWeight: 500, color: '#1e1b4b' }}
                        >
                          {note.title}
                        </Text>
                      </div>
                      <Text
                        type="secondary"
                        style={{ fontSize: 10, display: 'block', marginLeft: 16 }}
                      >
                        {note.path}
                      </Text>
                    </div>
                    <Tooltip title={`${matchCount} 个公共标签：${note.tags.filter((t) => tags.includes(t)).join(', ')}`}>
                      <Tag
                        style={{
                          borderRadius: 4,
                          fontSize: 10,
                          margin: 0,
                          flexShrink: 0,
                          background: 'rgba(124,58,237,0.1)',
                          border: 'none',
                          color: '#7c3aed',
                        }}
                      >
                        {matchCount} 匹配
                      </Tag>
                    </Tooltip>
                  </div>
                );
              })}
              {notes.length > 8 && (
                <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                  ...还有 {notes.length - 8} 篇笔记
                </Text>
              )}
            </div>
          )}
        </>
      )}

      {/* Knowledge graph tab */}
      {hasTabs && activeTab === 'graph' && (
        <KnowledgeGraphPanel taskId={taskId!} />
      )}
    </div>
  );
}
