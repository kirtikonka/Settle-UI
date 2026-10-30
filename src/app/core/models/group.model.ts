import { User } from './user.model';

export type GroupCategory = 'trip' | 'home' | 'couple' | 'other' | 'project';

export interface GroupMember extends User {
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  category: GroupCategory;
  avatarUrl?: string;
  members: GroupMember[];
  createdBy: string;
  createdAt: string;
  simplifyDebtsDefault?: boolean;
}

export interface SimplifiedDebt {
  fromUser: User;
  toUser: User;
  amount: number;
}
