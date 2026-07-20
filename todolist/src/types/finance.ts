// ─── 分类 ───
export interface TransactionCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  created_at: string;
}

export const FINANCE_CATEGORY_ICONS: Record<string, string> = {
  '学习': 'ReadOutlined',
  '餐饮': 'ShopOutlined',
  '购物': 'ShoppingCartOutlined',
  '交通': 'CarOutlined',
  '娱乐': 'SmileOutlined',
  '医疗': 'MedicineBoxOutlined',
  '服务': 'ToolOutlined',
  '转账': 'SwapOutlined',
  '借款': 'HandshakeOutlined',
  '红包': 'GiftOutlined',
  '生活缴费': 'ThunderboltOutlined',
  '其他': 'EllipsisOutlined',
};

// ─── 账户 ───
export interface Account {
  id: string;
  name: string;
  balance: number;
  is_savings: boolean;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountParams {
  name: string;
  balance?: number;
  is_savings?: boolean;
  color?: string;
}

export interface UpdateAccountParams {
  name?: string;
  balance?: number;
  is_savings?: boolean;
  color?: string;
}

// ─── 交易 ───
export type TransactionType = 'expense' | 'income' | 'transfer_out' | 'transfer_in';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category_id: number;
  account_id: string;
  target_account_id?: string;
  transfer_id?: string;
  date: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionParams {
  type: TransactionType;
  amount: number;
  category_id: number;
  account_id: string;
  target_account_id?: string;
  date: string;
  note?: string;
}

export interface UpdateTransactionParams {
  type?: TransactionType;
  amount?: number;
  category_id?: number;
  account_id?: string;
  date?: string;
  note?: string;
}

export interface TransactionFilter {
  year?: number;
  month?: number;
  category_id?: number;
  account_id?: string;
  type?: TransactionType;
  keyword?: string;
}

// ─── 统计 ───
export interface FinanceStats {
  monthly_expense: number;
  monthly_income: number;
  savings_total: number;
  net_worth: number;
  expense_count: number;
  income_count: number;
  savings_count: number;
}

export interface MonthlyChartData {
  month: string;
  expense: number;
  income: number;
}

export interface CategoryStat {
  category_id: number;
  category_name: string;
  category_color: string;
  total: number;
  count: number;
}

export interface DailyHeatmapCell {
  date: string;
  expense: number;
}

export interface NetWorthPoint {
  month: string;
  net_worth: number;
}

// ─── 用于 UI 展示的增强类型 ───
export interface TransactionDisplay extends Transaction {
  category_name: string;
  category_icon: string;
  category_color: string;
  account_name: string;
  target_account_name?: string;
}
