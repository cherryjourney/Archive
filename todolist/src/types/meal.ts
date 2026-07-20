export interface MealPayment {
  cost: number;
  account_id: string;
  txn_id: string;
}

export interface MealPaymentInput {
  cost: number;
  account_id: string;
}

export interface DailyMeal {
  date: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  drinks: string;
  breakfast_cost: number;
  breakfast_account_id: string;
  breakfast_txn_id: string;
  lunch_cost: number;
  lunch_account_id: string;
  lunch_txn_id: string;
  dinner_cost: number;
  dinner_account_id: string;
  dinner_txn_id: string;
  drinks_cost: number;
  drinks_account_id: string;
  drinks_txn_id: string;
  created_at: string;
  updated_at: string;
}

export interface SaveMealParams {
  date: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  drinks: string;
  breakfast_payment?: MealPaymentInput;
  lunch_payment?: MealPaymentInput;
  dinner_payment?: MealPaymentInput;
  drinks_payment?: MealPaymentInput;
}
