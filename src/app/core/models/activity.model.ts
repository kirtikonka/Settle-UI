export type ActivityType =
  | 'expense_added'
  | 'expense_updated'
  | 'expense_deleted'
  | 'settlement_added'
  | 'group_created'
  | 'friend_added';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  actorId: string;
  actorName: string;
  title: string;
  description?: string;
  amount?: number;
  currency?: string;
  targetId?: string; // expenseId, settlementId, or groupId
  groupId?: string;
  groupName?: string;
  timestamp: string;
}
