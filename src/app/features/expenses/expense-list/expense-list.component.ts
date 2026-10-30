import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SplitwiseService } from '../../../core/services/splitwise.service';
import { ModalService } from '../../../core/services/modal.service';
import { Expense, ExpenseCategory } from '../../../core/models/expense.model';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent],
  template: `
    <div class="all-expenses-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">All Expenses</h1>
          <p class="page-subtitle">Complete ledger of shared expenses across all friends and groups</p>
        </div>

        <button class="btn btn-primary" (click)="openAddExpense()">
          <span class="material-symbols-outlined">add</span>
          Add an expense
        </button>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="toolbar-card card">
        <div class="search-input-wrap">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search expenses by title..."
            class="search-input"
          />
        </div>

        <div class="filters-row">
          <select [(ngModel)]="selectedCategory" class="filter-select">
            <option value="all">All Categories</option>
            <option value="food">🍽️ Food & Dining</option>
            <option value="groceries">🛒 Groceries</option>
            <option value="travel">✈️ Travel</option>
            <option value="transport">🚕 Transport</option>
            <option value="entertainment">🎟️ Entertainment</option>
            <option value="utilities">💡 Utilities</option>
            <option value="rent">🏠 Rent</option>
            <option value="shopping">🛍️ Shopping</option>
            <option value="general">📦 General</option>
          </select>

          <select [(ngModel)]="selectedGroupId" class="filter-select">
            <option value="all">All Groups</option>
            @for (group of splitwiseService.groups(); track group.id) {
              <option [value]="group.id">{{ group.name }}</option>
            }
          </select>

          <select [(ngModel)]="sortBy" class="filter-select">
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      <!-- Expenses Ledger -->
      @if (filteredExpenses().length > 0) {
        <div class="expenses-container card">
          <div class="expenses-table-header">
            <span class="col-title">Description</span>
            <span class="col-cost">Total Cost</span>
            <span class="col-share">Your Share</span>
            <span class="col-actions"></span>
          </div>

          <div class="expenses-list">
            @for (exp of filteredExpenses(); track exp.id) {
              <div class="expense-row">
                <div class="expense-left">
                  <div class="category-icon-box">
                    <span>{{ getCategoryEmoji(exp.category) }}</span>
                  </div>
                  <div class="expense-meta">
                    <span class="expense-title">{{ exp.title }}</span>
                    <span class="expense-sub">
                      {{ exp.date }} &bull;
                      @if (exp.groupId) {
                        In <strong>{{ getGroupName(exp.groupId) }}</strong> &bull;
                      }
                      Paid by {{ getPayerName(exp) }}
                    </span>
                  </div>
                </div>

                <div class="expense-right">
                  <div class="expense-cost">
                    <span class="cost-value">{{ currency() }} {{ exp.amount.toFixed(2) }}</span>
                  </div>

                  <div class="expense-share" [ngClass]="getShareClass(exp)">
                    <span class="share-label">{{ getShareLabel(exp) }}</span>
                    <span class="share-value">{{ getShareAmountText(exp) }}</span>
                  </div>

                  <button class="delete-btn" (click)="deleteExpense(exp.id)" title="Delete expense">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      } @else {
        <app-empty-state
          icon="receipt_long"
          title="No expenses match your filters"
          description="Try adjusting your search criteria or add a new expense."
          actionLabel="Add Expense"
          actionIcon="add"
          (actionClicked)="openAddExpense()"
        ></app-empty-state>
      }
    </div>
  `,
  styles: [`
    .all-expenses-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;

      .page-title {
        font-size: 1.75rem;
        font-weight: 800;
        color: var(--text-main);
      }

      .page-subtitle {
        font-size: 0.9rem;
        color: var(--text-muted);
      }
    }

    .toolbar-card {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      padding: 1rem 1.25rem;

      .search-input-wrap {
        position: relative;
        display: flex;
        align-items: center;

        .search-icon {
          position: absolute;
          left: 0.75rem;
          color: var(--text-subtle);
          font-size: 1.25rem;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          border: 1px solid var(--border-medium);
          padding-left: 2.5rem;
          font-size: 0.95rem;
        }
      }

      .filters-row {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;

        .filter-select {
          padding: 0.45rem 0.85rem;
          font-size: 0.85rem;
          font-weight: 600;
        }
      }
    }

    .expenses-container {
      overflow: hidden;

      .expenses-table-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.85rem 1.25rem;
        background: var(--bg-surface-secondary);
        border-bottom: 1px solid var(--border-light);
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-muted);

        .col-title { flex: 2; }
        .col-cost { width: 120px; text-align: right; }
        .col-share { width: 140px; text-align: right; }
        .col-actions { width: 50px; }
      }
    }

    .expenses-list {
      display: flex;
      flex-direction: column;
    }

    .expense-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid var(--border-light);
      transition: var(--transition);

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: var(--bg-surface-secondary);
      }

      .expense-left {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        flex: 2;

        .category-icon-box {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          background: var(--bg-surface-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          border: 1px solid var(--border-light);
        }

        .expense-meta {
          display: flex;
          flex-direction: column;

          .expense-title {
            font-weight: 700;
            font-size: 0.95rem;
            color: var(--text-main);
          }

          .expense-sub {
            font-size: 0.78rem;
            color: var(--text-muted);
          }
        }
      }

      .expense-right {
        display: flex;
        align-items: center;
        gap: 1.5rem;

        .expense-cost {
          width: 100px;
          text-align: right;

          .cost-value {
            font-weight: 700;
            font-size: 0.95rem;
          }
        }

        .expense-share {
          width: 120px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;

          .share-label {
            font-size: 0.68rem;
            font-weight: 600;
            color: var(--text-subtle);
            text-transform: uppercase;
          }

          .share-value {
            font-weight: 700;
            font-size: 0.95rem;
          }
        }

        .share-lent .share-value { color: var(--lent-color); }
        .share-owed .share-value { color: var(--owed-color); }
        .share-neutral .share-value { color: var(--text-muted); }

        .delete-btn {
          color: var(--text-subtle);
          padding: 0.35rem;
          border-radius: var(--radius-xs);
          transition: var(--transition);

          &:hover {
            color: #ef4444;
            background: #fee2e2;
          }

          .material-symbols-outlined {
            font-size: 1.15rem;
          }
        }
      }
    }
  `],
})
export class ExpenseListComponent {
  readonly splitwiseService = inject(SplitwiseService);
  readonly modalService = inject(ModalService);

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');
  selectedGroupId = signal<string>('all');
  sortBy = signal<string>('date-desc');

  readonly currency = this.splitwiseService.currency;

  readonly filteredExpenses = computed<Expense[]>(() => {
    let list = [...this.splitwiseService.expenses()];
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

    // Sort
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
