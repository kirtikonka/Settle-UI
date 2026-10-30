import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SplitwiseService } from '../../core/services/splitwise.service';
import { ModalService } from '../../core/services/modal.service';
import { Friend } from '../../core/models/user.model';
import { Expense } from '../../core/models/expense.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, AvatarComponent, EmptyStateComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly splitwiseService = inject(SplitwiseService);
  readonly modalService = inject(ModalService);

  readonly netBalance = this.splitwiseService.netBalance;
  readonly totalOwedToYou = this.splitwiseService.totalOwedToYou;
  readonly totalYouOwe = this.splitwiseService.totalYouOwe;
  readonly currency = this.splitwiseService.currency;
  readonly recentExpenses = this.splitwiseService.recentExpenses;

  readonly friendsWhoOweMe = computed<Friend[]>(() =>
    this.splitwiseService.friends().filter((f) => f.balance > 0)
  );

  readonly friendsIOwe = computed<Friend[]>(() =>
    this.splitwiseService.friends().filter((f) => f.balance < 0)
  );

  openAddExpense(): void {
    this.modalService.openAddExpense();
  }

  openSettleUp(): void {
    this.modalService.openSettleUp();
  }

  settleWithFriend(friend: Friend): void {
    this.modalService.openSettleUp({ friendId: friend.id });
  }

  deleteExpense(id: string): void {
    if (confirm('Are you sure you want to delete this expense?')) {
      this.splitwiseService.deleteExpense(id);
    }
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
