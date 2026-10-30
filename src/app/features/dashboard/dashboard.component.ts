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
  template: `
    <div class="dashboard-page">
      <!-- Top Action Bar -->
      <div class="dashboard-topbar">
        <div class="page-title-wrap">
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Track, split, and settle expenses effortlessly</p>
        </div>

        <div class="topbar-actions">
          <button class="btn btn-primary" (click)="openAddExpense()">
            <span class="material-symbols-outlined">add</span>
            Add an expense
          </button>
          <button class="btn btn-secondary" (click)="openSettleUp()">
            <span class="material-symbols-outlined">payments</span>
            Settle up
          </button>
        </div>
      </div>

      <!-- Hero Balances Grid -->
      <div class="balance-cards-grid">
        <!-- Total Balance -->
        <div class="balance-card">
          <span class="card-label">Total Balance</span>
          <div class="card-amount" [class.amount-lent]="netBalance() > 0" [class.amount-owed]="netBalance() < 0" [class.amount-settled]="netBalance() === 0">
            @if (netBalance() > 0) {
              +{{ currency() }} {{ netBalance().toFixed(2) }}
            } @else if (netBalance() < 0) {
              -{{ currency() }} {{ (-netBalance()).toFixed(2) }}
            } @else {
              {{ currency() }} 0.00
            }
          </div>
          <span class="card-caption">
            @if (netBalance() > 0) {
              Overall you are owed money
            } @else if (netBalance() < 0) {
              Overall you owe money
            } @else {
              All settled up!
            }
          </span>
        </div>

        <!-- You Are Owed -->
        <div class="balance-card">
          <span class="card-label">You Are Owed</span>
          <div class="card-amount amount-lent">
            +{{ currency() }} {{ totalOwedToYou().toFixed(2) }}
          </div>
          <span class="card-caption">from {{ friendsWhoOweMe().length }} {{ friendsWhoOweMe().length === 1 ? 'friend' : 'friends' }}</span>
        </div>

        <!-- You Owe -->
        <div class="balance-card">
          <span class="card-label">You Owe</span>
          <div class="card-amount amount-owed">
            -{{ currency() }} {{ totalYouOwe().toFixed(2) }}
          </div>
          <span class="card-caption">to {{ friendsIOwe().length }} {{ friendsIOwe().length === 1 ? 'friend' : 'friends' }}</span>
        </div>
      </div>

      <!-- Debt Relationships (Splitwise Columns) -->
      <div class="relationships-container card">
        <div class="relationships-header">
          <h3>YOU ARE OWED</h3>
          <h3>YOU OWE</h3>
        </div>

        <div class="relationships-body">
          <!-- Left Column: People who owe you -->
          <div class="relationship-col left-col">
            @if (friendsWhoOweMe().length > 0) {
              <div class="friend-debt-list">
                @for (friend of friendsWhoOweMe(); track friend.id) {
                  <div class="friend-debt-row">
                    <div class="friend-info">
                      <app-avatar [src]="friend.avatarUrl" [name]="friend.name" size="md"></app-avatar>
                      <div class="friend-names">
                        <a [routerLink]="['/friends', friend.id]" class="name-link">{{ friend.name }}</a>
                        <span class="owes-text">owes you <strong class="amount-lent">{{ currency() }} {{ friend.balance.toFixed(2) }}</strong></span>
                      </div>
                    </div>

                    <div class="friend-actions">
                      <button class="btn btn-outline btn-sm" (click)="settleWithFriend(friend)">
                        Settle
                      </button>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="column-empty">
                <span class="material-symbols-outlined">sentiment_satisfied</span>
                <p>No one owes you right now</p>
              </div>
            }
          </div>

          <!-- Divider -->
          <div class="col-divider"></div>

          <!-- Right Column: People you owe -->
          <div class="relationship-col right-col">
            @if (friendsIOwe().length > 0) {
              <div class="friend-debt-list">
                @for (friend of friendsIOwe(); track friend.id) {
                  <div class="friend-debt-row">
                    <div class="friend-info">
                      <app-avatar [src]="friend.avatarUrl" [name]="friend.name" size="md"></app-avatar>
                      <div class="friend-names">
                        <a [routerLink]="['/friends', friend.id]" class="name-link">{{ friend.name }}</a>
                        <span class="owes-text">you owe <strong class="amount-owed">{{ currency() }} {{ (-friend.balance).toFixed(2) }}</strong></span>
                      </div>
                    </div>

                    <div class="friend-actions">
                      <button class="btn btn-primary btn-sm" (click)="settleWithFriend(friend)">
                        Pay Back
                      </button>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="column-empty">
                <span class="material-symbols-outlined">check_circle</span>
                <p>You do not owe anything!</p>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Recent Expenses Section -->
      <div class="recent-expenses-section card">
        <div class="section-card-header">
          <div class="header-title-wrap">
            <span class="material-symbols-outlined header-icon">receipt_long</span>
            <h3>Recent Expenses</h3>
          </div>
          <a routerLink="/expenses" class="view-all-link">View all expenses &rarr;</a>
        </div>

        @if (recentExpenses().length > 0) {
          <div class="expenses-list">
            @for (expense of recentExpenses().slice(0, 5); track expense.id) {
              <div class="expense-row">
                <div class="expense-left">
                  <div class="category-icon-box">
                    <span>{{ getCategoryEmoji(expense.category) }}</span>
                  </div>
                  <div class="expense-meta">
                    <span class="expense-title">{{ expense.title }}</span>
                    <span class="expense-sub">
                      {{ expense.date }} &bull;
                      @if (expense.groupId) {
                        Group: {{ getGroupName(expense.groupId) }} &bull;
                      }
                      Paid by {{ getPayerName(expense) }}
                    </span>
                  </div>
                </div>

                <div class="expense-right">
                  <div class="expense-cost">
                    <span class="cost-label">Total</span>
                    <span class="cost-value">{{ currency() }} {{ expense.amount.toFixed(2) }}</span>
                  </div>

                  <div class="expense-share" [ngClass]="getShareClass(expense)">
                    <span class="share-label">{{ getShareLabel(expense) }}</span>
                    <span class="share-value">{{ getShareAmountText(expense) }}</span>
                  </div>

                  <button class="delete-btn" (click)="deleteExpense(expense.id)" title="Delete expense">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            }
          </div>
        } @else {
          <app-empty-state
            icon="receipt_long"
            title="No expenses logged yet"
            description="Start by adding an expense to split costs with your friends or roomies."
            actionLabel="Add Expense"
            actionIcon="add"
            (actionClicked)="openAddExpense()"
          ></app-empty-state>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .dashboard-topbar {
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

      .topbar-actions {
        display: flex;
        gap: 0.75rem;
      }
    }

    .balance-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .balance-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      padding: 1.25rem 1.5rem;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      .card-label {
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-muted);
      }

      .card-amount {
        font-size: 1.85rem;
        font-weight: 800;
      }

      .card-caption {
        font-size: 0.8rem;
        color: var(--text-muted);
      }
    }

    .relationships-container {
      overflow: hidden;

      .relationships-header {
        display: grid;
        grid-template-columns: 1fr 1fr;
        background: var(--bg-surface-secondary);
        border-bottom: 1px solid var(--border-light);
        padding: 0.85rem 1.5rem;

        h3 {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.5px;
        }

        h3:last-child {
          padding-left: 1.5rem;
        }
      }

      .relationships-body {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        min-height: 180px;

        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }
      }

      .col-divider {
        width: 1px;
        background: var(--border-light);

        @media (max-width: 768px) {
          display: none;
        }
      }

      .relationship-col {
        padding: 1.25rem 1.5rem;
      }

      .friend-debt-list {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
      }

      .friend-debt-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;

        .friend-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;

          .friend-names {
            display: flex;
            flex-direction: column;

            .name-link {
              font-weight: 700;
              font-size: 0.95rem;
              color: var(--text-main);

              &:hover {
                color: var(--primary);
                text-decoration: underline;
              }
            }

            .owes-text {
              font-size: 0.82rem;
              color: var(--text-muted);
            }
          }
        }
      }

      .column-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--text-subtle);
        gap: 0.35rem;
        padding: 2rem 1rem;

        .material-symbols-outlined {
          font-size: 2rem;
        }

        p {
          font-size: 0.85rem;
        }
      }
    }

    .recent-expenses-section {
      padding: 1.25rem 1.5rem;

      .section-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--border-light);

        .header-title-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;

          .header-icon {
            color: var(--primary);
          }

          h3 {
            font-size: 1.15rem;
            font-weight: 700;
          }
        }

        .view-all-link {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--primary);

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }

    .expenses-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .expense-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-sm);
      transition: var(--transition);

      &:hover {
        background: var(--bg-surface-secondary);
      }

      .expense-left {
        display: flex;
        align-items: center;
        gap: 0.85rem;

        .category-icon-box {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          background: var(--bg-surface-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
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

        .expense-cost, .expense-share {
          display: flex;
          flex-direction: column;
          align-items: flex-end;

          .cost-label, .share-label {
            font-size: 0.7rem;
            font-weight: 600;
            color: var(--text-subtle);
            text-transform: uppercase;
          }

          .cost-value, .share-value {
            font-weight: 700;
            font-size: 0.92rem;
          }
        }

        .share-lent .share-value {
          color: var(--lent-color);
        }

        .share-owed .share-value {
          color: var(--owed-color);
        }

        .share-neutral .share-value {
          color: var(--text-muted);
        }

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
