import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Switch, Select, Button, message } from 'antd';
import {
  WechatOutlined, AlipayOutlined, BankOutlined,
} from '@ant-design/icons';

interface AccountModalProps {
  open: boolean;
  editingAccount?: { id: string; name: string; balance: number; is_savings: boolean; color?: string } | null;
  onClose: () => void;
  onSubmit: (params: { name: string; balance: number; is_savings: boolean; color?: string }) => Promise<void>;
  onUpdate: (id: string, params: { name?: string; balance?: number; is_savings?: boolean; color?: string }) => Promise<void>;
}

const DAILY_PRESETS = [
  { name: '微信', color: '#07C160', icon: <WechatOutlined /> },
  { name: '支付宝', color: '#1677FF', icon: <AlipayOutlined /> },
];

const BANK_PRESETS = [
  { name: '招商银行', color: '#E53935' },
  { name: '工商银行', color: '#C62828' },
  { name: '建设银行', color: '#1565C0' },
  { name: '农业银行', color: '#00897B' },
  { name: '中国银行', color: '#B71C1C' },
  { name: '交通银行', color: '#1565C0' },
  { name: '邮储银行', color: '#2E7D32' },
  { name: '江苏银行', color: '#1565C0' },
];

const AccountModal: React.FC<AccountModalProps> = ({ open, editingAccount, onClose, onSubmit, onUpdate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isSavings: boolean = Form.useWatch('is_savings', form);

  useEffect(() => {
    if (open) {
      if (editingAccount) {
        form.setFieldsValue(editingAccount);
      } else {
        form.resetFields();
        form.setFieldsValue({ balance: 0, is_savings: false });
      }
    }
  }, [open, editingAccount, form]);

  const selectPreset = (name: string, color: string, savings: boolean) => {
    form.setFieldsValue({ name, color, is_savings: savings });
  };

  const handleFinish = async (values: { name: string; balance: number; is_savings: boolean; color?: string }) => {
    setLoading(true);
    try {
      if (editingAccount) {
        await onUpdate(editingAccount.id, values);
      } else {
        await onSubmit(values);
      }
      message.success(editingAccount ? '已更新' : '已添加');
      onClose();
    } catch (e) {
      message.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={editingAccount ? '编辑账户' : '添加账户'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {/* 隐藏的 color 字段 */}
        <Form.Item name="color" hidden>
          <Input />
        </Form.Item>

        {/* 快捷选择 — 仅在新建时显示 */}
        {!editingAccount && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>
              {isSavings ? '🏦 选择银行' : '💳 快捷选择'}
            </div>
            {!isSavings ? (
              <div style={{ display: 'flex', gap: 8 }}>
                {DAILY_PRESETS.map((p) => (
                  <Button
                    key={p.name}
                    icon={p.icon}
                    onClick={() => selectPreset(p.name, p.color, false)}
                    style={{
                      borderColor: p.color,
                      color: p.color,
                      borderRadius: 10,
                    }}
                  >
                    {p.name}
                  </Button>
                ))}
              </div>
            ) : (
              <Select
                placeholder="选择银行…"
                style={{ width: '100%', borderRadius: 10 }}
                onChange={(val) => {
                  const bank = BANK_PRESETS.find((b) => b.name === val);
                  if (bank) selectPreset(bank.name, bank.color, true);
                }}
                options={BANK_PRESETS.map((b) => ({
                  label: b.name,
                  value: b.name,
                }))}
              />
            )}
          </div>
        )}

        <Form.Item name="name" label="账户名称" rules={[{ required: true, message: '请输入账户名称' }]}>
          <Input placeholder={isSavings ? '如：招商银行储蓄卡' : '如：微信钱包'} />
        </Form.Item>
        <Form.Item name="balance" label="余额">
          <InputNumber style={{ width: '100%' }} precision={2} placeholder="0.00" />
        </Form.Item>
        <Form.Item name="is_savings" label="存款账户" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AccountModal;
