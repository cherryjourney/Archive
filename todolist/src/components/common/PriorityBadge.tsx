import { Tag } from 'antd';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/types/task';

interface Props {
  priority: number;
  size?: 'small' | 'default';
}

export default function PriorityBadge({ priority, size = 'default' }: Props) {
  return (
    <Tag
      color={PRIORITY_COLORS[priority] || '#868E96'}
      style={{
        fontSize: size === 'small' ? 12 : 13,
        margin: 0,
        borderRadius: 4,
        fontWeight: 500,
      }}
    >
      {PRIORITY_LABELS[priority] || `P${priority}`}
    </Tag>
  );
}
