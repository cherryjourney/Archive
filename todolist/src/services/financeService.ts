import { invoke } from '@tauri-apps/api/core';
import type {
  TransactionCategory,
  Account,
  CreateAccountParams,
  UpdateAccountParams,
  Transaction,
  CreateTransactionParams,
  UpdateTransactionParams,
  TransactionFilter,
  FinanceStats,
  MonthlyChartData,
  CategoryStat,
  DailyHeatmapCell,
  NetWorthPoint,
} from '@/types/finance';

export const financeService = {
  // 分类
  listCategories: (): Promise<TransactionCategory[]> =>
    invoke('list_transaction_categories'),

  // 账户
  createAccount: (params: CreateAccountParams): Promise<void> => {
    const id = crypto.randomUUID();
    return invoke('create_account', { id, params });
  },

  updateAccount: (id: string, params: UpdateAccountParams): Promise<void> =>
    invoke('update_account', { id, params }),

  deleteAccount: (id: string): Promise<void> =>
    invoke('delete_account', { id }),

  listAccounts: (): Promise<Account[]> =>
    invoke('list_accounts'),

  // 交易
  createTransaction: (params: CreateTransactionParams): Promise<void> => {
    const id = crypto.randomUUID();
    return invoke('create_transaction', { id, params });
  },

  updateTransaction: (id: string, params: UpdateTransactionParams): Promise<void> =>
    invoke('update_transaction', { id, params }),

  deleteTransaction: (id: string): Promise<void> =>
    invoke('delete_transaction', { id }),

  listTransactions: (filter: TransactionFilter): Promise<Transaction[]> =>
    invoke('list_transactions', { filter }),

  getTransaction: (id: string): Promise<Transaction> =>
    invoke('get_transaction', { id }),

  // 统计
  getStats: (year: number, month: number): Promise<FinanceStats> =>
    invoke('get_finance_stats', { year, month }),

  getMonthlyChart: (year: number): Promise<MonthlyChartData[]> =>
    invoke('get_monthly_chart', { year }),

  getCategoryStats: (year: number, month: number): Promise<CategoryStat[]> =>
    invoke('get_category_stats', { year, month }),

  getDailyHeatmap: (year: number, month: number): Promise<DailyHeatmapCell[]> =>
    invoke('get_daily_heatmap', { year, month }),

  getNetWorthTrend: (): Promise<NetWorthPoint[]> =>
    invoke('get_net_worth_trend'),
};
