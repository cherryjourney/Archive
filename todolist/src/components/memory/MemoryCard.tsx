import { Typography, Popconfirm } from 'antd';
import { DeleteOutlined, SwapOutlined } from '@ant-design/icons';
import type { Memory } from '@/types/memory';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

// Pastel card colors — rotate through them
const CARD_COLORS = [
  { bg: '#EFF6FF', border: '#BFDBFE' },
  { bg: '#F5F3FF', border: '#DDD6FE' },
  { bg: '#FFF7ED', border: '#FED7AA' },
  { bg: '#F0FDF4', border: '#BBF7D0' },
  { bg: '#FDF2F8', border: '#FBCFE8' },
  { bg: '#ECFEFF', border: '#A5F3FC' },
];

interface Props {
  memory: Memory;
  index: number;
  onDelete: (id: string) => void;
}

export default function MemoryCard({ memory, index, onDelete }: Props) {
  const color = CARD_COLORS[index % CARD_COLORS.length];

  return (
    <div
      style={{
        background: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: 14,
        padding: '16px 18px',
        breakInside: 'avoid',
        marginBottom: 12,
        position: 'relative',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      className="memory-card"
    >
      <Paragraph
        style={{
          fontSize: 14,
          color: 'var(--text-primary)',
          marginBottom: 10,
          whiteSpace: 'pre-wrap',
          lineHeight: 1.7,
        }}
      >
        {memory.content}
      </Paragraph>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {memory.context && (
            <Text
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                background: 'rgba(0,0,0,0.06)',
                borderRadius: 6,
                padding: '1px 8px',
                maxWidth: 180,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <SwapOutlined style={{ marginRight: 3, fontSize: 10 }} />
              {memory.context}
            </Text>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {dayjs(memory.created_at).format('MM-DD HH:mm')}
          </Text>
          <Popconfirm
            title="删除这条记忆？"
            onConfirm={() => onDelete(memory.id)}
            okText="删除"
            cancelText="取消"
          >
            <DeleteOutlined
              style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}
            />
          </Popconfirm>
        </div>
      </div>
    </div>
  );
}
