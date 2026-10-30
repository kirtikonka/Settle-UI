import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SplitwiseService } from '../../../core/services/splitwise.service';
import { ModalService } from '../../../core/services/modal.service';
import { Group, GroupCategory } from '../../../core/models/group.model';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [CommonModule, RouterLink, AvatarComponent, EmptyStateComponent],
  template: `
    <div class="groups-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Groups</h1>
          <p class="page-subtitle">Manage shared expenses for trips, apartments, and projects</p>
        </div>

        <button class="btn btn-primary" (click)="openCreateGroup()">
          <span class="material-symbols-outlined">add</span>
          Create a group
        </button>
      </div>

      @if (splitwiseService.groups().length > 0) {
        <div class="groups-grid">
          @for (group of splitwiseService.groups(); track group.id) {
            <a [routerLink]="['/groups', group.id]" class="group-card card card-hover">
              <div class="group-card-header">
                <div class="group-icon-wrap">
                  <span>{{ getCategoryEmoji(group.category) }}</span>
                </div>
                <div class="group-title-wrap">
                  <h3 class="group-name">{{ group.name }}</h3>
                  <span class="category-badge">{{ group.category }}</span>
                </div>
              </div>

              @if (group.description) {
                <p class="group-desc">{{ group.description }}</p>
              }

              <div class="group-card-middle">
                <div class="members-avatars">
                  @for (member of group.members.slice(0, 4); track member.id) {
                    <app-avatar [src]="member.avatarUrl" [name]="member.name" size="sm"></app-avatar>
                  }
                  @if (group.members.length > 4) {
                    <span class="more-members-pill">+{{ group.members.length - 4 }}</span>
                  }
                </div>
                <span class="expense-count">{{ getExpenseCount(group.id) }} expenses</span>
              </div>

              <div class="group-card-footer">
                <span class="footer-label">Your Balance:</span>
                <span class="footer-balance" [ngClass]="getBalanceClass(group.id)">
                  {{ getBalanceText(group.id) }}
                </span>
              </div>
            </a>
          }
        </div>
      } @else {
        <app-empty-state
          icon="group"
          title="No groups created yet"
          description="Groups are perfect for tracking shared bills on trips, flatmates, or events."
          actionLabel="Create a group"
          actionIcon="add"
          (actionClicked)="openCreateGroup()"
        ></app-empty-state>
      }
    </div>
  `,
  styles: [`
    .groups-page {
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

    .groups-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
    }

    .group-card {
      display: flex;
      flex-direction: column;
      padding: 1.25rem;
      text-decoration: none;
      color: inherit;
      cursor: pointer;

      .group-card-header {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        margin-bottom: 0.75rem;

        .group-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-sm);
          background: var(--bg-surface-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
        }

        .group-title-wrap {
          display: flex;
          flex-direction: column;

          .group-name {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--text-main);
          }

          .category-badge {
            font-size: 0.72rem;
            text-transform: uppercase;
            font-weight: 700;
            color: var(--text-subtle);
            letter-spacing: 0.5px;
          }
        }
      }

      .group-desc {
        font-size: 0.85rem;
        color: var(--text-muted);
        margin-bottom: 1rem;
        line-height: 1.4;
      }

      .group-card-middle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: auto;
        padding-top: 0.85rem;
        border-top: 1px solid var(--border-light);

        .members-avatars {
          display: flex;
          align-items: center;
          margin-left: 4px;

          app-avatar {
            margin-left: -6px;
            border: 2px solid var(--bg-surface);
            border-radius: 50%;
          }

          .more-members-pill {
            margin-left: -6px;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: var(--bg-surface-tertiary);
            color: var(--text-muted);
            font-size: 0.7rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid var(--bg-surface);
          }
        }

        .expense-count {
          font-size: 0.78rem;
          color: var(--text-muted);
          font-weight: 600;
        }
      }

      .group-card-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px dashed var(--border-light);

        .footer-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .footer-balance {
          font-size: 0.95rem;
          font-weight: 700;

          &.balance-lent {
            color: var(--lent-color);
          }

          &.balance-owed {
            color: var(--owed-color);
          }

          &.balance-settled {
            color: var(--neutral-settled);
            font-weight: 500;
          }
        }
      }
    }
  `],
})
export class GroupListComponent {
  readonly splitwiseService = inject(SplitwiseService);
  readonly modalService = inject(ModalService);

  openCreateGroup(): void {
    this.modalService.openCreateGroup();
  }

  getCategoryEmoji(category: GroupCategory): string {
    switch (category) {
      case 'trip': return '✈️';
      case 'home': return '🏠';
      case 'couple': return '❤️';
      case 'project': return '💻';
      default: return '👥';
    }
  }

  getExpenseCount(groupId: string): number {
    return this.splitwiseService.getGroupExpenses(groupId).length;
  }

  getMyGroupBalance(groupId: string): number {
    const me = this.splitwiseService.currentUser();
    const balances = this.splitwiseService.getGroupMemberBalances(groupId);
    return balances.find((b) => b.user.id === me.id)?.balance || 0;
  }

  getBalanceClass(groupId: string): string {
    const bal = this.getMyGroupBalance(groupId);
    if (bal > 0.01) return 'balance-lent';
    if (bal < -0.01) return 'balance-owed';
    return 'balance-settled';
  }

  getBalanceText(groupId: string): string {
    const bal = this.getMyGroupBalance(groupId);
    const curr = this.splitwiseService.currency();
    if (bal > 0.01) return `+${curr} ${bal.toFixed(2)}`;
    if (bal < -0.01) return `-${curr} ${(-bal).toFixed(2)}`;
    return 'settled';
  }
}
