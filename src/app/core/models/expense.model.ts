export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENT' | 'SHARES';

export type ExpenseCategory =
  | 'food'
  | 'groceries'
  | 'entertainment'
  | 'transport'
  | 'utilities'
  | 'rent'
  | 'shopping'
  | 'travel'
  | 'general';

export interface ExpenseSplit {
  userId: string;
  amount: number;
  percentage?: number;
  shares?: number;
  isIncluded: boolean;
}

export interface ExpensePayer {
  userId: string;
  amount: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  date: string;
  notes?: string;
  groupId?: string;
  paidBy: ExpensePayer[];
  splits: ExpenseSplit[];
  splitType: SplitType;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}
