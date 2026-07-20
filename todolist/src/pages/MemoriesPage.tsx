import { useEffect, useState, useMemo } from 'react';
import { Typography, Button, Empty, Spin, Input } from 'antd';
import { PlusOutlined, BulbOutlined, SearchOutlined } from '@ant-design/icons';
import { useMemoryStore } from '@/stores/memoryStore';
import MemoryCard from '@/components/memory/MemoryCard';
import MemoryCapture from '@/components/memory/MemoryCapture';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function MemoriesPage() {
  const { memories, loading, fetchAll, remove } = useMemoryStore();
  const [captureOpen, setCaptureOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Filter by search
  const filtered = useMemo(() => {
    if (!search.trim()) return memories;
    const q = search.toLowerCase();
    return memories.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        m.context.toLowerCase().includes(q) ||
        m.date.includes(q),
    );
  }, [memories, search]);

  // Group by date
  const grouped = filtered.reduce<Record<string, typeof memories>>((acc, m) => {
    (acc[m.date] ||= []).push(m);
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16 }}>
        <Title level={3} style={{ color: 'var(--text-primary)', margin: 0, fontWeight: 700, flexShrink: 0 }}>
          <BulbOutlined style={{ marginRight: 8, color: '#8B5CF6' }} />
          记忆
        </Title>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
          <Input
            prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
            placeholder="搜索记忆内容..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 220, borderRadius: 10 }}
            allowClear
            size="small"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCaptureOpen(true)}
            style={{ borderRadius: 10, fontWeight: 600 }}
          >
            记录此刻
          </Button>
        </div>
      </div>

      {loading && memories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : filtered.length === 0 ? (
        <Empty
          description={search ? '没有匹配的记忆' : '还没有记忆，记录你的第一个想法吧'}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ marginTop: 80 }}
        >
          {!search && (
            <Button type="primary" onClick={() => setCaptureOpen(true)}>
              记录此刻
            </Button>
          )}
        </Empty>
      ) : (
        <div>
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date} style={{ marginBottom: 28 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
                paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)',
              }}>
                <Text strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                  {dayjs(date).format('YYYY年M月D日 dddd')}
                </Text>
                <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {items.length} 条记忆
                </Text>
              </div>

              {/* Waterfall grid */}
              <div style={{
                columnCount: 3,
                columnGap: 12,
              }}>
                {items.map((m, i) => (
                  <MemoryCard
                    key={m.id}
                    memory={m}
                    index={i}
                    onDelete={(id) => remove(id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <MemoryCapture open={captureOpen} onClose={() => { setCaptureOpen(false); fetchAll(); }} />
    </div>
  );
}
