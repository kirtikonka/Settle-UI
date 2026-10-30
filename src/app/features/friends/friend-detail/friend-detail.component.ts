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
  template: `
    @if (friend(); as currentFriend) {
      <div class="friend-detail-page">
        <!-- Top Back Nav -->
        <div class="top-nav">
          <a routerLink="/friends" class="back-link">
            <span class="material-symbols-outlined">arrow_back</span>
            Back to Friends
          </a>
        </div>

        <!-- Friend Hero Card -->
        <div class="friend-hero card">
          <div class="hero-left">
            <app-avatar [src]="currentFriend.avatarUrl" [name]="currentFriend.name" size="xl"></app-avatar>
            <div class="friend-meta">
              <h1 class="friend-name">{{ currentFriend.name }}</h1>
              <span class="friend-email">{{ currentFriend.email }}</span>
              @if (currentFriend.phone) {
                <span class="friend-phone">{{ currentFriend.phone }}</span>
              }
            </div>
          </div>

          <div class="hero-right">
            <div class="hero-balance-box" [ngClass]="balanceClass(currentFriend.balance)">
              <span class="status-label">Current Balance</span>
              <div class="status-amount">
                @if (currentFriend.balance > 0.01) {
                  {{ currentFriend.name }} owes you {{ currency() }} {{ currentFriend.balance.toFixed(2) }}
                } @else if (currentFriend.balance < -0.01) {
                  You owe {{ currentFriend.name }} {{ currency() }} {{ (-currentFriend.balance).toFixed(2) }}
                } @else {
                  You and {{ currentFriend.name }} are settled up
                }
              </div>
            </div>

            <div class="hero-actions">
              <button class="btn btn-primary" (click)="openAddExpense(currentFriend.id)">
                <span class="material-symbols-outlined">add</span>
                Add Expense
              </button>
              <button class="btn btn-secondary" (click)="openSettleUp(currentFriend.id)">
                <span class="material-symbols-outlined">payments</span>
                Settle Up
              </button>
            </div>
          </div>
        </div>

        <!-- Shared Expenses List -->
        <div class="shared-section card">
          <div class="section-header">
            <div class="header-title-wrap">
              <span class="material-symbols-outlined header-icon">receipt_long</span>
              <h3>Shared Expenses with {{ currentFriend.name }}</h3>
            </div>
            <span class="count-badge">{{ sharedExpenses().length }} expenses</span>
          </div>

          @if (sharedExpenses().length > 0) {
            <div class="expenses-list">
              @for (exp of sharedExpenses(); track exp.id) {
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
                          In {{ getGroupName(exp.groupId) }} &bull;
                        }
                        Paid by {{ getPayerName(exp) }}
                      </span>
                    </div>
                  </div>

                  <div class="expense-right">
                    <div class="expense-cost">
                      <span class="cost-label">Total</span>
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
          } @else {
            <app-empty-state
              icon="receipt_long"
              title="No shared expenses"
              description="You and this friend haven't split any bills yet."
              actionLabel="Add Expense"
              actionIcon="add"
              (actionClicked)="openAddExpense(currentFriend.id)"
            ></app-empty-state>
          }
        </div>

        <!-- Settlement History -->
        @if (settlements().length > 0) {
          <div class="settlements-section card">
            <div class="section-header">
              <div class="header-title-wrap">
                <span class="material-symbols-outlined header-icon">handshake</span>
                <h3>Settlement History</h3>
              </div>
            </div>

            <div class="settlements-list">
              @for (set of settlements(); track set.id) {
                <div class="settlement-row">
                  <div class="set-left">
                    <span class="material-symbols-outlined check-icon">check_circle</span>
                    <div class="set-info">
                      <span class="set-title">
                        {{ set.fromUserId === splitwiseService.currentUser().id ? 'You' : currentFriend.name }} paid
                        {{ set.toUserId === splitwiseService.currentUser().id ? 'You' : currentFriend.name }}
                      </span>
                      <span class="set-date">{{ set.date }} &bull; Via {{ set.paymentMethod || 'Payment' }}</span>
                    </div>
                  </div>

                  <div class="set-right">
                    <span class="set-amount">{{ currency() }} {{ set.amount.toFixed(2) }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    } @else {
      <app-empty-state
        icon="person_off"
        title="Friend not found"
        description="The friend profile you requested does not exist."
        actionLabel="Go to Friends"
        actionIcon="arrow_back"
        (actionClicked)="router.navigate(['/friends'])"
      ></app-empty-state>
    }
  `,
  styles: [`
    .friend-detail-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .top-nav {
      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.88rem;
        font-weight: 600;
        color: var(--text-muted);
        transition: var(--transition);

        &:hover {
          color: var(--primary);
        }

        .material-symbols-outlined {
          font-size: 1.15rem;
        }
      }
    }

    .friend-hero {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 2rem;
      flex-wrap: wrap;
      gap: 1.5rem;

      .hero-left {
        display: flex;
        align-items: center;
        gap: 1.25rem;

        .friend-meta {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;

          .friend-name {
            font-size: 1.6rem;
            font-weight: 800;
            color: var(--text-main);
          }

          .friend-email, .friend-phone {
            font-size: 0.85rem;
            color: var(--text-muted);
          }
        }
      }

      .hero-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 1rem;

        .hero-balance-box {
          display: flex;
          flex-direction: column;
          align-items: flex-end;

          .status-label {
            font-size: 0.72rem;
            text-transform: uppercase;
            font-weight: 700;
            color: var(--text-subtle);
          }

          .status-amount {
            font-size: 1.25rem;
            font-weight: 800;
          }

          &.lent .status-amount { color: var(--lent-color); }
          &.owed .status-amount { color: var(--owed-color); }
          &.settled .status-amount { color: var(--neutral-settled); }
        }

        .hero-actions {
          display: flex;
          gap: 0.65rem;
        }
      }
    }

    .shared-section, .settlements-section {
      padding: 1.5rem;

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.25rem;
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

        .count-badge {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 600;
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

    .settlements-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .settlement-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        border-radius: var(--radius-sm);
        background: var(--bg-surface-secondary);

        .set-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;

          .check-icon {
            color: var(--lent-color);
            font-size: 1.5rem;
          }

          .set-info {
            display: flex;
            flex-direction: column;

            .set-title {
              font-weight: 700;
              font-size: 0.95rem;
            }

            .set-date {
              font-size: 0.78rem;
              color: var(--text-muted);
            }
          }
        }

        .set-amount {
          font-weight: 800;
          font-size: 1.1rem;
          color: var(--lent-color);
        }
      }
    }
  `],
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
