import React, { useState } from 'react';
import { Modal, Form, Select, InputNumber, DatePicker, message } from 'antd';
import dayjs from 'dayjs';
import { useFinanceStore } from '@/stores/financeStore';
import type { Account } from '@/types/finance';

interface TransferModalProps {
  open: boolean;
  accounts: Account[];
  onClose: () => void;
}

const TransferModal: React.FC<TransferModalProps> = ({ open, accounts, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { categories, createTransaction } = useFinanceStore();
  const transferCat = categories.find((c) => c.name === '转账');

  const handleFinish = async (values: { from: string; to: string; amount: number; date: dayjs.Dayjs }) => {
    setLoading(true);
    try {
      const catId = transferCat?.id ?? 8;
      await createTransaction({
        type: 'transfer_out',
        amount: values.amount,
        category_id: catId,
        account_id: values.from,
        target_account_id: values.to,
        date: values.date.format('YYYY-MM-DD'),
        note: `转账至 ${accounts.find((a) => a.id === values.to)?.name ?? ''}`,
      });
      message.success('转账成功');
      onClose();
    } catch (e) {
      message.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="转账" open={open} onCancel={onClose} onOk={() => form.submit()} confirmLoading={loading} destroyOnClose>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="from" label="转出账户" rules={[{ required: true }]}>
          <Select options={accounts.map((a) => ({ label: `${a.name} (¥${a.balance.toFixed(2)})`, value: a.id }))} />
        </Form.Item>
        <Form.Item name="to" label="转入账户" rules={[{ required: true }]}>
          <Select options={accounts.map((a) => ({ label: `${a.name} (¥${a.balance.toFixed(2)})`, value: a.id }))} />
        </Form.Item>
        <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0.01} precision={2} />
        </Form.Item>
        <Form.Item name="date" label="日期" rules={[{ required: true }]} initialValue={dayjs()}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TransferModal;
