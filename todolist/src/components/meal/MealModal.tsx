import { useState, useEffect } from 'react';
import { Modal, Input, InputNumber, Select, App } from 'antd';
import { WalletOutlined, DollarOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import { useMealStore } from '@/stores/mealStore';
import { useFinanceStore } from '@/stores/financeStore';
import type { MealPaymentInput } from '@/types/meal';

const { TextArea } = Input;

interface MealModalProps {
  open: boolean;
  date: string;  // YYYY-MM-DD — the date to edit meals for
  onClose: () => void;
}

interface MealFieldState {
  content: string;
  cost: number | null;
  accountId: string | null;
  showPayment: boolean;
}

const MEAL_META = [
  { key: 'breakfast' as const, icon: '🌅', label: '早餐', placeholder: '今天早餐吃了什么…', color: '#F59E0B' },
  { key: 'lunch' as const, icon: '☀️', label: '午餐', placeholder: '今天午餐吃了什么…', color: '#F76707' },
  { key: 'dinner' as const, icon: '🌙', label: '晚餐', placeholder: '今天晚餐吃了什么…', color: '#7950F2' },
  { key: 'drinks' as const, icon: '🧋', label: '饮料', placeholder: '今天喝了什么…', color: '#EC4899' },
] as const;

export default function MealModal({ open, date, onClose }: MealModalProps) {
  const { currentMeal, saveMeal, fetchByDate, saving } = useMealStore();
  const accounts = useFinanceStore((s) => s.accounts);
  const fetchAccounts = useFinanceStore((s) => s.fetchAccounts);
  const { message } = App.useApp();
  const isToday = date === new Date().toISOString().slice(0, 10);

  const [fields, setFields] = useState<Record<string, MealFieldState>>({
    breakfast: { content: '', cost: null, accountId: null, showPayment: false },
    lunch: { content: '', cost: null, accountId: null, showPayment: false },
    dinner: { content: '', cost: null, accountId: null, showPayment: false },
    drinks: { content: '', cost: null, accountId: null, showPayment: false },
  });

  // Load accounts + meal data when modal opens
  useEffect(() => {
    if (!open) return;
    if (accounts.length === 0) fetchAccounts();
    fetchByDate(date);
  }, [open, date]);

  // Sync local state when loaded meal changes
  useEffect(() => {
    if (open && currentMeal) {
      setFields({
        breakfast: {
          content: currentMeal.breakfast || '',
          cost: currentMeal.breakfast_cost || null,
          accountId: currentMeal.breakfast_account_id || null,
          showPayment: !!(currentMeal.breakfast_cost || currentMeal.breakfast_account_id),
        },
        lunch: {
          content: currentMeal.lunch || '',
          cost: currentMeal.lunch_cost || null,
          accountId: currentMeal.lunch_account_id || null,
          showPayment: !!(currentMeal.lunch_cost || currentMeal.lunch_account_id),
        },
        dinner: {
          content: currentMeal.dinner || '',
          cost: currentMeal.dinner_cost || null,
          accountId: currentMeal.dinner_account_id || null,
          showPayment: !!(currentMeal.dinner_cost || currentMeal.dinner_account_id),
        },
        drinks: {
          content: currentMeal.drinks || '',
          cost: currentMeal.drinks_cost || null,
          accountId: currentMeal.drinks_account_id || null,
          showPayment: !!(currentMeal.drinks_cost || currentMeal.drinks_account_id),
        },
      });
    } else if (open && !currentMeal) {
      setFields({
        breakfast: { content: '', cost: null, accountId: null, showPayment: false },
        lunch: { content: '', cost: null, accountId: null, showPayment: false },
        dinner: { content: '', cost: null, accountId: null, showPayment: false },
        drinks: { content: '', cost: null, accountId: null, showPayment: false },
      });
    }
  }, [open, currentMeal]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateField = (meal: string, patch: Partial<MealFieldState>) => {
    setFields((prev) => ({ ...prev, [meal]: { ...prev[meal], ...patch } }));
  };

  const makePayment = (meal: string): MealPaymentInput | undefined => {
    const f = fields[meal];
    if (f.cost && f.cost > 0 && f.accountId) {
      return { cost: f.cost, account_id: f.accountId };
    }
    return undefined;
  };

  const handleSave = async () => {
    await saveMeal(
      date,
      fields.breakfast.content,
      fields.lunch.content,
      fields.dinner.content,
      fields.drinks.content,
      makePayment('breakfast'),
      makePayment('lunch'),
      makePayment('dinner'),
      makePayment('drinks'),
    );
    message.success('已保存');
    onClose();
  };

  const accountOptions = accounts.map((a) => ({
    value: a.id,
    label: `${a.is_savings ? '🏦 ' : '💳 '}${a.name}`,
  }));

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={saving}
      okText="保存"
      cancelText="取消"
      centered
      closable={false}
      width={520}
      maskStyle={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      styles={{
        body: { padding: '24px 28px 20px' },
        content: {
          borderRadius: 20,
          background: 'var(--bg-card)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(37,99,235,0.08)',
        },
        header: { display: 'none' },
      }}
    >
      {/* Custom title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22,
        fontSize: 18, fontWeight: 700, color: 'var(--text-primary)',
      }}>
        <span style={{
          width: 36, height: 36, borderRadius: 12,
          background: 'linear-gradient(135deg, #F59E0B, #F76707)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>🍽️</span>
        <div>
          <div style={{ fontSize: 16, lineHeight: 1.2 }}>
            {isToday ? '今日饮食' : '饮食记录'}
          </div>
          <div style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>
            {date} · 记录饮食 · 关联记账
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {MEAL_META.map(({ key, icon, label, placeholder, color }) => {
          const f = fields[key];
          return (
            <div
              key={key}
              style={{
                padding: '16px 18px',
                borderRadius: 14,
                background: 'var(--bg-muted)',
                border: '1px solid transparent',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Meal header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
              }}>
                <span style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: `${color}18`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>{icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color }}>
                  {label}
                </span>
              </div>

              {/* Content textarea */}
              <TextArea
                value={f.content}
                onChange={(e) => updateField(key, { content: e.target.value })}
                placeholder={placeholder}
                autoSize={{ minRows: 1, maxRows: 3 }}
                style={{ borderRadius: 10, fontSize: 14, marginBottom: 10 }}
              />

              {/* Payment toggle */}
              <div
                onClick={() => updateField(key, { showPayment: !f.showPayment })}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 12, color: f.showPayment ? color : 'var(--text-muted)',
                  cursor: 'pointer', fontWeight: 500,
                  padding: '3px 8px', borderRadius: 6,
                  transition: 'all 0.15s',
                  background: f.showPayment ? `${color}12` : 'transparent',
                }}
              >
                {f.showPayment
                  ? <DownOutlined style={{ fontSize: 9 }} />
                  : <RightOutlined style={{ fontSize: 9 }} />
                }
                <DollarOutlined style={{ fontSize: 12 }} />
                关联记账
              </div>

              {/* Payment fields */}
              {f.showPayment && (
                <div style={{
                  display: 'flex', gap: 10, marginTop: 10,
                  alignItems: 'center',
                }}>
                  <InputNumber
                    prefix="¥"
                    value={f.cost}
                    onChange={(v) => updateField(key, { cost: v })}
                    placeholder="花费"
                    min={0}
                    step={0.5}
                    style={{ flex: 1, borderRadius: 10 }}
                  />
                  <Select
                    value={f.accountId}
                    onChange={(v) => updateField(key, { accountId: v })}
                    placeholder={
                      <span style={{ fontSize: 12 }}>
                        <WalletOutlined style={{ marginRight: 4 }} />支付方式
                      </span>
                    }
                    options={accountOptions}
                    style={{ flex: 1.5, borderRadius: 10 }}
                    allowClear
                    popupMatchSelectWidth={false}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div style={{
        marginTop: 16, fontSize: 11, color: 'var(--text-muted)',
        textAlign: 'center', lineHeight: 1.8,
      }}>
        点击「关联记账」可记录每餐花费，自动同步到本月账单 💡
      </div>
    </Modal>
  );
}
