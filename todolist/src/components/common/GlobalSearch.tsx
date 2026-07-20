import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Tag, Empty } from 'antd';
import { SearchOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import { useDebounce } from '@/hooks/useDebounce';
interface SearchHit {
  id: string;
  title: string;
  item_type: string;
}

interface SearchResult {
  tasks: SearchHit[];
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({ tasks: [] });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 250);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ tasks: [] });
      return;
    }
    setLoading(true);
    invoke<SearchResult>('global_search', { query: debouncedQuery })
      .then(setResults)
      .catch(() => setResults({ tasks: [] }))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (hit: SearchHit) => {
    setOpen(false);
    setQuery('');
    if (hit.item_type === 'task') navigate(`/plan`);
  };

  return (
    <div ref={ref} style={{ position: 'relative', padding: '0 10px', marginBottom: 8 }}>
      <Input
        prefix={<SearchOutlined style={{ color: '#a49ebf' }} />}
        placeholder="搜索任务..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        allowClear
        style={{ borderRadius: 10, fontSize: 13 }}
      />

      {open && debouncedQuery && (
        <div style={{
          position: 'absolute', top: 40, left: 10, right: 10, zIndex: 1000,
          background: 'rgba(255,255,255,0.98)', borderRadius: 14,
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.06)',
          maxHeight: 340, overflow: 'auto',
        }}>
          {loading && <div style={{ padding: 14, color: '#a49ebf', textAlign: 'center' }}>搜索中...</div>}
          {!loading && results.tasks.length === 0 && (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未找到结果" style={{ padding: 20 }} />
          )}

          {results.tasks.length > 0 && (
            <div>
              <div style={{ padding: '6px 14px', fontSize: 11, color: '#a49ebf', fontWeight: 600 }}>
                📋 任务 ({results.tasks.length})
              </div>
              {results.tasks.slice(0, 5).map(hit => (
                <div key={hit.id} onClick={() => handleSelect(hit)} style={{
                  padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(108,92,231,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <UnorderedListOutlined style={{ color: '#6c5ce7' }} />
                  <span style={{ flex: 1, fontSize: 13 }}>{hit.title}</span>
                  <Tag style={{ borderRadius: 4, fontSize: 10, margin: 0 }}>任务</Tag>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
