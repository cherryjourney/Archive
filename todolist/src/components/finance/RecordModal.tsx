import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, message } from 'antd';
import dayjs from 'dayjs';
import type { TransactionCategory, Account, Transaction, CreateTransactionParams, TransactionType } from '@/types/finance';

interface RecordModalProps {
  open: boolean;
  categories: TransactionCategory[];
  accounts: Account[];
  editingRecord?: Transaction | null;
  onClose: () => void;
  onSubmit: (params: CreateTransactionParams) => Promise<void>;
  onUpdate: (id: string, params: CreateTransactionParams) => Promise<void>;
}

const RecordModal: React.FC<RecordModalProps> = ({
  open, categories, accounts, editingRecord, onClose, onSubmit, onUpdate,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const recordType: TransactionType = Form.useWatch('type', form);

  const dailyAccounts = accounts.filter((a) => !a.is_savings);

  useEffect(() => {
    if (open) {
      if (editingRecord) {
        form.setFieldsValue({
          type: editingRecord.type,
          amount: editingRecord.amount,
          category_id: editingRecord.category_id,
          account_id: editingRecord.account_id,
          target_account_id: editingRecord.target_account_id,
          date: dayjs(editingRecord.date),
          note: editingRecord.note,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ type: 'expense', date: dayjs() });
      }
    }
  }, [open, editingRecord, form]);

  const handleFinish = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const params: CreateTransactionParams = {
        type: values.type as TransactionType,
        amount: values.amount as number,
        category_id: values.category_id as number,
        account_id: values.account_id as string,
        date: (values.date as dayjs.Dayjs).format('YYYY-MM-DD'),
        note: (values.note as string) || '',
      };
      if (values.type === 'transfer_out' && values.target_account_id) {
        params.target_account_id = values.target_account_id as string;
      }
      if (editingRecord) {
        await onUpdate(editingRecord.id, params);
      } else {
        await onSubmit(params);
      }
      message.success(editingRecord ? '已更新' : '已记录');
      onClose();
    } catch (e) {
      message.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={editingRecord ? '编辑记录' : '记一笔'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="type" label="类型" rules={[{ required: true }]}>
          <Select
            options={[
              { label: '支出', value: 'expense' },
              { label: '收入', value: 'income' },
              { label: '转账', value: 'transfer_out' },
            ]}
          />
        </Form.Item>
        <Form.Item name="amount" label="金额" rules={[{ required: true, message: '请输入金额' }]}>
          <InputNumber style={{ width: '100%' }} min={0.01} precision={2} placeholder="0.00" />
        </Form.Item>
        <Form.Item name="category_id" label="分类" rules={[{ required: true }]}>
          <Select
            options={categories.map((c) => ({
              label: c.name,
              value: c.id,
            }))}
          />
        </Form.Item>
        <Form.Item name="account_id" label="账户" rules={[{ required: true }]}>
          <Select
            options={dailyAccounts.map((a) => ({
              label: `${a.name} (¥${a.balance.toFixed(2)})`,
              value: a.id,
            }))}
          />
        </Form.Item>
        {recordType === 'transfer_out' && (
          <Form.Item name="target_account_id" label="目标账户" rules={[{ required: true, message: '请选择目标账户' }]}>
            <Select
              options={accounts
                .filter((a) => !a.is_savings)
                .map((a) => ({ label: a.name, value: a.id }))}
            />
          </Form.Item>
        )}
        <Form.Item name="date" label="日期" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="note" label="备注">
          <Input placeholder="可选" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RecordModal;
