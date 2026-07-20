import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Select, Input, Empty, Spin, message, Typography } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useAssetStore } from '@/stores/assetStore';
import AssetCard from '@/components/asset/AssetCard';
import AssetStatsBar from '@/components/asset/AssetStatsBar';
import AssetFormModal from '@/components/asset/AssetFormModal';
import type { CreateAssetParams, UpdateAssetParams } from '@/types/asset';
import { ASSET_CATEGORIES, ASSET_STATUSES } from '@/types/asset';

const { Text } = Typography;

export default function AssetsPage() {
  const navigate = useNavigate();
  const store = useAssetStore();

  const [filters, setFilters] = useState({ category: '', status: '', search: '', sort_by: 'purchase_date', sort_dir: 'DESC' });
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    store.fetchAssets(filters);
    store.fetchStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilter = (key: string, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    store.fetchAssets(next);
  };

  const handleCreate = async (params: CreateAssetParams | UpdateAssetParams) => {
    await store.createAsset(params as CreateAssetParams);
    message.success('已添加');
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--color-foreground, #1E293B)' }}>
            📦 物品管理
          </h1>
          <Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: 'block' }}>
            记录个人物品，跟踪质保，统计价值
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)} size="large">
          添加物品
        </Button>
      </div>

      {/* Stats bar */}
      <div style={{ marginBottom: 20 }}>
        <AssetStatsBar stats={store.stats} />
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: '12px 16px',
          borderRadius: 12,
          background: 'var(--color-surface, #fff)',
          border: '1px solid var(--color-border, #E2E8F0)',
          marginBottom: 20,
        }}
      >
        <Select
          value={filters.category || undefined}
          onChange={v => handleFilter('category', v ?? '')}
          placeholder="全部分类"
          allowClear
          style={{ width: 140 }}
          options={ASSET_CATEGORIES.map(c => ({ value: c.key, label: `${c.icon} ${c.label}` }))}
        />
        <Select
          value={filters.status || undefined}
          onChange={v => handleFilter('status', v ?? '')}
          placeholder="全部状态"
          allowClear
          style={{ width: 120 }}
          options={ASSET_STATUSES.map(s => ({ value: s.key, label: s.label }))}
        />
        <Select
          value={filters.sort_by}
          onChange={v => handleFilter('sort_by', v)}
          style={{ width: 120 }}
          options={[
            { value: 'purchase_date', label: '按购买日期' },
            { value: 'price', label: '按价格' },
            { value: 'name', label: '按名称' },
          ]}
        />
        <Select
          value={filters.sort_dir}
          onChange={v => handleFilter('sort_dir', v)}
          style={{ width: 90 }}
          options={[
            { value: 'DESC', label: '降序' },
            { value: 'ASC', label: '升序' },
          ]}
        />
        <Input
          value={filters.search}
          onChange={e => handleFilter('search', e.target.value)}
          placeholder="搜索物品..."
          prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
          style={{ flex: 1, minWidth: 180 }}
          allowClear
        />
      </div>

      {/* Grid */}
      {store.loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Spin />
        </div>
      ) : store.assets.length === 0 ? (
        <Empty description={store.error ? `加载失败: ${store.error}` : '还没有物品，点击上方按钮添加'} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 14,
          }}
        >
          {store.assets.map(asset => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onClick={() => navigate(`/assets/${asset.id}`)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AssetFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
