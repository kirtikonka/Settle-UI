import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SplitwiseService } from '../../../core/services/splitwise.service';
import { ModalService } from '../../../core/services/modal.service';
import { Friend } from '../../../core/models/user.model';
import { Expense } from '../../../core/models/expense.model';
import { Settlement } from '../../../core/models/settlement.model';

@Component({
  selector: 'app-friend-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, AvatarComponent, EmptyStateComponent],
  templateUrl: './friend-detail.component.html',
  styleUrl: './friend-detail.component.scss',
})
export class FriendDetailComponent {
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly splitwiseService = inject(SplitwiseService);
  readonly modalService = inject(ModalService);

  friendId = signal<string>('');

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.friendId.set(id);
      }
    });
  }

  readonly friend = computed<Friend | undefined>(() => {
    return this.splitwiseService.friends().find((f) => f.id === this.friendId());
  });

  readonly sharedExpenses = computed<Expense[]>(() => {
    return this.splitwiseService.getExpensesWithFriend(this.friendId());
  });

  readonly settlements = computed<Settlement[]>(() => {
    return this.splitwiseService.getSettlementsWithFriend(this.friendId());
  });

  readonly currency = this.splitwiseService.currency;

  openAddExpense(friendId: string): void {
    this.modalService.openAddExpense({ friendId });
  }

  openSettleUp(friendId: string): void {
    this.modalService.openSettleUp({ friendId });
  }

  deleteExpense(id: string): void {
    if (confirm('Are you sure you want to delete this expense?')) {
      this.splitwiseService.deleteExpense(id);
    }
  }

  balanceClass(bal: number): string {
    if (bal > 0.01) return 'lent';
    if (bal < -0.01) return 'owed';
    return 'settled';
  }

  getGroupName(groupId: string): string {
    return this.splitwiseService.groups().find((g) => g.id === groupId)?.name || 'Group';
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
      case 'food': return '🍽️';
      case 'groceries': return '🛒';
      case 'travel': return '✈️';
      case 'transport': return '🚕';
      case 'entertainment': return '🎟️';
      case 'utilities': return '💡';
      case 'rent': return '🏠';
      case 'shopping': return '🛍️';
      default: return '📦';
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
