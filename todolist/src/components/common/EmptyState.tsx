import { Typography } from 'antd';

const { Text } = Typography;

interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon = '📭',
  title = '暂无内容',
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-float" style={{ fontSize: 48, marginBottom: 16, lineHeight: 1 }}>
        {icon}
      </div>
      <Text strong style={{ fontSize: 15, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>
        {title}
      </Text>
      {description && (
        <Text style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 280 }}>
          {description}
        </Text>
      )}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}
