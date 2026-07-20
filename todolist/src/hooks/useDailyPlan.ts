import { useEffect } from 'react';
import { usePlanStore } from '@/stores/planStore';
import { todayStr } from '@/utils/date';

/**
 * 初始化/切换日期时自动加载每日计划
 */
export function useDailyPlan(date?: string) {
  const { currentPlan, loading, fetchPlan, selectedDate, setSelectedDate } = usePlanStore();

  useEffect(() => {
    const d = date || selectedDate || todayStr();
    fetchPlan(d);
  }, [date, selectedDate]);

  return { currentPlan, loading, refetch: () => fetchPlan(selectedDate) };
}
