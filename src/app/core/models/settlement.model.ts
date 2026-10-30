export interface Settlement {
  id: string;
  fromUserId: string; // The person who paid
  toUserId: string;   // The person who received
  amount: number;
  date: string;
  notes?: string;
  groupId?: string;
  paymentMethod?: 'cash' | 'upi' | 'venmo' | 'paypal' | 'bank_transfer' | 'other';
  createdAt: string;
}
