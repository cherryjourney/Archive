import React, { useEffect, useState } from 'react';
import { Modal, Input, Select, DatePicker, InputNumber, message } from 'antd';
import type { CreateAssetParams, UpdateAssetParams, Asset } from '@/types/asset';
import { ASSET_CATEGORIES, ASSET_STATUSES, ASSET_CONDITIONS } from '@/types/asset';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (params: CreateAssetParams | UpdateAssetParams) => Promise<void>;
  /** If provided, edit mode; otherwise create mode */
  editAsset?: Asset | null;
  title?: string;
}

export default function AssetFormModal({ open, onClose, onSubmit, editAsset, title }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('electronics');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [warrantyExpiry, setWarrantyExpiry] = useState<string | null>(null);
  const [status, setStatus] = useState('in_use');
  const [condition, setCondition] = useState('good');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!editAsset;

  useEffect(() => {
    if (editAsset) {
      setName(editAsset.name);
      setCategory(editAsset.category);
      setBrand(editAsset.brand);
      setModel(editAsset.model);
      setPurchaseDate(editAsset.purchase_date);
      setPrice(editAsset.price);
      setQuantity(editAsset.quantity);
      setWarrantyExpiry(editAsset.warranty_expiry);
      setStatus(editAsset.status);
      setCondition(editAsset.condition);
      setNotes(editAsset.notes);
    } else {
      setName('');
      setCategory('electronics');
      setBrand('');
      setModel('');
      setPurchaseDate('');
      setPrice(0);
      setQuantity(1);
      setWarrantyExpiry(null);
      setStatus('in_use');
      setCondition('good');
      setNotes('');
    }
  }, [editAsset, open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      message.warning('请输入物品名称');
      return;
    }
    if (!purchaseDate) {
      message.warning('请选择购买日期');
      return;
    }
    setSubmitting(true);
    try {
      const params: CreateAssetParams = {
        name: name.trim(),
        category,
        purchase_date: purchaseDate,
        price: price || 0,
        quantity: quantity || 1,
        brand: brand.trim(),
        model: model.trim(),
        warranty_expiry: warrantyExpiry || null,
        status,
        condition,
        notes: notes.trim(),
      };
      await onSubmit(params);
      onClose();
    } catch {
      message.error(isEdit ? '更新失败' : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      title={title || (isEdit ? '编辑物品' : '添加物品')}
      okText={isEdit ? '保存' : '添加'}
      cancelText="取消"
      width={520}
      destroyOnClose
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
        {/* Name */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block', color: 'var(--color-foreground, #1E293B)' }}>
            名称 <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="例如 iPad Pro 12.9" />
        </div>

        {/* Category + Brand */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block', color: 'var(--color-foreground, #1E293B)' }}>
              分类
            </label>
            <Select
              value={category}
              onChange={setCategory}
              style={{ width: '100%' }}
              options={ASSET_CATEGORIES.map(c => ({ value: c.key, label: `${c.icon} ${c.label}` }))}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block', color: 'var(--color-foreground, #1E293B)' }}>
              品牌
            </label>
            <Input value={brand} onChange={e => setBrand(e.target.value)} placeholder="例如 Apple" />
          </div>
        </div>

        {/* Model */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block', color: 'var(--color-foreground, #1E293B)' }}>
            型号
          </label>
          <Input value={model} onChange={e => setModel(e.target.value)} placeholder="例如 M2 256GB" />
        </div>

        {/* Purchase date + Price */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block', color: 'var(--color-foreground, #1E293B)' }}>
              购买日期 <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <DatePicker
              value={purchaseDate ? dayjs(purchaseDate) : null}
              onChange={d => setPurchaseDate(d ? d.format('YYYY-MM-DD') : '')}
              style={{ width: '100%' }}
              placeholder="选择日期"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block', color: 'var(--color-foreground, #1E293B)' }}>
              价格 (元)
            </label>
            <InputNumber
              value={price}
              onChange={v => setPrice(v ?? 0)}
              style={{ width: '100%' }}
              min={0}
              precision={2}
              placeholder="0"
            />
          </div>
        </div>

        {/* Quantity + Warranty */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block', color: 'var(--color-foreground, #1E293B)' }}>
              数量
            </label>
            <InputNumber
              value={quantity}
              onChange={v => setQuantity(v ?? 1)}
              style={{ width: '100%' }}
              min={1}
              placeholder="1"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block', color: 'var(--color-foreground, #1E293B)' }}>
              质保到期 (可选)
            </label>
            <DatePicker
              value={warrantyExpiry ? dayjs(warrantyExpiry) : null}
              onChange={d => setWarrantyExpiry(d ? d.format('YYYY-MM-DD') : null)}
              style={{ width: '100%' }}
              placeholder="不设置"
            />
          </div>
        </div>

        {/* Status + Condition */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block', color: 'var(--color-foreground, #1E293B)' }}>
              状态
            </label>
            <Select
              value={status}
              onChange={setStatus}
              style={{ width: '100%' }}
              options={ASSET_STATUSES.map(s => ({ value: s.key, label: s.label }))}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block', color: 'var(--color-foreground, #1E293B)' }}>
              成色
            </label>
            <Select
              value={condition}
              onChange={setCondition}
              style={{ width: '100%' }}
              options={ASSET_CONDITIONS.map(c => ({ value: c.key, label: c.label }))}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block', color: 'var(--color-foreground, #1E293B)' }}>
            备注
          </label>
          <TextArea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="任何补充信息..." />
        </div>
      </div>
    </Modal>
  );
}
