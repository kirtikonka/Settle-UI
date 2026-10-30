import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SplitwiseService } from '../../../core/services/settle.service';
import { ModalService } from '../../../core/services/modal.service';
import { Group, GroupCategory, SimplifiedDebt } from '../../../core/models/group.model';
import { Expense } from '../../../core/models/expense.model';
import { User } from '../../../core/models/user.model';

type GroupTab = 'expenses' | 'balances' | 'simplified' | 'members';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, AvatarComponent, EmptyStateComponent],
  templateUrl: './group-detail.component.html',
  styleUrl: './group-detail.component.scss',
})
export class GroupDetailComponent {
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly splitwiseService = inject(SplitwiseService);
  readonly modalService = inject(ModalService);

  readonly activeTab = signal<GroupTab>('expenses');

  groupId = signal<string>('');

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.groupId.set(id);
      }
    });
  }

  readonly group = computed<Group | undefined>(() => {
    return this.splitwiseService.getGroupById(this.groupId());
  });

  readonly groupExpenses = computed<Expense[]>(() => {
    return this.splitwiseService.getGroupExpenses(this.groupId());
  });

  readonly totalSpent = computed<number>(() => {
    return this.groupExpenses().reduce((sum, e) => sum + e.amount, 0);
  });

  readonly memberBalances = computed<{ user: User; balance: number }[]>(() => {
    return this.splitwiseService.getGroupMemberBalances(this.groupId());
  });

  readonly simplifiedDebts = computed<SimplifiedDebt[]>(() => {
    return this.splitwiseService.simplifyGroupDebts(this.groupId());
  });

  readonly currency = this.splitwiseService.currency;

  openAddExpense(groupId: string): void {
    this.modalService.openAddExpense({ groupId });
  }

  openSettleUp(groupId: string): void {
    this.modalService.openSettleUp({ groupId });
  }

  settleSimplifiedDebt(debt: SimplifiedDebt, groupId: string): void {
    this.modalService.openSettleUp({
      fromUserId: debt.fromUser.id,
      toUserId: debt.toUser.id,
      amount: debt.amount,
      groupId,
    });
  }

  deleteExpense(id: string): void {
    if (confirm('Are you sure you want to delete this expense?')) {
      this.splitwiseService.deleteExpense(id);
    }
  }

  myBalance(): number {
    const me = this.splitwiseService.currentUser();
    return this.memberBalances().find((mb) => mb.user.id === me.id)?.balance || 0;
  }

  myBalanceClass(): string {
    const bal = this.myBalance();
    if (bal > 0.01) return 'lent';
    if (bal < -0.01) return 'owed';
    return 'settled';
  }

  myBalanceText(): string {
    const bal = this.myBalance();
    const curr = this.currency();
    if (bal > 0.01) return `+${curr} ${bal.toFixed(2)}`;
    if (bal < -0.01) return `-${curr} ${(-bal).toFixed(2)}`;
    return 'Settled up';
  }

  getPayerName(exp: Expense): string {
    const me = this.splitwiseService.currentUser();
    const firstPayer = exp.paidBy[0];
    if (!firstPayer) return 'Unknown';
    if (firstPayer.userId === me.id) return 'you';
    return this.splitwiseService.getUserById(firstPayer.userId)?.name || 'Someone';
  }

  getCategoryEmoji(category: string): string {
    switch (category) {
      case 'trip': return '✈️';
      case 'home': return '🏠';
      case 'couple': return '❤️';
      case 'project': return '💻';
      case 'food': return '🍽️';
      case 'groceries': return '🛒';
      case 'travel': return '✈️';
      case 'transport': return '🚕';
      case 'entertainment': return '🎟️';
      case 'utilities': return '💡';
      case 'rent': return '🏠';
      case 'shopping': return '🛍️';
      default: return '👥';
    }
  }

  getShareClass(exp: Expense): string {
    const me = this.splitwiseService.currentUser();
    const paidByMe = exp.paidBy.find((p) => p.userId === me.id)?.amount || 0;
    const myShare = exp.splits.find((s) => s.userId === me.id && s.isIncluded)?.amount || 0;

    if (paidByMe > myShare) return 'share-lent';
    if (paidByMe < myShare) return 'share-owed';
    return 'share-neutral';
  }

  getShareLabel(exp: Expense): string {
    const me = this.splitwiseService.currentUser();
    const paidByMe = exp.paidBy.find((p) => p.userId === me.id)?.amount || 0;
    const myShare = exp.splits.find((s) => s.userId === me.id && s.isIncluded)?.amount || 0;

    if (paidByMe > myShare) return 'You lent';
    if (paidByMe < myShare) return 'You borrowed';
    return 'No share';
  }

  getShareAmountText(exp: Expense): string {
    const me = this.splitwiseService.currentUser();
    const paidByMe = exp.paidBy.find((p) => p.userId === me.id)?.amount || 0;
    const myShare = exp.splits.find((s) => s.userId === me.id && s.isIncluded)?.amount || 0;

    const diff = Math.abs(paidByMe - myShare);
    return `${this.currency()} ${diff.toFixed(2)}`;
  }
}
