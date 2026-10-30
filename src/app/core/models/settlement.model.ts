export interface Settlement {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  date: string;
  notes?: string;
  groupId?: string;
  paymentMethod?: 'cash' | 'upi' | 'venmo' | 'paypal' | 'bank_transfer' | 'other';
  createdAt: string;
}
