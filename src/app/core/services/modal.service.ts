import { Injectable, signal } from '@angular/core';

export interface AddExpenseModalData {
  groupId?: string;
  friendId?: string;
}

export interface SettleUpModalData {
  friendId?: string;
  groupId?: string;
  amount?: number;
  toUserId?: string;
  fromUserId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  readonly isAddExpenseOpen = signal<boolean>(false);
  readonly addExpenseData = signal<AddExpenseModalData | null>(null);

  readonly isSettleUpOpen = signal<boolean>(false);
  readonly settleUpData = signal<SettleUpModalData | null>(null);

  readonly isCreateGroupOpen = signal<boolean>(false);
  readonly isAddFriendOpen = signal<boolean>(false);

  openAddExpense(data?: AddExpenseModalData): void {
    this.addExpenseData.set(data || null);
    this.isAddExpenseOpen.set(true);
  }

  closeAddExpense(): void {
    this.isAddExpenseOpen.set(false);
    this.addExpenseData.set(null);
  }

  openSettleUp(data?: SettleUpModalData): void {
    this.settleUpData.set(data || null);
    this.isSettleUpOpen.set(true);
  }

  closeSettleUp(): void {
    this.isSettleUpOpen.set(false);
    this.settleUpData.set(null);
  }

  openCreateGroup(): void {
    this.isCreateGroupOpen.set(true);
  }

  closeCreateGroup(): void {
    this.isCreateGroupOpen.set(false);
  }

  openAddFriend(): void {
    this.isAddFriendOpen.set(true);
  }

  closeAddFriend(): void {
    this.isAddFriendOpen.set(false);
  }
}
