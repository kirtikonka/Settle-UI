import { Injectable, computed, inject, signal } from '@angular/core';
import { User, Friend } from '../models/user.model';
import { Group, SimplifiedDebt } from '../models/group.model';
import { Expense } from '../models/expense.model';
import { Settlement } from '../models/settlement.model';
import { ActivityItem } from '../models/activity.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class SettleService {
  private readonly api = inject(ApiService);

  readonly currentUser = signal<User>({
    id: 'user-me',
    name: '',
    email: '',
  });

  readonly rawFriends = signal<User[]>([]);
  readonly groups = signal<Group[]>([]);
  readonly expenses = signal<Expense[]>([]);
  readonly settlements = signal<Settlement[]>([]);
  readonly activities = signal<ActivityItem[]>([]);
  readonly currency = signal<string>('USD');

  constructor() {
    this.loadAll();
  }

  // --- Computed Balances ---

  readonly friends = computed<Friend[]>(() => {
    const raw = this.rawFriends();
    const myId = this.currentUser().id;
    const allExpenses = this.expenses();
    const allSettlements = this.settlements();

    return raw.map((friend) => {
      const balance = this.calculateNetBalanceBetween(myId, friend.id, allExpenses, allSettlements);
      return {
        ...friend,
        balance: Math.round(balance * 100) / 100,
      };
    });
  });

  readonly totalOwedToYou = computed<number>(() => {
    return this.friends()
      .filter((f) => f.balance > 0)
      .reduce((sum, f) => sum + f.balance, 0);
  });

  readonly totalYouOwe = computed<number>(() => {
    return this.friends()
      .filter((f) => f.balance < 0)
      .reduce((sum, f) => sum + Math.abs(f.balance), 0);
  });

  readonly netBalance = computed<number>(() => {
    return Math.round((this.totalOwedToYou() - this.totalYouOwe()) * 100) / 100;
  });

  readonly recentExpenses = computed<Expense[]>(() => {
    return [...this.expenses()].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });

  readonly recentActivities = computed<ActivityItem[]>(() => {
    return [...this.activities()].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  });

  // --- Calculations ---

  calculateNetBalanceBetween(
    userAId: string,
    userBId: string,
    expensesList: Expense[] = this.expenses(),
    settlementsList: Settlement[] = this.settlements()
  ): number {
    let balance = 0;

    for (const exp of expensesList) {
      const payerA = exp.paidBy.find((p) => p.userId === userAId)?.amount || 0;
      const payerB = exp.paidBy.find((p) => p.userId === userBId)?.amount || 0;

      const splitA = exp.splits.find((s) => s.userId === userAId && s.isIncluded)?.amount || 0;
      const splitB = exp.splits.find((s) => s.userId === userBId && s.isIncluded)?.amount || 0;

      if (payerA > 0 && splitB > 0) {
        const ratio = payerA / exp.amount;
        balance += splitB * ratio;
      }

      if (payerB > 0 && splitA > 0) {
        const ratio = payerB / exp.amount;
        balance -= splitA * ratio;
      }
    }

    for (const set of settlementsList) {
      if (set.fromUserId === userBId && set.toUserId === userAId) {
        balance -= set.amount;
      } else if (set.fromUserId === userAId && set.toUserId === userBId) {
        balance += set.amount;
      }
    }

    return balance;
  }

  getExpensesWithFriend(friendId: string): Expense[] {
    const myId = this.currentUser().id;
    return this.expenses().filter((exp) => {
      const involvesMe = exp.paidBy.some((p) => p.userId === myId) || exp.splits.some((s) => s.userId === myId);
      const involvesFriend = exp.paidBy.some((p) => p.userId === friendId) || exp.splits.some((s) => s.userId === friendId);
      return involvesMe && involvesFriend;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getSettlementsWithFriend(friendId: string): Settlement[] {
    const myId = this.currentUser().id;
    return this.settlements().filter(
      (s) =>
        (s.fromUserId === myId && s.toUserId === friendId) ||
        (s.fromUserId === friendId && s.toUserId === myId)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getGroupExpenses(groupId: string): Expense[] {
    return this.expenses()
      .filter((exp) => exp.groupId === groupId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getGroupMemberBalances(groupId: string): { user: User; balance: number }[] {
    const group = this.groups().find((g) => g.id === groupId);
    if (!group) return [];

    const groupExpenses = this.getGroupExpenses(groupId);
    const groupSettlements = this.settlements().filter((s) => s.groupId === groupId);

    const netBalances: Record<string, number> = {};
    group.members.forEach((m) => (netBalances[m.id] = 0));

    for (const exp of groupExpenses) {
      for (const payer of exp.paidBy) {
        if (netBalances[payer.userId] !== undefined) {
          netBalances[payer.userId] += payer.amount;
        }
      }
      for (const split of exp.splits) {
        if (split.isIncluded && netBalances[split.userId] !== undefined) {
          netBalances[split.userId] -= split.amount;
        }
      }
    }

    for (const set of groupSettlements) {
      if (netBalances[set.fromUserId] !== undefined) {
        netBalances[set.fromUserId] += set.amount;
      }
      if (netBalances[set.toUserId] !== undefined) {
        netBalances[set.toUserId] -= set.amount;
      }
    }

    return group.members.map((member) => ({
      user: member,
      balance: Math.round((netBalances[member.id] || 0) * 100) / 100,
    }));
  }

  simplifyGroupDebts(groupId: string): SimplifiedDebt[] {
    const memberBalances = this.getGroupMemberBalances(groupId);
    const debtors: { user: User; amount: number }[] = [];
    const creditors: { user: User; amount: number }[] = [];

    for (const mb of memberBalances) {
      if (mb.balance < -0.01) {
        debtors.push({ user: mb.user, amount: Math.abs(mb.balance) });
      } else if (mb.balance > 0.01) {
        creditors.push({ user: mb.user, amount: mb.balance });
      }
    }

    const simplified: SimplifiedDebt[] = [];

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const transferAmount = Math.min(debtor.amount, creditor.amount);

      if (transferAmount > 0.01) {
        simplified.push({
          fromUser: debtor.user,
          toUser: creditor.user,
          amount: Math.round(transferAmount * 100) / 100,
        });
      }

      debtor.amount -= transferAmount;
      creditor.amount -= transferAmount;

      if (debtor.amount <= 0.01) dIdx++;
      if (creditor.amount <= 0.01) cIdx++;
    }

    return simplified;
  }

  // --- Actions ---

  addExpense(expenseData: Omit<Expense, 'id' | 'createdAt'>): Expense {
    const tempId = 'exp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const optimistic: Expense = {
      ...expenseData,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    this.expenses.update((list) => [optimistic, ...list]);

    this.api.addExpense(expenseData).subscribe((saved) => {
      this.expenses.update((list) =>
        list.map((e) => (e.id === tempId ? saved : e))
      );
      this.reloadActivities();
    });

    return optimistic;
  }

  updateExpense(id: string, updatedFields: Partial<Expense>): void {
    this.expenses.update((list) =>
      list.map((exp) => (exp.id === id ? { ...exp, ...updatedFields, updatedAt: new Date().toISOString() } : exp))
    );

    this.api.updateExpense(id, updatedFields).subscribe((saved) => {
      this.expenses.update((list) =>
        list.map((e) => (e.id === id ? saved : e))
      );
      this.reloadActivities();
    });
  }

  deleteExpense(id: string): void {
    const prev = this.expenses();
    this.expenses.update((list) => list.filter((e) => e.id !== id));

    this.api.deleteExpense(id).subscribe({
      next: () => this.reloadActivities(),
      error: () => this.expenses.set(prev),
    });
  }

  settleDebt(settlementData: Omit<Settlement, 'id' | 'createdAt'>): Settlement {
    const tempId = 'set-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const optimistic: Settlement = {
      ...settlementData,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    this.settlements.update((list) => [optimistic, ...list]);

    this.api.addSettlement(settlementData).subscribe((saved) => {
      this.settlements.update((list) =>
        list.map((s) => (s.id === tempId ? saved : s))
      );
      this.reloadActivities();
    });

    return optimistic;
  }

  addGroup(groupData: Omit<Group, 'id' | 'createdAt'>): Group {
    const tempId = 'grp-' + Date.now();
    const optimistic: Group = {
      ...groupData,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    this.groups.update((list) => [optimistic, ...list]);

    this.api.createGroup(groupData).subscribe((saved) => {
      this.groups.update((list) =>
        list.map((g) => (g.id === tempId ? saved : g))
      );
      this.reloadActivities();
    });

    return optimistic;
  }

  addFriend(friendData: Omit<User, 'id'>): User {
    const tempId = 'usr-' + Date.now();
    const optimistic: User = {
      ...friendData,
      id: tempId,
      avatarUrl:
        friendData.avatarUrl ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(friendData.name)}&backgroundColor=1cc29f`,
    };

    this.rawFriends.update((list) => [optimistic, ...list]);

    this.api.addFriend(friendData).subscribe((saved) => {
      this.rawFriends.update((list) =>
        list.map((f) => (f.id === tempId ? saved : f))
      );
      this.reloadActivities();
    });

    return optimistic;
  }

  getUserById(userId: string): User | undefined {
    if (userId === this.currentUser().id) return this.currentUser();
    const friend = this.rawFriends().find((f) => f.id === userId);
    if (friend) return friend;

    for (const group of this.groups()) {
      const member = group.members.find((m) => m.id === userId);
      if (member) return member;
    }

    return undefined;
  }

  getGroupById(groupId: string): Group | undefined {
    return this.groups().find((g) => g.id === groupId);
  }

  resetDemoData(): void {
    this.api.resetData().subscribe(() => {
      this.loadAll();
    });
  }

  // --- Data Loading ---

  private loadAll(): void {
    this.api.getCurrentUser().subscribe((user) => this.currentUser.set(user));
    this.api.getFriends().subscribe((friends) => this.rawFriends.set(friends));
    this.api.getGroups().subscribe((groups) => this.groups.set(groups));
    this.api.getExpenses().subscribe((expenses) => this.expenses.set(expenses));
    this.api.getSettlements().subscribe((settlements) => this.settlements.set(settlements));
    this.api.getActivities().subscribe((activities) => this.activities.set(activities));
  }

  private reloadActivities(): void {
    this.api.getActivities().subscribe((activities) => this.activities.set(activities));
  }
}

export { SettleService as SplitwiseService };
