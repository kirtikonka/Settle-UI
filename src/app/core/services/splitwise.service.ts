import { Injectable, computed, effect, signal } from '@angular/core';
import { User, Friend } from '../models/user.model';
import { Group, GroupMember, SimplifiedDebt } from '../models/group.model';
import { Expense, ExpenseCategory, ExpensePayer, ExpenseSplit, SplitType } from '../models/expense.model';
import { Settlement } from '../models/settlement.model';
import { ActivityItem } from '../models/activity.model';

const STORAGE_KEY_PREFIX = 'settlewise_state_v1';

@Injectable({
  providedIn: 'root',
})
export class SplitwiseService {
  // Current logged in user
  readonly currentUser = signal<User>({
    id: 'user-me',
    name: 'Kirti',
    email: 'kirti@settlewise.app',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+1 555-0192',
  });

  // Base state signals
  readonly rawFriends = signal<User[]>([]);
  readonly groups = signal<Group[]>([]);
  readonly expenses = signal<Expense[]>([]);
  readonly settlements = signal<Settlement[]>([]);
  readonly activities = signal<ActivityItem[]>([]);
  readonly currency = signal<string>('USD');

  constructor() {
    this.loadState();

    // Auto save to localStorage when state changes
    effect(() => {
      this.saveState();
    });
  }

  // --- Computed Balances ---

  /**
   * Computed list of friends with dynamically calculated balances
   */
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

  /**
   * Total amount people owe to current user
   */
  readonly totalOwedToYou = computed<number>(() => {
    return this.friends()
      .filter((f) => f.balance > 0)
      .reduce((sum, f) => sum + f.balance, 0);
  });

  /**
   * Total amount current user owes to people
   */
  readonly totalYouOwe = computed<number>(() => {
    return this.friends()
      .filter((f) => f.balance < 0)
      .reduce((sum, f) => sum + Math.abs(f.balance), 0);
  });

  /**
   * Overall net balance
   */
  readonly netBalance = computed<number>(() => {
    return Math.round((this.totalOwedToYou() - this.totalYouOwe()) * 100) / 100;
  });

  /**
   * Recent expenses sorted by date
   */
  readonly recentExpenses = computed<Expense[]>(() => {
    return [...this.expenses()].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });

  /**
   * Recent activity feed sorted by timestamp
   */
  readonly recentActivities = computed<ActivityItem[]>(() => {
    return [...this.activities()].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  });

  // --- Calculations ---

  /**
   * Calculates net balance between two users across all expenses and settlements:
   * Positive result: userB owes userA
   * Negative result: userA owes userB
   */
  calculateNetBalanceBetween(
    userAId: string,
    userBId: string,
    expensesList: Expense[] = this.expenses(),
    settlementsList: Settlement[] = this.settlements()
  ): number {
    let balance = 0;

    // 1. Calculate from expenses
    for (const exp of expensesList) {
      // Find what userA paid
      const payerA = exp.paidBy.find((p) => p.userId === userAId)?.amount || 0;
      // Find what userB paid
      const payerB = exp.paidBy.find((p) => p.userId === userBId)?.amount || 0;

      // Find split amounts
      const splitA = exp.splits.find((s) => s.userId === userAId && s.isIncluded)?.amount || 0;
      const splitB = exp.splits.find((s) => s.userId === userBId && s.isIncluded)?.amount || 0;

      // If userA paid for the expense, userB owes userA userB's share of userA's payment
      if (payerA > 0 && splitB > 0) {
        const ratio = payerA / exp.amount;
        balance += splitB * ratio;
      }

      // If userB paid for the expense, userA owes userB userA's share of userB's payment
      if (payerB > 0 && splitA > 0) {
        const ratio = payerB / exp.amount;
        balance -= splitA * ratio;
      }
    }

    // 2. Adjust for settlements (direct payments)
    for (const set of settlementsList) {
      if (set.fromUserId === userBId && set.toUserId === userAId) {
        // userB paid userA, so debt of userB to userA decreases
        balance -= set.amount;
      } else if (set.fromUserId === userAId && set.toUserId === userBId) {
        // userA paid userB, so debt of userA to userB decreases (balance increases towards A)
        balance += set.amount;
      }
    }

    return balance;
  }

  /**
   * Get all expenses involving a specific friend (either direct or in shared groups)
   */
  getExpensesWithFriend(friendId: string): Expense[] {
    const myId = this.currentUser().id;
    return this.expenses().filter((exp) => {
      const involvesMe = exp.paidBy.some((p) => p.userId === myId) || exp.splits.some((s) => s.userId === myId);
      const involvesFriend = exp.paidBy.some((p) => p.userId === friendId) || exp.splits.some((s) => s.userId === friendId);
      return involvesMe && involvesFriend;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Get all settlements between current user and friend
   */
  getSettlementsWithFriend(friendId: string): Settlement[] {
    const myId = this.currentUser().id;
    return this.settlements().filter(
      (s) =>
        (s.fromUserId === myId && s.toUserId === friendId) ||
        (s.fromUserId === friendId && s.toUserId === myId)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Get all expenses for a specific group
   */
  getGroupExpenses(groupId: string): Expense[] {
    return this.expenses()
      .filter((exp) => exp.groupId === groupId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Get net balance for each member within a specific group
   * Positive = member is owed money in group
   * Negative = member owes money in group
   */
  getGroupMemberBalances(groupId: string): { user: User; balance: number }[] {
    const group = this.groups().find((g) => g.id === groupId);
    if (!group) return [];

    const groupExpenses = this.getGroupExpenses(groupId);
    const groupSettlements = this.settlements().filter((s) => s.groupId === groupId);

    const netBalances: Record<string, number> = {};
    group.members.forEach((m) => (netBalances[m.id] = 0));

    // Calculate from expenses
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

    // Calculate from group settlements
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

  /**
   * Splitwise debt simplification algorithm (Min-Cash-Flow)
   * Resolves cyclical debts into minimum number of transactions
   */
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
    const newExpense: Expense = {
      ...expenseData,
      id: 'exp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
    };

    this.expenses.update((list) => [newExpense, ...list]);

    // Find group name if applicable
    let groupName: string | undefined;
    if (newExpense.groupId) {
      groupName = this.groups().find((g) => g.id === newExpense.groupId)?.name;
    }

    this.logActivity({
      type: 'expense_added',
      actorId: this.currentUser().id,
      actorName: this.currentUser().name,
      title: `Added "${newExpense.title}"`,
      description: `${newExpense.paidBy[0]?.amount ? 'Paid ' + this.currency() + ' ' + newExpense.amount : ''}`,
      amount: newExpense.amount,
      currency: newExpense.currency,
      targetId: newExpense.id,
      groupId: newExpense.groupId,
      groupName,
    });

    return newExpense;
  }

  updateExpense(id: string, updatedFields: Partial<Expense>): void {
    this.expenses.update((list) =>
      list.map((exp) => (exp.id === id ? { ...exp, ...updatedFields, updatedAt: new Date().toISOString() } : exp))
    );

    const exp = this.expenses().find((e) => e.id === id);
    if (exp) {
      this.logActivity({
        type: 'expense_updated',
        actorId: this.currentUser().id,
        actorName: this.currentUser().name,
        title: `Updated "${exp.title}"`,
        amount: exp.amount,
        currency: exp.currency,
        targetId: exp.id,
        groupId: exp.groupId,
      });
    }
  }

  deleteExpense(id: string): void {
    const exp = this.expenses().find((e) => e.id === id);
    if (!exp) return;

    this.expenses.update((list) => list.filter((e) => e.id !== id));

    this.logActivity({
      type: 'expense_deleted',
      actorId: this.currentUser().id,
      actorName: this.currentUser().name,
      title: `Deleted "${exp.title}"`,
      amount: exp.amount,
      targetId: id,
    });
  }

  settleDebt(settlementData: Omit<Settlement, 'id' | 'createdAt'>): Settlement {
    const newSettlement: Settlement = {
      ...settlementData,
      id: 'set-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
    };

    this.settlements.update((list) => [newSettlement, ...list]);

    const payer = this.getUserById(newSettlement.fromUserId);
    const receiver = this.getUserById(newSettlement.toUserId);

    this.logActivity({
      type: 'settlement_added',
      actorId: newSettlement.fromUserId,
      actorName: payer?.name || 'Someone',
      title: `${payer?.name || 'User'} paid ${receiver?.name || 'User'}`,
      amount: newSettlement.amount,
      currency: this.currency(),
      targetId: newSettlement.id,
      groupId: newSettlement.groupId,
    });

    return newSettlement;
  }

  addGroup(groupData: Omit<Group, 'id' | 'createdAt'>): Group {
    const newGroup: Group = {
      ...groupData,
      id: 'grp-' + Date.now(),
      createdAt: new Date().toISOString(),
    };

    this.groups.update((list) => [newGroup, ...list]);

    this.logActivity({
      type: 'group_created',
      actorId: this.currentUser().id,
      actorName: this.currentUser().name,
      title: `Created group "${newGroup.name}"`,
      targetId: newGroup.id,
      groupId: newGroup.id,
      groupName: newGroup.name,
    });

    return newGroup;
  }

  addFriend(friendData: Omit<User, 'id'>): User {
    const newFriend: User = {
      ...friendData,
      id: 'usr-' + Date.now(),
      avatarUrl:
        friendData.avatarUrl ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(friendData.name)}&backgroundColor=1cc29f`,
    };

    this.rawFriends.update((list) => [newFriend, ...list]);

    this.logActivity({
      type: 'friend_added',
      actorId: this.currentUser().id,
      actorName: this.currentUser().name,
      title: `Added "${newFriend.name}" as friend`,
      targetId: newFriend.id,
    });

    return newFriend;
  }

  getUserById(userId: string): User | undefined {
    if (userId === this.currentUser().id) return this.currentUser();
    const friend = this.rawFriends().find((f) => f.id === userId);
    if (friend) return friend;

    // Search inside group members
    for (const group of this.groups()) {
      const member = group.members.find((m) => m.id === userId);
      if (member) return member;
    }

    return undefined;
  }

  getGroupById(groupId: string): Group | undefined {
    return this.groups().find((g) => g.id === groupId);
  }

  private logActivity(activity: Omit<ActivityItem, 'id' | 'timestamp'>): void {
    const newActivity: ActivityItem = {
      ...activity,
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
    };
    this.activities.update((list) => [newActivity, ...list]);
  }

  // --- Persistence & Demo Data ---

  private saveState(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}_friends`, JSON.stringify(this.rawFriends()));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}_groups`, JSON.stringify(this.groups()));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}_expenses`, JSON.stringify(this.expenses()));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}_settlements`, JSON.stringify(this.settlements()));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}_activities`, JSON.stringify(this.activities()));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}_currency`, this.currency());
    } catch (e) {
      console.warn('Could not save SettleWise state to localStorage', e);
    }
  }

  private loadState(): void {
    if (typeof localStorage === 'undefined') {
      this.loadDemoData();
      return;
    }

    try {
      const savedFriends = localStorage.getItem(`${STORAGE_KEY_PREFIX}_friends`);
      const savedGroups = localStorage.getItem(`${STORAGE_KEY_PREFIX}_groups`);
      const savedExpenses = localStorage.getItem(`${STORAGE_KEY_PREFIX}_expenses`);
      const savedSettlements = localStorage.getItem(`${STORAGE_KEY_PREFIX}_settlements`);
      const savedActivities = localStorage.getItem(`${STORAGE_KEY_PREFIX}_activities`);
      const savedCurrency = localStorage.getItem(`${STORAGE_KEY_PREFIX}_currency`);

      if (savedFriends && savedExpenses && savedGroups) {
        this.rawFriends.set(JSON.parse(savedFriends));
        this.groups.set(JSON.parse(savedGroups));
        this.expenses.set(JSON.parse(savedExpenses));
        this.settlements.set(savedSettlements ? JSON.parse(savedSettlements) : []);
        this.activities.set(savedActivities ? JSON.parse(savedActivities) : []);
        if (savedCurrency) this.currency.set(savedCurrency);
      } else {
        this.loadDemoData();
      }
    } catch (e) {
      console.warn('Failed to parse saved state, loading default mock data', e);
      this.loadDemoData();
    }
  }

  resetDemoData(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}_friends`);
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}_groups`);
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}_expenses`);
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}_settlements`);
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}_activities`);
    }
    this.loadDemoData();
  }

  private loadDemoData(): void {
    const me = this.currentUser();

    const friendsList: User[] = [
      {
        id: 'usr-alex',
        name: 'Alex Chen',
        email: 'alex.chen@example.com',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        phone: '+1 555-0101',
      },
      {
        id: 'usr-sarah',
        name: 'Sarah Jenkins',
        email: 'sarah.j@example.com',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        phone: '+1 555-0102',
      },
      {
        id: 'usr-michael',
        name: 'Michael Scott',
        email: 'michael.s@example.com',
        avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        phone: '+1 555-0103',
      },
      {
        id: 'usr-priya',
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        phone: '+1 555-0104',
      },
      {
        id: 'usr-david',
        name: 'David Miller',
        email: 'david.m@example.com',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        phone: '+1 555-0105',
      },
    ];

    const toGroupMember = (u: User, role: 'admin' | 'member' = 'member'): GroupMember => ({
      ...u,
      role,
      joinedAt: '2026-01-15T10:00:00.000Z',
    });

    const groupsList: Group[] = [
      {
        id: 'grp-goa',
        name: 'Goa Vacation 🌴',
        description: 'Beach villa, bikes, and party expenses',
        category: 'trip',
        avatarUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=150&auto=format&fit=crop&q=80',
        createdBy: me.id,
        createdAt: '2026-02-10T14:00:00.000Z',
        simplifyDebtsDefault: true,
        members: [
          toGroupMember(me, 'admin'),
          toGroupMember(friendsList[0]), // Alex
          toGroupMember(friendsList[1]), // Sarah
          toGroupMember(friendsList[3]), // Priya
        ],
      },
      {
        id: 'grp-apt',
        name: 'Apartment 402 🏠',
        description: 'Rent, electricity, WiFi, and flat essentials',
        category: 'home',
        avatarUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=150&auto=format&fit=crop&q=80',
        createdBy: 'usr-michael',
        createdAt: '2026-01-01T08:00:00.000Z',
        simplifyDebtsDefault: true,
        members: [
          toGroupMember(me),
          toGroupMember(friendsList[2], 'admin'), // Michael
          toGroupMember(friendsList[4]), // David
        ],
      },
      {
        id: 'grp-diners',
        name: 'Weekend Diners 🍕',
        description: 'Good food & weekend hangouts',
        category: 'other',
        avatarUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=80',
        createdBy: me.id,
        createdAt: '2026-02-20T19:00:00.000Z',
        simplifyDebtsDefault: false,
        members: [
          toGroupMember(me, 'admin'),
          toGroupMember(friendsList[0]), // Alex
          toGroupMember(friendsList[1]), // Sarah
        ],
      },
    ];

    const expensesList: Expense[] = [
      {
        id: 'exp-1',
        title: 'Beachside Villa Booking',
        amount: 480.0,
        currency: 'USD',
        category: 'travel',
        date: '2026-03-01',
        groupId: 'grp-goa',
        paidBy: [{ userId: 'usr-alex', amount: 480.0 }],
        splitType: 'EQUAL',
        splits: [
          { userId: me.id, amount: 120.0, isIncluded: true },
          { userId: 'usr-alex', amount: 120.0, isIncluded: true },
          { userId: 'usr-sarah', amount: 120.0, isIncluded: true },
          { userId: 'usr-priya', amount: 120.0, isIncluded: true },
        ],
        createdBy: 'usr-alex',
        createdAt: '2026-03-01T12:00:00.000Z',
      },
      {
        id: 'exp-2',
        title: 'Supermarket BBQ & Drinks',
        amount: 160.0,
        currency: 'USD',
        category: 'groceries',
        date: '2026-03-02',
        groupId: 'grp-goa',
        paidBy: [{ userId: me.id, amount: 160.0 }],
        splitType: 'EQUAL',
        splits: [
          { userId: me.id, amount: 40.0, isIncluded: true },
          { userId: 'usr-alex', amount: 40.0, isIncluded: true },
          { userId: 'usr-sarah', amount: 40.0, isIncluded: true },
          { userId: 'usr-priya', amount: 40.0, isIncluded: true },
        ],
        createdBy: me.id,
        createdAt: '2026-03-02T16:30:00.000Z',
      },
      {
        id: 'exp-3',
        title: 'High-speed Fiber WiFi',
        amount: 60.0,
        currency: 'USD',
        category: 'utilities',
        date: '2026-03-05',
        groupId: 'grp-apt',
        paidBy: [{ userId: me.id, amount: 60.0 }],
        splitType: 'EQUAL',
        splits: [
          { userId: me.id, amount: 20.0, isIncluded: true },
          { userId: 'usr-michael', amount: 20.0, isIncluded: true },
          { userId: 'usr-david', amount: 20.0, isIncluded: true },
        ],
        createdBy: me.id,
        createdAt: '2026-03-05T09:15:00.000Z',
      },
      {
        id: 'exp-4',
        title: 'Electricity & Gas Bill',
        amount: 150.0,
        currency: 'USD',
        category: 'utilities',
        date: '2026-03-08',
        groupId: 'grp-apt',
        paidBy: [{ userId: 'usr-michael', amount: 150.0 }],
        splitType: 'EQUAL',
        splits: [
          { userId: me.id, amount: 50.0, isIncluded: true },
          { userId: 'usr-michael', amount: 50.0, isIncluded: true },
          { userId: 'usr-david', amount: 50.0, isIncluded: true },
        ],
        createdBy: 'usr-michael',
        createdAt: '2026-03-08T18:00:00.000Z',
      },
      {
        id: 'exp-5',
        title: 'Italian Woodfired Pizza Night',
        amount: 90.0,
        currency: 'USD',
        category: 'food',
        date: '2026-03-12',
        groupId: 'grp-diners',
        paidBy: [{ userId: me.id, amount: 90.0 }],
        splitType: 'EQUAL',
        splits: [
          { userId: me.id, amount: 30.0, isIncluded: true },
          { userId: 'usr-alex', amount: 30.0, isIncluded: true },
          { userId: 'usr-sarah', amount: 30.0, isIncluded: true },
        ],
        createdBy: me.id,
        createdAt: '2026-03-12T21:40:00.000Z',
      },
      {
        id: 'exp-6',
        title: 'Movie Tickets: Interstellar IMAX',
        amount: 36.0,
        currency: 'USD',
        category: 'entertainment',
        date: '2026-03-14',
        paidBy: [{ userId: me.id, amount: 36.0 }],
        splitType: 'EQUAL',
        splits: [
          { userId: me.id, amount: 18.0, isIncluded: true },
          { userId: 'usr-sarah', amount: 18.0, isIncluded: true },
        ],
        createdBy: me.id,
        createdAt: '2026-03-14T20:10:00.000Z',
      },
      {
        id: 'exp-7',
        title: 'Cab ride from Airport',
        amount: 45.0,
        currency: 'USD',
        category: 'transport',
        date: '2026-03-15',
        paidBy: [{ userId: 'usr-priya', amount: 45.0 }],
        splitType: 'EQUAL',
        splits: [
          { userId: me.id, amount: 22.5, isIncluded: true },
          { userId: 'usr-priya', amount: 22.5, isIncluded: true },
        ],
        createdBy: 'usr-priya',
        createdAt: '2026-03-15T11:20:00.000Z',
      },
    ];

    const settlementsList: Settlement[] = [
      {
        id: 'set-1',
        fromUserId: 'usr-sarah',
        toUserId: me.id,
        amount: 30.0,
        date: '2026-03-13',
        paymentMethod: 'upi',
        notes: 'Paid for Pizza night',
        createdAt: '2026-03-13T10:00:00.000Z',
      },
    ];

    const activitiesList: ActivityItem[] = [
      {
        id: 'act-1',
        type: 'expense_added',
        actorId: 'usr-priya',
        actorName: 'Priya Sharma',
        title: 'Added "Cab ride from Airport"',
        amount: 45.0,
        currency: 'USD',
        timestamp: '2026-03-15T11:20:00.000Z',
      },
      {
        id: 'act-2',
        type: 'settlement_added',
        actorId: 'usr-sarah',
        actorName: 'Sarah Jenkins',
        title: 'Sarah Jenkins paid Kirti $30.00',
        amount: 30.0,
        currency: 'USD',
        timestamp: '2026-03-13T10:00:00.000Z',
      },
      {
        id: 'act-3',
        type: 'expense_added',
        actorId: me.id,
        actorName: me.name,
        title: 'Added "Italian Woodfired Pizza Night"',
        amount: 90.0,
        currency: 'USD',
        groupId: 'grp-diners',
        groupName: 'Weekend Diners 🍕',
        timestamp: '2026-03-12T21:40:00.000Z',
      },
    ];

    this.rawFriends.set(friendsList);
    this.groups.set(groupsList);
    this.expenses.set(expensesList);
    this.settlements.set(settlementsList);
    this.activities.set(activitiesList);
  }
}
