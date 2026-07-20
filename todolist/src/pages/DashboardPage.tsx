import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Tag, Skeleton, App } from 'antd';
import {
  PlusOutlined, FileTextOutlined,
  TrophyOutlined, ImportOutlined,
  ThunderboltOutlined, CalendarOutlined, HourglassOutlined,
  LeftOutlined, RightOutlined, EditOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useChartStore } from '@/stores/chartStore';
import ContributionHeatmap from '@/components/charts/ContributionHeatmap';
import { useCountdownStore } from '@/stores/countdownStore';
import { toDisplayEvent } from '@/utils/countdownPresets';
import { useDailyGreeting } from '@/hooks/useDailyGreeting';
import BentoCard from '@/components/common/BentoCard';
import MealModal from '@/components/meal/MealModal';
import EmotionHeatmap from '@/components/charts/EmotionHeatmap';
import { useMealStore } from '@/stores/mealStore';
import { useFinanceStore } from '@/stores/financeStore';
import { useEmotionStore } from '@/stores/emotionStore';
import { usePlanStore } from '@/stores/planStore';
import type { DailyMeal } from '@/types/meal';
import type { ImportFocusRecord } from '@/types/plan';

const { Text } = Typography;

const MEAL_META = [
  { key: 'breakfast' as const, icon: '🌅', label: '早餐', color: '#F59E0B' },
  { key: 'lunch' as const, icon: '☀️', label: '午餐', color: '#F76707' },
  { key: 'dinner' as const, icon: '🌙', label: '晚餐', color: '#7950F2' },
  { key: 'drinks' as const, icon: '🧋', label: '饮料', color: '#EC4899' },
];

// ── Main ──

export default function DashboardPage() {
  const navigate = useNavigate();
  const greeting = useDailyGreeting();
  const { dashboard, loading, fetchAll, monthlyHeatmap, usageHeatmap, fetchMonthlyHeatmap, fetchUsageHeatmap } = useChartStore();
  const { dashboardEvents, fetchDashboard } = useCountdownStore();
  const { heatmap: emotionHeatmap, fetchHeatmap } = useEmotionStore();
  const { importFocusRecords, importing } = usePlanStore();
  const { message } = App.useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Meal state — with date browsing
  const { todayMeal, currentMeal, fetchToday, fetchByDate, fetchMealDates, mealDates } = useMealStore();
  const accounts = useFinanceStore((s) => s.accounts);
  const fetchAccounts = useFinanceStore((s) => s.fetchAccounts);
  const [mealDate, setMealDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [mealOpen, setMealOpen] = useState(false);

  useEffect(() => {
    fetchAll();
    fetchMonthlyHeatmap();
    fetchUsageHeatmap();
    fetchDashboard();
    fetchToday();
    fetchHeatmap(new Date().getFullYear());
    fetchMealDates();
    if (accounts.length === 0) fetchAccounts();
  }, []);

  // Load meal for browsed date
  useEffect(() => {
    fetchByDate(mealDate);
  }, [mealDate]);

  const displayMeal: DailyMeal | null = mealDate === dayjs().format('YYYY-MM-DD') ? todayMeal : currentMeal;

  const todayStr = useMemo(() => {
    const d = dayjs();
    return d.format('M月D日') + ' · 周' + ['日', '一', '二', '三', '四', '五', '六'][d.day()];
  }, []);

  const streak = useMemo(() => {
    if (!usageHeatmap || usageHeatmap.length === 0) return 0;
    let count = 0;
    let d = dayjs();
    for (let i = 0; i < 365; i++) {
      const dateStr = d.format('YYYY-MM-DD');
      const found = usageHeatmap.some((h: any) => h.date === dateStr && h.minutes > 0);
      if (found) { count++; d = d.subtract(1, 'day'); }
      else break;
    }
    return count;
  }, [usageHeatmap]);

  const isMealToday = mealDate === dayjs().format('YYYY-MM-DD');

  const navigateMealDate = (delta: number) => {
    setMealDate((prev) => dayjs(prev).add(delta, 'day').format('YYYY-MM-DD'));
  };

  const getAccountName = (accountId: string) => {
    if (!accountId) return '';
    const a = accounts.find((x) => x.id === accountId);
    return a ? a.name : '';
  };

  const totalMealCost = useMemo(() => {
    if (!displayMeal) return 0;
    return (displayMeal.breakfast_cost || 0) + (displayMeal.lunch_cost || 0) + (displayMeal.dinner_cost || 0) + (displayMeal.drinks_cost || 0);
  }, [displayMeal]);

  const hasMealDates = mealDates.length > 0;

  // ── Import handler ──
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      // Parse records from row 5 onward
      const records: ImportFocusRecord[] = [];
      for (let i = 5; i < data.length; i++) {
        const row = data[i];
        if (!row[0] || !row[1]) continue;
        const timeRange = String(row[0]).trim();
        const todoName = String(row[1]).trim();
        const duration = parseInt(row[2]) || 0;
        const match = timeRange.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s*至\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);
        if (!match) continue;
        const startTime = match[1].slice(11, 16); // HH:MM
        const endTime = match[2].slice(11, 16);   // HH:MM
        const date = match[1].slice(0, 10);       // YYYY-MM-DD
        records.push({ date, todo_name: todoName, start_time: startTime, end_time: endTime, duration_minutes: duration });
      }

      if (records.length === 0) {
        message.warning('未在文件中识别到有效记录');
        return;
      }

      const result = await importFocusRecords(records);
      message.success(result);
      // Refresh dashboard data
      fetchAll();
      fetchMonthlyHeatmap();
      fetchUsageHeatmap();
    } catch (err: any) {
      message.error('导入失败：' + (err?.message || err?.toString?.() || '未知错误'));
    } finally {
      // Reset file input so the same file can be imported again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading && !dashboard) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
            {greeting}
          </h1>
          <Text style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
            {todayStr}
          </Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {streak > 0 && (
            <Tag style={{ borderRadius: 8, background: 'var(--color-fill)', border: 'none', color: '#2563EB', fontSize: 12, padding: '2px 12px' }}>
              🔥 连续 {streak} 天
            </Tag>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div onClick={() => navigate('/memories')} style={{
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              padding: '6px 14px', borderRadius: 20,
              background: 'var(--bg-muted)', transition: 'all 0.15s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-fill)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-muted)'; }}
            >
              <BulbOutlined style={{ fontSize: 14, color: '#8B5CF6' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>记忆</span>
            </div>
            <div onClick={handleImportClick} style={{
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              padding: '6px 14px', borderRadius: 20,
              background: 'var(--bg-muted)', transition: 'all 0.15s', opacity: importing ? 0.6 : 1,
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-fill)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-muted)'; }}
            >
              <ImportOutlined style={{ fontSize: 14, color: '#10B981' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{importing ? '导入中…' : '导入'}</span>
            </div>
            <div onClick={() => navigate('/badges')} style={{
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              padding: '6px 14px', borderRadius: 20,
              background: 'var(--bg-muted)', transition: 'all 0.15s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-fill)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-muted)'; }}
            >
              <TrophyOutlined style={{ fontSize: 14, color: '#F59E0B' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>勋章</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>

        {/* Row 1: Task progress + Quick Actions — unified card */}
        <BentoCard style={{ padding: '20px 24px', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {/* Task progress */}
            <div style={{ flex: '0 0 auto', minWidth: 180, cursor: 'pointer' }} onClick={() => navigate('/plan')}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {dashboard ? dashboard.today_completed : '—'}
                </span>
                <span style={{ fontSize: 15, color: 'var(--text-muted)', fontWeight: 400 }}>
                  / {dashboard ? dashboard.today_total : '—'} 项
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>今日任务</div>
              {/* Progress bar */}
              <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-muted)', overflow: 'hidden', width: '100%', maxWidth: 200 }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: `${dashboard ? Math.min(Math.round(dashboard.today_completion_rate * 100), 100) : 0}%`,
                  background: 'linear-gradient(90deg, #059669, #10B981)',
                  transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
                }} />
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 48, background: 'var(--border-subtle)', flexShrink: 0 }} />

            {/* Completion rate */}
            <div style={{ flex: '0 0 auto', textAlign: 'center', minWidth: 80 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', margin: '0 auto 6px',
                background: `conic-gradient(#2563EB ${dashboard ? Math.round(dashboard.today_completion_rate * 100) : 0}%, var(--bg-muted) 0%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: 'var(--bg-card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 700, color: '#2563EB',
                }}>
                  {dashboard ? Math.round(dashboard.today_completion_rate * 100) : '—'}
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>完成率</div>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 48, background: 'var(--border-subtle)', flexShrink: 0 }} />

            {/* Quick actions */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {[
                { icon: <PlusOutlined />, label: '添加任务', path: '/plan', color: '#059669' },
                { icon: <CalendarOutlined />, label: '今日计划', path: '/plan', color: '#3B82F6' },
                { icon: <ThunderboltOutlined />, label: '时间线', path: '/timeline', color: '#7C3AED' },
                { icon: <FileTextOutlined />, label: '周报', path: '/report', color: '#0891B2' },
              ].map((a) => (
                <div key={a.path} onClick={() => navigate(a.path)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
                  background: 'transparent', transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-muted)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 14, color: a.color, display: 'flex' }}>{a.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{a.label}</span>
                </div>
              ))}
            </div>
          </div>
        </BentoCard>

        {/* Row 2: Meals — full width, with date navigation */}
        <BentoCard style={{ padding: '18px 22px', gridColumn: '1 / -1' }}>
          {/* Meal header with date nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🍽️</span>
              <Text strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>饮食记录</Text>
              {totalMealCost > 0 && (
                <Text style={{ fontSize: 12, color: '#F76707', fontWeight: 600, background: '#FFF3E0', padding: '1px 8px', borderRadius: 6 }}>
                  ¥{totalMealCost.toFixed(1)}
                </Text>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Button type="text" size="small" icon={<LeftOutlined style={{ fontSize: 10 }} />} onClick={() => navigateMealDate(-1)} />
              <Text style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, minWidth: 70, textAlign: 'center' }}>
                {isMealToday ? '今天' : dayjs(mealDate).format('M月D日')}
              </Text>
              <Button type="text" size="small" icon={<RightOutlined style={{ fontSize: 10 }} />} onClick={() => navigateMealDate(1)} />
              {!isMealToday && (
                <Button type="link" size="small" onClick={() => setMealDate(dayjs().format('YYYY-MM-DD'))} style={{ fontSize: 11, padding: 0 }}>
                  今天
                </Button>
              )}
              <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => setMealOpen(true)} style={{ borderRadius: 8, marginLeft: 8 }}>
                记录
              </Button>
            </div>
          </div>

          {/* Three meals in a compact row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {MEAL_META.map(({ key, icon, label, color }) => {
              const m = displayMeal;
              const content = m ? (m as any)[key] || '' : '';
              const cost = m ? (m as any)[`${key}_cost`] || 0 : 0;
              const acctId = m ? (m as any)[`${key}_account_id`] || '' : '';

              return (
                <div key={key} style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: content ? 'var(--bg-card)' : 'var(--bg-muted)',
                  border: content ? '1px solid var(--color-border)' : '1px dashed var(--color-border)',
                  cursor: 'pointer', transition: 'all 0.15s',
                  minHeight: 56,
                }}
                  onClick={() => setMealOpen(true)}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = content ? 'var(--color-border)' : 'var(--color-border)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: content ? 6 : 0 }}>
                    <span style={{ fontSize: 14 }}>{icon}</span>
                    <Text style={{ fontSize: 11, fontWeight: 600, color }}>{label}</Text>
                    {cost > 0 && (
                      <Text style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginLeft: 'auto' }}>¥{cost.toFixed(1)}</Text>
                    )}
                  </div>
                  <Text style={{
                    fontSize: 12, color: content ? 'var(--text-primary)' : 'var(--text-muted)',
                    lineHeight: 1.4, fontWeight: content ? 500 : 400,
                    fontStyle: content ? 'normal' : 'italic',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    display: 'block',
                  }}>
                    {content || '点击记录'}
                  </Text>
                  {cost > 0 && acctId && (
                    <Text style={{ fontSize: 10, color: 'var(--text-muted)' }}>{getAccountName(acctId)}</Text>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mini date dots — quick jump to dates with meals */}
          {hasMealDates && (
            <div style={{ display: 'flex', gap: 3, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 4 }}>历史:</Text>
              {mealDates.slice(0, 14).map((d) => (
                <div
                  key={d}
                  onClick={() => setMealDate(d)}
                  title={d}
                  style={{
                    width: 7, height: 7, borderRadius: '50%', cursor: 'pointer',
                    background: d === mealDate ? '#F59E0B' : 'var(--text-muted)',
                    opacity: d === mealDate ? 1 : 0.4,
                    transition: 'all 0.15s',
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          )}
        </BentoCard>

        {/* Row 3: Countdown (span 2) + Emotion (span 1) */}
        <BentoCard style={{ padding: '18px 22px', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text strong style={{ fontSize: 14 }}>
              <HourglassOutlined style={{ marginRight: 6, color: '#EC4899' }} />倒数日
            </Text>
            <Button type="link" size="small" onClick={() => navigate('/countdown')} style={{ fontSize: 11, padding: 0 }}>管理 →</Button>
          </div>
          {dashboardEvents.length === 0 ? (
            <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>暂无倒数日</Text>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dashboardEvents.slice(0, 5).map((event) => {
                const display = toDisplayEvent(event);
                return (
                  <div key={display.id} onClick={() => navigate('/countdown')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-muted)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{display.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{event.target_date}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.1, color: display.displayType === 'today' ? '#2563EB' : display.displayType === 'remaining' ? display.categoryColor : 'var(--text-muted)' }}>
                        {display.displayType === 'today' ? '今' : display.displayType === 'remaining' ? display.daysRemaining : `+${Math.abs(display.daysRemaining)}`}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{display.displayText}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </BentoCard>

        <BentoCard style={{ padding: '18px 22px' }}>
          <Text strong style={{ fontSize: 14, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
            🎨 情绪
          </Text>
          <EmotionHeatmap data={emotionHeatmap} year={new Date().getFullYear()} />
        </BentoCard>

        {/* Row 4: Heatmap full width */}
        <BentoCard style={{ padding: '18px 24px', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>📅 活跃热力图 · 近3个月</Text>
            <Button type="link" onClick={() => navigate('/stats')} style={{ padding: 0, fontWeight: 500, fontSize: 12 }}>完整统计 →</Button>
          </div>
          <ContributionHeatmap tasks={monthlyHeatmap} usage={usageHeatmap} year={new Date().getFullYear()} />
        </BentoCard>
      </div>

      <MealModal
        open={mealOpen}
        date={mealDate}
        onClose={() => {
          setMealOpen(false);
          fetchByDate(mealDate);
          if (mealDate === dayjs().format('YYYY-MM-DD')) fetchToday();
          fetchMealDates();
        }}
      />

      {/* Hidden file input for focus record import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}
