import React, { useState } from 'react';
import { Modal, Typography, Divider, Tag, Button, Space } from 'antd';
import { LinkOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { LifeEventDisplay, LifeEventLink, LifeEventStats } from '@/types/lifeEvent';
import { formatDate } from '@/utils/lifeEventPresets';

interface Props {
  open: boolean;
  event: LifeEventDisplay | null;
  links: LifeEventLink[];
  stats: LifeEventStats | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddLink: () => void;
  onRemoveLink: (id: string) => void;
}

const ENTITY_LABELS: Record<string, string> = {
  task: '任务', paper: '论文', experiment: '实验', countdown: '倒数日',
  city: '城市', asset: '物品',
};

export default function EventDetailModal({
  open, event, links, stats, onClose, onEdit, onDelete, onAddLink, onRemoveLink,
}: Props) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  if (!event) return null;

  return (
    <>
      <Modal
        title={null}
        open={open}
        onCancel={onClose}
        footer={null}
        width={520}
      >
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <Space align="center" style={{ marginBottom: 6 }}>
            <div style={{
              width: 12, height: 12, borderRadius: '50%',
              background: event.categoryColor,
              boxShadow: event.isOngoing ? `0 0 8px ${event.categoryColor}` : 'none',
            }} />
            <Typography.Title level={4} style={{ margin: 0 }}>
              {event.is_highlighted && '⭐ '}
              {event.title}
            </Typography.Title>
          </Space>
          <Tag color={event.categoryColor}>{event.categoryLabel}</Tag>
        </div>

        {/* Time period */}
        <div style={{ marginBottom: 12 }}>
          {event.end_date && event.start_date === event.end_date ? (
            <Typography.Text>
              {formatDate(event.start_date, event.startPrecision)}
            </Typography.Text>
          ) : (
            <>
              <Typography.Text>
                {formatDate(event.start_date, event.startPrecision)}
                {' — '}
                {event.end_date ? formatDate(event.end_date, event.endPrecision) : '至今'}
              </Typography.Text>
              <br />
              <Typography.Text strong style={{ fontSize: 15 }}>{event.durationText}</Typography.Text>
            </>
          )}
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* Auto statistics */}
        {stats && (
          <>
            <Typography.Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              📊 自动统计
            </Typography.Text>
            <div style={{ display: 'flex', gap: 24, marginTop: 8, marginBottom: 8 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-primary)' }}>{stats.task_count}</div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>任务</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-primary)' }}>{stats.paper_count}</div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>论文</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-primary)' }}>{stats.experiment_count}</div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>实验</div>
              </div>
            </div>
            <Divider style={{ margin: '12px 0' }} />
          </>
        )}

        {/* Manual links */}
        <div style={{ marginBottom: 12 }}>
          <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              🔗 手动关联
            </Typography.Text>
            <Button size="small" type="link" icon={<PlusOutlined />} onClick={onAddLink}>
              添加关联
            </Button>
          </Space>
          {links.length === 0 ? (
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              暂无手动关联
            </Typography.Text>
          ) : (
            links.map(link => (
              <div key={link.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 10px', borderRadius: 8,
                background: 'var(--color-muted-bg)', marginBottom: 4,
              }}>
                <Space size={4}>
                  <LinkOutlined style={{ fontSize: 12, color: 'var(--color-muted)' }} />
                  <Typography.Text style={{ fontSize: 13 }}>
                    {link.label || link.entity_id}
                  </Typography.Text>
                  <Tag style={{ fontSize: 10 }}>
                    {ENTITY_LABELS[link.entity_type] || link.entity_type}
                  </Tag>
                </Space>
                <Button
                  type="text" size="small" danger
                  icon={<DeleteOutlined />}
                  onClick={() => onRemoveLink(link.id)}
                />
              </div>
            ))
          )}
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* Notes */}
        {event.description && (
          <>
            <Typography.Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              备注
            </Typography.Text>
            <div style={{ marginTop: 8, fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {event.description}
            </div>
            <Divider style={{ margin: '12px 0' }} />
          </>
        )}

        {/* Actions */}
        <Space style={{ marginTop: 4 }}>
          <Button icon={<EditOutlined />} onClick={onEdit}>编辑</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => setDeleteConfirm(true)}>删除</Button>
        </Space>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        title="确认删除"
        open={deleteConfirm}
        onOk={() => { onDelete(); setDeleteConfirm(false); }}
        onCancel={() => setDeleteConfirm(false)}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要删除「{event.title}」吗？</p>
        <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>
          关联数据将被一并删除，此操作不可撤销。
        </p>
      </Modal>
    </>
  );
}
