import { create } from 'zustand';
import { financeService } from '@/services/financeService';
import type {
  TransactionCategory,
  Account,
  Transaction,
  TransactionFilter,
  FinanceStats,
  MonthlyChartData,
  CategoryStat,
  DailyHeatmapCell,
  NetWorthPoint,
  CreateAccountParams,
  UpdateAccountParams,
  CreateTransactionParams,
  UpdateTransactionParams,
  TransactionDisplay,
} from '@/types/finance';

interface FinanceState {
  // Data
  categories: TransactionCategory[];
  accounts: Account[];
  transactions: Transaction[];
  stats: FinanceStats | null;
  monthlyChart: MonthlyChartData[];
  categoryStats: CategoryStat[];
  heatmap: DailyHeatmapCell[];
  netWorthTrend: NetWorthPoint[];

  // UI
  loading: boolean;
  error: string | null;
  currentYear: number;
  currentMonth: number;

  // Computed
  displayTransactions: () => TransactionDisplay[];

  // Actions
  fetchAll: (year?: number, month?: number) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchAccounts: () => Promise<void>;
  fetchTransactions: (filter: TransactionFilter) => Promise<void>;
  fetchStats: (year: number, month: number) => Promise<void>;
  fetchCharts: (year: number, month: number) => Promise<void>;

  createAccount: (params: CreateAccountParams) => Promise<void>;
  updateAccount: (id: string, params: UpdateAccountParams) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  createTransaction: (params: CreateTransactionParams) => Promise<void>;
  updateTransaction: (id: string, params: UpdateTransactionParams) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  setMonth: (year: number, month: number) => void;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  categories: [],
  accounts: [],
  transactions: [],
  stats: null,
  monthlyChart: [],
  categoryStats: [],
  heatmap: [],
  netWorthTrend: [],
  loading: false,
  error: null,
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth() + 1,

  displayTransactions: () => {
    const { transactions, categories, accounts } = get();
    return transactions.map((t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      const acc = accounts.find((a) => a.id === t.account_id);
      const targetAcc = t.target_account_id
        ? accounts.find((a) => a.id === t.target_account_id)
        : undefined;
      return {
        ...t,
        category_name: cat?.name ?? '未知',
        category_icon: cat?.icon ?? 'QuestionCircleOutlined',
        category_color: cat?.color ?? '#868E96',
        account_name: acc?.name ?? '未知',
        target_account_name: targetAcc?.name,
      };
    });
  },

  fetchAll: async (year?: number, month?: number) => {
    const y = year ?? get().currentYear;
    const m = month ?? get().currentMonth;
    set({ loading: true, error: null });
    try {
      const [categories, accounts, transactions, stats, monthlyChart, categoryStats, heatmap] =
        await Promise.all([
          financeService.listCategories(),
          financeService.listAccounts(),
          financeService.listTransactions({ year: y, month: m }),
          financeService.getStats(y, m),
          financeService.getMonthlyChart(y),
          financeService.getCategoryStats(y, m),
          financeService.getDailyHeatmap(y, m),
        ]);
      const netWorthTrend = await financeService.getNetWorthTrend();
      set({ categories, accounts, transactions, stats, monthlyChart, categoryStats, heatmap, netWorthTrend, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  fetchCategories: async () => {
    const categories = await financeService.listCategories();
    set({ categories });
  },

  fetchAccounts: async () => {
    const accounts = await financeService.listAccounts();
    set({ accounts });
  },

  fetchTransactions: async (filter) => {
    const transactions = await financeService.listTransactions(filter);
    set({ transactions });
  },

  fetchStats: async (year, month) => {
    const stats = await financeService.getStats(year, month);
    set({ stats });
  },

  fetchCharts: async (year, month) => {
    const [monthlyChart, categoryStats, heatmap] = await Promise.all([
      financeService.getMonthlyChart(year),
      financeService.getCategoryStats(year, month),
      financeService.getDailyHeatmap(year, month),
    ]);
    set({ monthlyChart, categoryStats, heatmap });
  },

  createAccount: async (params) => {
    await financeService.createAccount(params);
    await get().fetchAccounts();
    await get().fetchStats(get().currentYear, get().currentMonth);
  },

  updateAccount: async (id, params) => {
    await financeService.updateAccount(id, params);
    await get().fetchAccounts();
    await get().fetchStats(get().currentYear, get().currentMonth);
  },

  deleteAccount: async (id) => {
    await financeService.deleteAccount(id);
    await get().fetchAccounts();
    await get().fetchStats(get().currentYear, get().currentMonth);
  },

  createTransaction: async (params) => {
    await financeService.createTransaction(params);
    const { currentYear, currentMonth } = get();
    await Promise.all([
      get().fetchTransactions({ year: currentYear, month: currentMonth }),
      get().fetchStats(currentYear, currentMonth),
      get().fetchAccounts(),
      get().fetchCharts(currentYear, currentMonth),
    ]);
  },

  updateTransaction: async (id, params) => {
    await financeService.updateTransaction(id, params);
    const { currentYear, currentMonth } = get();
    await Promise.all([
      get().fetchTransactions({ year: currentYear, month: currentMonth }),
      get().fetchStats(currentYear, currentMonth),
      get().fetchAccounts(),
      get().fetchCharts(currentYear, currentMonth),
    ]);
  },

  deleteTransaction: async (id) => {
    await financeService.deleteTransaction(id);
    const { currentYear, currentMonth } = get();
    await Promise.all([
      get().fetchTransactions({ year: currentYear, month: currentMonth }),
      get().fetchStats(currentYear, currentMonth),
      get().fetchAccounts(),
      get().fetchCharts(currentYear, currentMonth),
    ]);
  },

  setMonth: (year, month) => {
    set({ currentYear: year, currentMonth: month });
  },
}));
