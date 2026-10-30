import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SplitwiseService } from '../../../core/services/splitwise.service';
import { ModalService } from '../../../core/services/modal.service';
import { Group, GroupCategory, SimplifiedDebt } from '../../../core/models/group.model';
import { Expense } from '../../../core/models/expense.model';
import { User } from '../../../core/models/user.model';

type GroupTab = 'expenses' | 'balances' | 'simplified' | 'members';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, AvatarComponent, EmptyStateComponent],
  template: `
    @if (group(); as currentGroup) {
      <div class="group-detail-page">
        <!-- Breadcrumb & Back -->
        <div class="top-nav">
          <a routerLink="/groups" class="back-link">
            <span class="material-symbols-outlined">arrow_back</span>
            Back to Groups
          </a>
        </div>

        <!-- Group Header Card -->
        <div class="group-hero card">
          <div class="hero-left">
            <div class="group-avatar-box">
              <span>{{ getCategoryEmoji(currentGroup.category) }}</span>
            </div>
            <div class="group-hero-info">
              <div class="hero-title-row">
                <h1 class="group-title">{{ currentGroup.name }}</h1>
                <span class="category-chip">{{ currentGroup.category }}</span>
              </div>
              <p class="group-desc">{{ currentGroup.description || 'Shared group expenses' }}</p>
              <div class="group-meta-stats">
                <span>{{ currentGroup.members.length }} members</span>
                <span>&bull;</span>
                <span>Total Spent: {{ currency() }} {{ totalSpent().toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div class="hero-right">
            <div class="my-balance-stat" [ngClass]="myBalanceClass()">
              <span class="stat-label">Your Group Balance</span>
              <span class="stat-value">{{ myBalanceText() }}</span>
            </div>

            <div class="hero-actions">
              <button class="btn btn-primary" (click)="openAddExpense(currentGroup.id)">
                <span class="material-symbols-outlined">add</span>
                Add Expense
              </button>
              <button class="btn btn-secondary" (click)="openSettleUp(currentGroup.id)">
                <span class="material-symbols-outlined">payments</span>
                Settle Up
              </button>
            </div>
          </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="tabs-nav">
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'expenses'"
            (click)="activeTab.set('expenses')"
          >
            <span class="material-symbols-outlined">receipt_long</span>
            Expenses ({{ groupExpenses().length }})
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'balances'"
            (click)="activeTab.set('balances')"
          >
            <span class="material-symbols-outlined">account_balance</span>
            Balances
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'simplified'"
            (click)="activeTab.set('simplified')"
          >
            <span class="material-symbols-outlined">insights</span>
            Simplified Debts
            <span class="badge-counter">{{ simplifiedDebts().length }}</span>
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'members'"
            (click)="activeTab.set('members')"
          >
            <span class="material-symbols-outlined">group</span>
            Members ({{ currentGroup.members.length }})
          </button>
        </div>

        <!-- Tab 1: Expenses -->
        @if (activeTab() === 'expenses') {
          <div class="tab-pane">
            @if (groupExpenses().length > 0) {
              <div class="expenses-list">
                @for (exp of groupExpenses(); track exp.id) {
                  <div class="expense-row card">
                    <div class="expense-left">
                      <div class="category-icon-box">
                        <span>{{ getCategoryEmoji(exp.category) }}</span>
                      </div>
                      <div class="expense-meta">
                        <span class="expense-title">{{ exp.title }}</span>
                        <span class="expense-sub">
                          {{ exp.date }} &bull; Paid by {{ getPayerName(exp) }}
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
                title="No group expenses yet"
                description="Keep track of split bills for this group."
                actionLabel="Add first expense"
                actionIcon="add"
                (actionClicked)="openAddExpense(currentGroup.id)"
              ></app-empty-state>
            }
          </div>
        }

        <!-- Tab 2: Balances -->
        @if (activeTab() === 'balances') {
          <div class="tab-pane">
            <div class="balances-card card">
              <div class="balances-header">
                <h3>Member Balances in {{ currentGroup.name }}</h3>
                <p>Calculated from all expenses and payments inside this group</p>
              </div>

              <div class="members-balances-list">
                @for (mb of memberBalances(); track mb.user.id) {
                  <div class="member-balance-row">
                    <div class="mb-left">
                      <app-avatar [src]="mb.user.avatarUrl" [name]="mb.user.name" size="md"></app-avatar>
                      <div class="mb-info">
                        <span class="mb-name">
                          {{ mb.user.name }}
                          @if (mb.user.id === splitwiseService.currentUser().id) {
                            <strong>(You)</strong>
                          }
                        </span>
                        <span class="mb-email">{{ mb.user.email }}</span>
                      </div>
                    </div>

                    <div class="mb-right">
                      @if (mb.balance > 0.01) {
                        <div class="balance-tag lent">
                          <span class="tag-label">is owed</span>
                          <span class="tag-amount">+{{ currency() }} {{ mb.balance.toFixed(2) }}</span>
                        </div>
                      } @else if (mb.balance < -0.01) {
                        <div class="balance-tag owed">
                          <span class="tag-label">owes</span>
                          <span class="tag-amount">-{{ currency() }} {{ (-mb.balance).toFixed(2) }}</span>
                        </div>
                      } @else {
                        <div class="balance-tag settled">
                          <span>Settled up</span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- Tab 3: Simplified Debts (Min-Cash-Flow) -->
        @if (activeTab() === 'simplified') {
          <div class="tab-pane">
            <div class="simplified-debts-card card">
              <div class="simplified-header">
                <div class="header-icon-wrap">
                  <span class="material-symbols-outlined">auto_fix_high</span>
                </div>
                <div>
                  <h3>Splitwise Debt Simplification</h3>
                  <p>
                    This algorithm combines individual debts across members into the minimum possible cash transactions to settle everyone up completely.
                  </p>
                </div>
              </div>

              @if (simplifiedDebts().length > 0) {
                <div class="debts-transfers-list">
                  @for (debt of simplifiedDebts(); track debt.fromUser.id + '-' + debt.toUser.id) {
                    <div class="transfer-card">
                      <div class="transfer-from">
                        <app-avatar [src]="debt.fromUser.avatarUrl" [name]="debt.fromUser.name" size="md"></app-avatar>
                        <div class="user-meta">
                          <span class="user-name">
                            {{ debt.fromUser.name }}
                            @if (debt.fromUser.id === splitwiseService.currentUser().id) {
                              <small>(You)</small>
                            }
                          </span>
                          <span class="role-desc">Payer</span>
                        </div>
                      </div>

                      <div class="transfer-flow">
                        <span class="flow-amount">{{ currency() }} {{ debt.amount.toFixed(2) }}</span>
                        <div class="flow-line">
                          <span class="material-symbols-outlined arrow-icon">arrow_forward</span>
                        </div>
                        <span class="flow-sub">pays</span>
                      </div>

                      <div class="transfer-to">
                        <app-avatar [src]="debt.toUser.avatarUrl" [name]="debt.toUser.name" size="md"></app-avatar>
                        <div class="user-meta">
                          <span class="user-name">
                            {{ debt.toUser.name }}
                            @if (debt.toUser.id === splitwiseService.currentUser().id) {
                              <small>(You)</small>
                            }
                          </span>
                          <span class="role-desc">Recipient</span>
                        </div>
                      </div>

                      <div class="transfer-action">
                        <button class="btn btn-primary btn-sm" (click)="settleSimplifiedDebt(debt, currentGroup.id)">
                          Settle This
                        </button>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <app-empty-state
                  icon="check_circle"
                  title="All debts settled!"
                  description="No one in this group owes anything to anyone. Everyone is square!"
                ></app-empty-state>
              }
            </div>
          </div>
        }

        <!-- Tab 4: Members -->
        @if (activeTab() === 'members') {
          <div class="tab-pane">
            <div class="members-card card">
              <div class="members-card-header">
                <h3>Group Members ({{ currentGroup.members.length }})</h3>
              </div>

              <div class="members-table">
                @for (member of currentGroup.members; track member.id) {
                  <div class="member-row">
                    <div class="member-profile">
                      <app-avatar [src]="member.avatarUrl" [name]="member.name" size="md"></app-avatar>
                      <div class="member-details">
                        <span class="name">
                          {{ member.name }}
                          @if (member.id === splitwiseService.currentUser().id) {
                            <span class="you-tag">You</span>
                          }
                        </span>
                        <span class="email">{{ member.email }}</span>
                      </div>
                    </div>

                    <div class="member-badge-side">
                      <span class="role-badge" [class.admin]="member.role === 'admin'">
                        {{ member.role }}
                      </span>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    } @else {
      <app-empty-state
        icon="search_off"
        title="Group not found"
        description="The group you are looking for does not exist or may have been deleted."
        actionLabel="Go to Groups"
        actionIcon="arrow_back"
        (actionClicked)="router.navigate(['/groups'])"
      ></app-empty-state>
    }
  `,
  styles: [`
    .group-detail-page {
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

    .group-hero {
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

        .group-avatar-box {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-md);
          background: var(--bg-surface-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          box-shadow: var(--shadow-sm);
        }

        .group-hero-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;

          .hero-title-row {
            display: flex;
            align-items: center;
            gap: 0.75rem;

            .group-title {
              font-size: 1.6rem;
              font-weight: 800;
              color: var(--text-main);
            }

            .category-chip {
              font-size: 0.72rem;
              text-transform: uppercase;
              font-weight: 700;
              padding: 0.15rem 0.5rem;
              background: var(--bg-surface-secondary);
              color: var(--text-muted);
              border-radius: var(--radius-full);
            }
          }

          .group-desc {
            font-size: 0.9rem;
            color: var(--text-muted);
          }

          .group-meta-stats {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.8rem;
            color: var(--text-subtle);
            font-weight: 600;
          }
        }
      }

      .hero-right {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        flex-wrap: wrap;

        .my-balance-stat {
          display: flex;
          flex-direction: column;
          align-items: flex-end;

          .stat-label {
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--text-subtle);
          }

          .stat-value {
            font-size: 1.4rem;
            font-weight: 800;
          }

          &.lent .stat-value { color: var(--lent-color); }
          &.owed .stat-value { color: var(--owed-color); }
          &.settled .stat-value { color: var(--neutral-settled); }
        }

        .hero-actions {
          display: flex;
          gap: 0.65rem;
        }
      }
    }

    .tabs-nav {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border-light);
      padding-bottom: 0.25rem;
      overflow-x: auto;

      .tab-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.65rem 1rem;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-muted);
        border-radius: var(--radius-sm) var(--radius-sm) 0 0;
        position: relative;
        transition: var(--transition);

        .material-symbols-outlined {
          font-size: 1.2rem;
        }

        .badge-counter {
          background: var(--bg-surface-tertiary);
          color: var(--text-muted);
          font-size: 0.72rem;
          padding: 0.1rem 0.4rem;
          border-radius: var(--radius-full);
        }

        &:hover {
          color: var(--text-main);
          background: var(--bg-surface-secondary);
        }

        &.active {
          color: var(--primary);
          font-weight: 700;

          &::after {
            content: '';
            position: absolute;
            bottom: -0.25rem;
            left: 0;
            right: 0;
            height: 2px;
            background: var(--primary);
          }

          .badge-counter {
            background: var(--primary-light);
            color: var(--primary);
          }
        }
      }
    }

    .tab-pane {
      animation: fadeIn 0.15s ease-out;
    }

    /* Expenses List styling */
    .expenses-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    /* Balances Tab */
    .balances-card {
      padding: 1.5rem;

      .balances-header {
        margin-bottom: 1.25rem;
        padding-bottom: 0.85rem;
        border-bottom: 1px solid var(--border-light);

        h3 {
          font-size: 1.15rem;
          font-weight: 700;
        }

        p {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
      }

      .members-balances-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;

        .member-balance-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          background: var(--bg-surface-secondary);

          .mb-left {
            display: flex;
            align-items: center;
            gap: 0.85rem;

            .mb-info {
              display: flex;
              flex-direction: column;

              .mb-name {
                font-weight: 700;
                font-size: 0.95rem;
              }

              .mb-email {
                font-size: 0.78rem;
                color: var(--text-muted);
              }
            }
          }

          .balance-tag {
            display: flex;
            flex-direction: column;
            align-items: flex-end;

            .tag-label {
              font-size: 0.7rem;
              font-weight: 600;
              text-transform: uppercase;
            }

            .tag-amount {
              font-weight: 800;
              font-size: 1rem;
            }

            &.lent {
              .tag-label { color: var(--lent-color); }
              .tag-amount { color: var(--lent-color); }
            }

            &.owed {
              .tag-label { color: var(--owed-color); }
              .tag-amount { color: var(--owed-color); }
            }

            &.settled {
              color: var(--neutral-settled);
              font-size: 0.85rem;
              font-weight: 600;
            }
          }
        }
      }
    }

    /* Simplified Debts Tab */
    .simplified-debts-card {
      padding: 1.5rem;

      .simplified-header {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding-bottom: 1.25rem;
        margin-bottom: 1.25rem;
        border-bottom: 1px solid var(--border-light);

        .header-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-sm);
          background: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          .material-symbols-outlined {
            font-size: 1.5rem;
          }
        }

        h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.25rem;
        }

        p {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.4;
        }
      }

      .debts-transfers-list {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;

        .transfer-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          background: var(--bg-surface-secondary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          gap: 1rem;
          flex-wrap: wrap;

          .transfer-from, .transfer-to {
            display: flex;
            align-items: center;
            gap: 0.75rem;

            .user-meta {
              display: flex;
              flex-direction: column;

              .user-name {
                font-weight: 700;
                font-size: 0.95rem;

                small {
                  color: var(--primary);
                  font-weight: 700;
                }
              }

              .role-desc {
                font-size: 0.72rem;
                color: var(--text-subtle);
                text-transform: uppercase;
                font-weight: 600;
              }
            }
          }

          .transfer-flow {
            display: flex;
            flex-direction: column;
            align-items: center;
            min-width: 140px;

            .flow-amount {
              font-size: 1.2rem;
              font-weight: 800;
              color: var(--text-main);
            }

            .flow-line {
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--primary);

              .arrow-icon {
                font-size: 1.4rem;
              }
            }

            .flow-sub {
              font-size: 0.72rem;
              color: var(--text-subtle);
              text-transform: uppercase;
              font-weight: 600;
            }
          }
        }
      }
    }

    /* Members Tab */
    .members-card {
      padding: 1.5rem;

      .members-card-header {
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--border-light);

        h3 {
          font-size: 1.15rem;
          font-weight: 700;
        }
      }

      .members-table {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        .member-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          background: var(--bg-surface-secondary);

          .member-profile {
            display: flex;
            align-items: center;
            gap: 0.85rem;

            .member-details {
              display: flex;
              flex-direction: column;

              .name {
                font-weight: 700;
                font-size: 0.95rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;

                .you-tag {
                  background: var(--primary-light);
                  color: var(--primary);
                  font-size: 0.7rem;
                  padding: 0.1rem 0.4rem;
                  border-radius: var(--radius-full);
                  font-weight: 700;
                }
              }

              .email {
                font-size: 0.8rem;
                color: var(--text-muted);
              }
            }
          }

          .role-badge {
            font-size: 0.72rem;
            font-weight: 700;
            text-transform: uppercase;
            padding: 0.2rem 0.55rem;
            border-radius: var(--radius-full);
            background: var(--bg-surface-tertiary);
            color: var(--text-muted);

            &.admin {
              background: #fef3c7;
              color: #b45309;
            }
          }
        }
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `],
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
