import { useEffect } from 'react';
import { Typography } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { useTagStore } from '@/stores/tagStore';

const { Text } = Typography;

interface Props {
  targetType: string;
  targetId: string;
}

const TYPE_LABELS: Record<string, string> = {
  document: '📝', weekly_report: '📖', task: '✅', paper: '📄', project: '📁', experiment: '🧪',
};

export default function Backlinks({ targetType, targetId }: Props) {
  const { backlinks, fetchBacklinks } = useTagStore();

  useEffect(() => {
    fetchBacklinks(targetType, targetId);
  }, [targetType, targetId]);

  const links = backlinks[`${targetType}:${targetId}`] || [];

  if (links.length === 0) return null;

  return (
    <div style={{ marginTop: 16, padding: '12px 16px', background: '#fafbfc', borderRadius: 8, border: '1px solid rgba(0,0,0,0.05)' }}>
      <Text strong style={{ fontSize: 12, color: '#8b85b0', display: 'block', marginBottom: 8 }}>
        <LinkOutlined /> 被以下内容引用 ({links.length})
      </Text>
      {links.map((link) => (
        <div key={link.id} style={{ padding: '4px 0', fontSize: 13, color: '#6b658b' }}>
          <span style={{ marginRight: 6 }}>{TYPE_LABELS[link.source_type] || '📌'}</span>
          {link.link_text || link.source_id}
          <Text type="secondary" style={{ fontSize: 10, marginLeft: 8 }}>
            {link.created_at?.slice(0, 10)}
          </Text>
        </div>
      ))}
    </div>
  );
}
