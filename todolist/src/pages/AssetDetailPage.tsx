import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Typography, Spin, Empty, Modal, message } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { assetService } from '@/services/assetService';
import { useAssetStore } from '@/stores/assetStore';
import AssetFormModal from '@/components/asset/AssetFormModal';
import type { Asset, UpdateAssetParams } from '@/types/asset';
import {
  getCategoryIcon, getCategoryLabel, getStatusLabel, getStatusColor,
  getConditionLabel, getWarrantyDays, getWarrantyColor, formatWarranty,
} from '@/types/asset';

const { Text, Title } = Typography;

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useAssetStore();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      assetService.getAsset(id).then(setAsset).catch(e => {
        message.error('加载失败: ' + String(e));
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const handleEdit = async (params: UpdateAssetParams) => {
    if (!asset) return;
    await store.updateAsset(asset.id, params as any);
    // Refresh detail
    const updated = await assetService.getAsset(asset.id);
    setAsset(updated);
    message.success('已更新');
  };

  const handleDelete = () => {
    if (!asset) return;
    Modal.confirm({
      title: `确定要删除「${asset.name}」吗？`,
      icon: <ExclamationCircleOutlined />,
      content: '删除后不可恢复。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await store.deleteAsset(asset.id);
        message.success('已删除');
        navigate('/assets', { replace: true });
      },
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin />
      </div>
    );
  }

  if (!asset) {
    return <Empty description="物品不存在" />;
  }

  const warrantyDays = getWarrantyDays(asset.warranty_expiry);
  const warrantyColor = getWarrantyColor(warrantyDays);
  const warrantyText = formatWarranty(warrantyDays);
  const statusColor = getStatusColor(asset.status);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/assets')}
          style={{ fontSize: 14, fontWeight: 500 }}
        >
          返回
        </Button>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>编辑</Button>
          <Button icon={<DeleteOutlined />} danger onClick={handleDelete}>删除</Button>
        </div>
      </div>

      {/* Detail Card */}
      <div
        style={{
          background: 'var(--color-surface, #fff)',
          border: '1px solid var(--color-border, #E2E8F0)',
          borderRadius: 16,
          padding: '28px 32px',
        }}
      >
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <span style={{ fontSize: 40 }}>{getCategoryIcon(asset.category)}</span>
          <div style={{ flex: 1 }}>
            <Title level={3} style={{ margin: 0 }}>
              {asset.name}
              {asset.quantity > 1 && (
                <Text type="secondary" style={{ fontSize: 16, fontWeight: 400, marginLeft: 8 }}>
                  ×{asset.quantity}
                </Text>
              )}
            </Title>
            <Text type="secondary">{getCategoryLabel(asset.category)}</Text>
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: statusColor,
              background: `${statusColor}18`,
              padding: '4px 14px',
              borderRadius: 12,
            }}
          >
            {getStatusLabel(asset.status)}
          </span>
        </div>

        {/* Info fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Brand + Model */}
          {(asset.brand || asset.model) && (
            <FieldRow label="品牌/型号" value={[asset.brand, asset.model].filter(Boolean).join(' · ')} />
          )}

          {/* Purchase Date */}
          <FieldRow label="购买日期" value={asset.purchase_date} />

          {/* Price */}
          <FieldRow
            label="价格"
            value={`${asset.currency === 'CNY' ? '¥' : asset.currency + ' '}${asset.price.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
            highlight
          />

          {/* Warranty */}
          <FieldRow
            label="质保到期"
            value={warrantyText || '未设置'}
            valueColor={warrantyColor}
          />

          {/* Status + Condition */}
          <div style={{ display: 'flex', gap: 48 }}>
            <FieldRow label="状态" value={getStatusLabel(asset.status)} />
            <FieldRow label="成色" value={getConditionLabel(asset.condition)} />
          </div>

          {/* Notes */}
          {asset.notes && (
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4, letterSpacing: '0.5px' }}>
                备注
              </Text>
              <Text style={{ fontSize: 14, color: 'var(--color-foreground, #1E293B)', whiteSpace: 'pre-wrap' }}>
                {asset.notes}
              </Text>
            </div>
          )}

          {/* Timestamps */}
          <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--color-border, #E2E8F0)' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              创建于 {asset.created_at} · 最后更新 {asset.updated_at}
            </Text>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AssetFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEdit}
        editAsset={asset}
      />
    </div>
  );
}

/** Simple label-value row */
function FieldRow({ label, value, highlight, valueColor }: {
  label: string;
  value: string;
  highlight?: boolean;
  valueColor?: string;
}) {
  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2, letterSpacing: '0.5px' }}>
        {label}
      </Text>
      <Text
        strong={highlight}
        style={{
          fontSize: 14,
          color: valueColor ?? 'var(--color-foreground, #1E293B)',
        }}
      >
        {value}
      </Text>
    </div>
  );
}
