import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Input, Select, Button, message, Modal } from 'antd';
import {
  PlusOutlined, LeftOutlined, RightOutlined, SearchOutlined,
} from '@ant-design/icons';
import * as icons from '@ant-design/icons';
import dayjs from 'dayjs';
import { useFinanceStore } from '@/stores/financeStore';
import StatCard from '@/components/finance/StatCard';
import RecordModal from '@/components/finance/RecordModal';
import AccountModal from '@/components/finance/AccountModal';
import type { Account, TransactionDisplay, CreateTransactionParams, CreateAccountParams, UpdateAccountParams, TransactionType } from '@/types/finance';

const iconMap: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = icons as any;

const Page: React.FC = () => {
  const store = useFinanceStore();
  const {
    categories, accounts, stats, loading,
    currentYear, currentMonth,
    fetchAll, createTransaction, updateTransaction, deleteTransaction, setMonth,
    createAccount, updateAccount, deleteAccount,
    displayTransactions,
  } = store;

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<number | undefined>();
  const [filterAccount, setFilterAccount] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TransactionDisplay | null>(null);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  useEffect(() => {
    fetchAll(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const prevMonth = () => {
    const d = dayjs(`${currentYear}-${currentMonth}-01`).subtract(1, 'month');
    setMonth(d.year(), d.month() + 1);
  };
  const nextMonth = () => {
    const d = dayjs(`${currentYear}-${currentMonth}-01`).add(1, 'month');
    setMonth(d.year(), d.month() + 1);
  };

  const filtered = useMemo(() => {
    let list = displayTransactions();
    if (search) {
      const kw = search.toLowerCase();
      list = list.filter(
        (t) => t.note.toLowerCase().includes(kw) || t.category_name.toLowerCase().includes(kw) || t.account_name.toLowerCase().includes(kw),
      );
    }
    if (filterCategory) list = list.filter((t) => t.category_id === filterCategory);
    if (filterAccount) list = list.filter((t) => t.account_id === filterAccount);
    return list;
  }, [displayTransactions, search, filterCategory, filterAccount]);

  const grouped = useMemo(() => {
    const map: Record<string, TransactionDisplay[]> = {};
    filtered.forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const handleCreate = useCallback(async (params: CreateTransactionParams) => {
    await createTransaction(params);
  }, [createTransaction]);

  const handleUpdate = useCallback(async (id: string, params: CreateTransactionParams) => {
    await updateTransaction(id, params);
  }, [updateTransaction]);

  const handleDeleteAccount = useCallback((account: Account) => {
    Modal.confirm({
      title: '确认删除',
      content: `删除账户「${account.name}」？关联的交易记录需先清理。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteAccount(account.id);
          message.success('已删除');
        } catch (e) { message.error(String(e)); }
      },
    });
  }, [deleteAccount]);

  const handleDelete = useCallback((record: TransactionDisplay) => {
    Modal.confirm({
      title: '确认删除',
      content: `删除「${record.note || record.category_name}」¥${record.amount.toFixed(2)}？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await deleteTransaction(record.id);
        message.success('已删除');
      },
    });
  }, [deleteTransaction]);

  const openEdit = (record: TransactionDisplay) => {
    setEditingRecord(record);
    setModalOpen(true);
  };

  const renderIcon = (iconName: string, color: string, bgSuffix: string) => {
    const IconComp = iconMap[iconName];
    return (
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 34, height: 34, borderRadius: 8,
        background: color + bgSuffix, color,
        fontSize: 14,
      }}>
        {IconComp ? <IconComp /> : '💰'}
      </span>
    );
  };

  const formatDay = (dateStr: string) => {
    const d = dayjs(dateStr);
    return `${d.format('M月D日')} 周${['日','一','二','三','四','五','六'][d.day()]}`;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 24, overflow: 'auto' }}>
      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard
          label="本月支出" amount={stats?.monthly_expense ?? 0} sub={`${stats?.expense_count ?? 0} 笔`}
          bgColor="#FFF1F2" borderColor="#FECDD3" labelColor="#BE123C" amountColor="#DC2626"
        />
        <StatCard
          label="本月收入" amount={stats?.monthly_income ?? 0} sub={`${stats?.income_count ?? 0} 笔`}
          bgColor="#ECFDF5" borderColor="#A7F3D0" labelColor="#047857" amountColor="#059669"
        />
        <StatCard
          label="存款总额" amount={stats?.savings_total ?? 0} sub={`${stats?.savings_count ?? 0} 张卡`}
          bgColor="#F5F3FF" borderColor="#DDD6FE" labelColor="#5B21B6" amountColor="#7C3AED"
        />
        <StatCard
          label="净资产" amount={stats?.net_worth ?? 0} sub="存款 + 账户余额"
          bgColor="linear-gradient(135deg, #F8FAFC, #EFF6FF)" borderColor="#E2E8F0" labelColor="#475569" amountColor="#0F172A"
        />
      </div>

      {/* 筛选栏 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
          placeholder="搜索记录..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, borderRadius: 12 }}
        />
        <Select
          placeholder="全部分类"
          allowClear
          style={{ width: 120, borderRadius: 12 }}
          value={filterCategory}
          onChange={setFilterCategory}
          options={categories.map((c) => ({ label: c.name, value: c.id }))}
        />
        <Select
          placeholder="全部账户"
          allowClear
          style={{ width: 120, borderRadius: 12 }}
          value={filterAccount}
          onChange={setFilterAccount}
          options={accounts.filter((a) => !a.is_savings).map((a) => ({ label: a.name, value: a.id }))}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { setEditingRecord(null); setModalOpen(true); }}
          style={{ borderRadius: 12, background: '#2563EB', fontWeight: 600 }}
        >
          记一笔
        </Button>
      </div>

      {/* 双栏 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) 2fr', gap: 16, flex: 1, minHeight: 0 }}>
        {/* 左栏：账户管理 */}
        <div style={{
          border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '12px 16px', background: 'var(--bg-sidebar)',
            fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            存款账户管理
          </div>
          <div style={{ padding: 14, overflow: 'auto', flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#7C3AED', marginBottom: 8, fontSize: 13 }}>
              存款账户
            </div>
            {accounts.filter((a) => a.is_savings).map((a) => (
              <div key={a.id} style={{
                border: '1px solid #DDD6FE', borderRadius: 10, padding: '10px 12px',
                marginBottom: 6, background: '#FAF5FF',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: 13, cursor: 'pointer',
              }} onClick={() => { setEditingAccount(a); setAccountModalOpen(true); }}
              onContextMenu={(e) => { e.preventDefault(); handleDeleteAccount(a); }}>
                <span>
                  {a.color && <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: a.color, marginRight: 6 }} />}
                  {a.name}
                </span>
                <span style={{ fontWeight: 600 }}>¥{a.balance.toFixed(2)}</span>
              </div>
            ))}
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, marginTop: 16, fontSize: 13 }}>
              日常账户
            </div>
            {accounts.filter((a) => !a.is_savings).map((a) => (
              <div key={a.id} style={{
                border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '8px 12px',
                marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: 13, cursor: 'pointer',
              }} onClick={() => { setEditingAccount(a); setAccountModalOpen(true); }}
              onContextMenu={(e) => { e.preventDefault(); handleDeleteAccount(a); }}>
                <span>
                  {a.color && <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: a.color, marginRight: 6 }} />}
                  {a.name}
                </span>
                <span style={{ fontWeight: 600 }}>¥{a.balance.toFixed(2)}</span>
              </div>
            ))}
            <Button
              block
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => { setEditingAccount(null); setAccountModalOpen(true); }}
              style={{ marginTop: 8, color: '#64748B' }}
            >
              添加账户
            </Button>
          </div>
        </div>

        {/* 右栏：本月消费明细 */}
        <div style={{
          border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '12px 16px', background: 'var(--bg-sidebar)',
            fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <LeftOutlined style={{ cursor: 'pointer', color: '#94A3B8', fontSize: 13 }} onClick={prevMonth} />
            <span style={{ fontWeight: 600, fontSize: 15 }}>{currentYear}年{currentMonth}月</span>
            <RightOutlined style={{ cursor: 'pointer', color: '#94A3B8', fontSize: 13 }} onClick={nextMonth} />
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94A3B8' }}>
              支出 ¥{stats?.monthly_expense.toFixed(2) ?? '0.00'} · 收入 ¥{stats?.monthly_income.toFixed(2) ?? '0.00'}
            </span>
          </div>
          <div style={{ overflow: 'auto', flex: 1 }}>
            {grouped.map(([date, items]) => (
              <React.Fragment key={date}>
                <div style={{
                  padding: '10px 16px', background: 'var(--bg-sidebar)',
                  fontSize: 12, fontWeight: 600, color: '#64748B',
                }}>
                  {formatDay(date)}
                </div>
                {items.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => openEdit(t)}
                    style={{
                      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                      borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer',
                    }}
                    onContextMenu={(e) => { e.preventDefault(); handleDelete(t); }}
                  >
                    {renderIcon(t.category_icon, t.category_color, '20')}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>
                        {t.note || t.category_name}
                      </div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>
                        {t.category_name} · {t.account_name}
                        {t.type === 'transfer_out' && t.target_account_name ? ` → ${t.target_account_name}` : ''}
                      </div>
                    </div>
                    <div style={{
                      fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                      color: t.type === 'expense' || t.type === 'transfer_out' ? '#DC2626' : '#059669',
                      fontSize: 15,
                    }}>
                      {t.type === 'expense' || t.type === 'transfer_out' ? '-' : '+'}
                      {t.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
                暂无记录，点击「+ 记一笔」开始
              </div>
            )}
          </div>
        </div>
      </div>

      <RecordModal
        open={modalOpen}
        categories={categories}
        accounts={accounts}
        editingRecord={editingRecord}
        onClose={() => { setModalOpen(false); setEditingRecord(null); }}
        onSubmit={handleCreate}
        onUpdate={handleUpdate}
      />

      <AccountModal
        open={accountModalOpen}
        editingAccount={editingAccount}
        onClose={() => { setAccountModalOpen(false); setEditingAccount(null); }}
        onSubmit={async (params: CreateAccountParams) => { await createAccount(params); }}
        onUpdate={async (id: string, params: UpdateAccountParams) => { await updateAccount(id, params); }}
      />
    </div>
  );
};

export default Page;
