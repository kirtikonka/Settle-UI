import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SettleService } from '../../../core/services/settle.service';
import { ModalService } from '../../../core/services/modal.service';
import { Expense, ExpenseCategory } from '../../../core/models/expense.model';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent],
  templateUrl: './expense-list.component.html',
  styleUrl: './expense-list.component.scss',
})
export class ExpenseListComponent {
  readonly settleService = inject(SettleService);
  readonly modalService = inject(ModalService);

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');
  selectedGroupId = signal<string>('all');
  sortBy = signal<string>('date-desc');

  readonly currency = this.settleService.currency;

  readonly filteredExpenses = computed<Expense[]>(() => {
    let list = [...this.settleService.expenses()];
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    const grp = this.selectedGroupId();
    const sort = this.sortBy();

    if (q) {
      list = list.filter((e) => e.title.toLowerCase().includes(q));
    }

    if (cat !== 'all') {
      list = list.filter((e) => e.category === cat);
    }

    if (grp !== 'all') {
      list = list.filter((e) => e.groupId === grp);
    }

    list.sort((a, b) => {
      if (sort === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sort === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sort === 'amount-desc') return b.amount - a.amount;
      if (sort === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

    return list;
  });

  openAddExpense(): void {
    this.modalService.openAddExpense();
  }

  deleteExpense(id: string): void {
    if (confirm('Are you sure you want to delete this expense?')) {
      this.settleService.deleteExpense(id);
    }
  }

  getGroupName(groupId: string): string {
    return this.settleService.groups().find((g) => g.id === groupId)?.name || 'Group';
  }

  getPayerName(exp: Expense): string {
    const me = this.settleService.currentUser();
    const firstPayer = exp.paidBy[0];
    if (!firstPayer) return 'Unknown';
    if (firstPayer.userId === me.id) return 'you';
    return this.settleService.getUserById(firstPayer.userId)?.name || 'Someone';
  }

  getCategoryEmoji(category: ExpenseCategory): string {
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
    const me = this.settleService.currentUser();
    const paidByMe = exp.paidBy.find((p) => p.userId === me.id)?.amount || 0;
    const myShare = exp.splits.find((s) => s.userId === me.id && s.isIncluded)?.amount || 0;

    if (paidByMe > myShare) return 'share-lent';
    if (paidByMe < myShare) return 'share-owed';
    return 'share-neutral';
  }

  getShareLabel(exp: Expense): string {
    const me = this.settleService.currentUser();
    const paidByMe = exp.paidBy.find((p) => p.userId === me.id)?.amount || 0;
    const myShare = exp.splits.find((s) => s.userId === me.id && s.isIncluded)?.amount || 0;

    if (paidByMe > myShare) return 'You lent';
    if (paidByMe < myShare) return 'You borrowed';
    return 'No share';
  }

  getShareAmountText(exp: Expense): string {
    const me = this.settleService.currentUser();
    const paidByMe = exp.paidBy.find((p) => p.userId === me.id)?.amount || 0;
    const myShare = exp.splits.find((s) => s.userId === me.id && s.isIncluded)?.amount || 0;

    const diff = Math.abs(paidByMe - myShare);
    return `${this.currency()} ${diff.toFixed(2)}`;
  }
}
