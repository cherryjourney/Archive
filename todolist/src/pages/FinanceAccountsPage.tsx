import React, { useEffect, useState } from 'react';
import { Button, Modal, message, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useFinanceStore } from '@/stores/financeStore';
import AccountModal from '@/components/finance/AccountModal';
import TransferModal from '@/components/finance/TransferModal';
import type { Account, CreateAccountParams, UpdateAccountParams } from '@/types/finance';

const Page: React.FC = () => {
  const { accounts, fetchAccounts, createAccount, updateAccount, deleteAccount } = useFinanceStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);

  useEffect(() => { fetchAccounts(); }, []);

  const handleCreate = async (params: CreateAccountParams) => {
    await createAccount(params);
  };

  const handleUpdate = async (id: string, params: UpdateAccountParams) => {
    await updateAccount(id, params);
  };

  const handleDelete = (acc: Account) => {
    Modal.confirm({
      title: '确认删除',
      content: `删除账户「${acc.name}」？`,
      okText: '删除',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteAccount(acc.id);
          message.success('已删除');
        } catch (e) { message.error(String(e)); }
      },
    });
  };

  const savingsAccounts = accounts.filter((a) => a.is_savings);
  const dailyAccounts = accounts.filter((a) => !a.is_savings);

  return (
    <div style={{ height: '100%', padding: 24, overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>账户管理</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={() => setTransferOpen(true)}>转账</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setModalOpen(true); }}>
            添加账户
          </Button>
        </div>
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#7C3AED', marginBottom: 12 }}>存款账户</h3>
      {savingsAccounts.length === 0 ? (
        <Empty description="暂无存款账户" />
      ) : (
        savingsAccounts.map((a) => (
          <div key={a.id} style={{
            border: '1px solid #DDD6FE', borderRadius: 14, padding: 16, marginBottom: 10,
            background: '#FAF5FF', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{a.name}</div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>存款账户 · 不计入日常余额</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#7C3AED', fontVariantNumeric: 'tabular-nums' as const }}>
                ¥{a.balance.toFixed(2)}
              </span>
              <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(a); setModalOpen(true); }} />
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(a)} />
            </div>
          </div>
        ))
      )}

      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 24, marginBottom: 12 }}>日常账户</h3>
      {dailyAccounts.length === 0 ? (
        <Empty description="暂无日常账户" />
      ) : (
        dailyAccounts.map((a) => (
          <div key={a.id} style={{
            border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 14, marginBottom: 8,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{a.name}</div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>日常收支账户</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' as const }}>
                ¥{a.balance.toFixed(2)}
              </span>
              <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(a); setModalOpen(true); }} />
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(a)} />
            </div>
          </div>
        ))
      )}

      <AccountModal
        open={modalOpen}
        editingAccount={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSubmit={handleCreate}
        onUpdate={handleUpdate}
      />

      <TransferModal
        open={transferOpen}
        accounts={dailyAccounts}
        onClose={() => setTransferOpen(false)}
      />
    </div>
  );
};

export default Page;
