import { useMemo, useEffect } from 'react';
import { Typography, Tooltip } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import BentoCard from '@/components/common/BentoCard';
import { useFinanceStore } from '@/stores/financeStore';
import type { DailyMeal } from '@/types/meal';

const { Text } = Typography;

const MEALS = [
  { key: 'breakfast' as const, icon: '🌅', label: '早餐', color: '#F59E0B' },
  { key: 'lunch' as const, icon: '☀️', label: '午餐', color: '#F76707' },
  { key: 'dinner' as const, icon: '🌙', label: '晚餐', color: '#7950F2' },
] as const;

interface MealCardProps {
  meal: DailyMeal | null;
  onEdit: () => void;
}

function AccountBadge({ accountId }: { accountId: string }) {
  const accounts = useFinanceStore((s) => s.accounts);
  const account = accounts.find((a) => a.id === accountId);
  if (!account) return null;
  return (
    <Tooltip title={account.name}>
      <span style={{
        fontSize: 11, color: account.color || 'var(--text-muted)',
        background: 'var(--bg-muted)', padding: '1px 6px', borderRadius: 4,
        fontWeight: 500,
      }}>
        {account.is_savings ? '🏦' : '💳'} {account.name}
      </span>
    </Tooltip>
  );
}

function MealRow({
  icon, label, color, content, cost, accountId, isEmpty,
}: {
  icon: string; label: string; color: string; content: string;
  cost: number; accountId: string; isEmpty: boolean;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px', borderRadius: 10,
      transition: 'background 0.15s',
      cursor: 'pointer',
      minHeight: 38,
    }}>
      {/* Icon */}
      <span style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: isEmpty ? 'var(--bg-muted)' : `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, transition: 'background 0.2s',
      }}>{icon}</span>

      {/* Label */}
      <Text style={{
        fontSize: 12, color: 'var(--text-muted)', flexShrink: 0,
        width: 28, fontWeight: 500,
      }}>{label}</Text>

      {/* Content */}
      <Text style={{
        fontSize: 13, flex: 1,
        color: isEmpty ? 'var(--text-muted)' : 'var(--text-primary)',
        fontWeight: isEmpty ? 400 : 500,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        fontStyle: isEmpty ? 'italic' : 'normal',
      }}>
        {content || '未记录'}
      </Text>

      {/* Cost & Account */}
      {!isEmpty && cost > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <Text style={{
            fontSize: 12, fontWeight: 600,
            color: 'var(--text-primary)',
          }}>
            ¥{cost.toFixed(1)}
          </Text>
          {accountId && <AccountBadge accountId={accountId} />}
        </div>
      )}
    </div>
  );
}

export default function MealCard({ meal, onEdit }: MealCardProps) {
  const accounts = useFinanceStore((s) => s.accounts);
  const fetchAccounts = useFinanceStore((s) => s.fetchAccounts);

  // Load accounts once on mount
  useEffect(() => {
    if (accounts.length === 0) fetchAccounts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalCost = useMemo(() => {
    if (!meal) return 0;
    return (meal.breakfast_cost || 0) + (meal.lunch_cost || 0) + (meal.dinner_cost || 0);
  }, [meal]);

  const mealMap = {
    breakfast: { content: meal?.breakfast || '', cost: meal?.breakfast_cost || 0, accountId: meal?.breakfast_account_id || '' },
    lunch: { content: meal?.lunch || '', cost: meal?.lunch_cost || 0, accountId: meal?.lunch_account_id || '' },
    dinner: { content: meal?.dinner || '', cost: meal?.dinner_cost || 0, accountId: meal?.dinner_account_id || '' },
  };

  const allEmpty = !meal || (!meal.breakfast && !meal.lunch && !meal.dinner);

  return (
    <BentoCard style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 30, height: 30, borderRadius: 10,
            background: 'linear-gradient(135deg, #F59E0B, #F76707)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>🍽️</span>
          <Text strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>
            一日三餐
          </Text>
          {totalCost > 0 && (
            <Text style={{
              fontSize: 12, color: '#F76707', fontWeight: 600,
              background: '#FFF3E0', padding: '2px 8px', borderRadius: 6,
            }}>
              今日 ¥{totalCost.toFixed(1)}
            </Text>
          )}
        </div>
        <div
          onClick={onEdit}
          style={{
            width: 28, height: 28, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-muted)'; e.currentTarget.style.color = '#2563EB'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <EditOutlined style={{ fontSize: 13 }} />
        </div>
      </div>

      {/* Meal rows */}
      <div
        onClick={allEmpty ? onEdit : undefined}
        style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}
      >
        {MEALS.map(({ key, icon, label, color }) => {
          const m = mealMap[key];
          return (
            <div
              key={key}
              onClick={() => { if (!allEmpty) onEdit(); }}
              style={{ borderRadius: 10 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-muted)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <MealRow
                icon={icon}
                label={label}
                color={color}
                content={m.content}
                cost={m.cost}
                accountId={m.accountId}
                isEmpty={!m.content}
              />
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {allEmpty && (
        <div style={{
          textAlign: 'center', padding: '8px 0 4px',
          fontSize: 12, color: 'var(--text-muted)',
        }}>
          点击记录今日饮食 ✍️
        </div>
      )}
    </BentoCard>
  );
}
