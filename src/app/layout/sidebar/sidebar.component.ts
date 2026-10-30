import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { SplitwiseService } from '../../core/services/splitwise.service';
import { ModalService } from '../../core/services/modal.service';
import { GroupCategory } from '../../core/models/group.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, AvatarComponent],
  template: `
    <aside class="sidebar">
      <!-- Main Navigation -->
      <nav class="nav-section main-nav">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
          <span class="material-symbols-outlined">dashboard</span>
          <span>Dashboard</span>
        </a>
        <a routerLink="/activity" routerLinkActive="active" class="nav-link">
          <span class="material-symbols-outlined">notifications</span>
          <span>Recent Activity</span>
        </a>
        <a routerLink="/expenses" routerLinkActive="active" class="nav-link">
          <span class="material-symbols-outlined">receipt_long</span>
          <span>All Expenses</span>
        </a>
      </nav>

      <!-- Groups Section -->
      <div class="sidebar-section">
        <div class="section-header">
          <div class="section-title-wrap">
            <span class="section-title">GROUPS</span>
            <span class="count-pill">{{ splitwiseService.groups().length }}</span>
          </div>
          <button class="add-section-btn" (click)="openAddGroup()" title="Add a group">
            <span class="material-symbols-outlined">add</span>
            <span>add</span>
          </button>
        </div>

        <div class="items-list">
          @for (group of splitwiseService.groups(); track group.id) {
            <a
              [routerLink]="['/groups', group.id]"
              routerLinkActive="active"
              class="sidebar-item"
            >
              <div class="item-left">
                <span class="group-icon">{{ getCategoryIcon(group.category) }}</span>
                <span class="item-name" [title]="group.name">{{ group.name }}</span>
              </div>
            </a>
          }
          @if (splitwiseService.groups().length === 0) {
            <div class="empty-hint">No groups yet</div>
          }
        </div>
      </div>

      <!-- Friends Section -->
      <div class="sidebar-section">
        <div class="section-header">
          <div class="section-title-wrap">
            <span class="section-title">FRIENDS</span>
            <span class="count-pill">{{ splitwiseService.friends().length }}</span>
          </div>
          <button class="add-section-btn" (click)="openAddFriend()" title="Add a friend">
            <span class="material-symbols-outlined">add</span>
            <span>add</span>
          </button>
        </div>

        <div class="items-list">
          @for (friend of splitwiseService.friends(); track friend.id) {
            <a
              [routerLink]="['/friends', friend.id]"
              routerLinkActive="active"
              class="sidebar-item"
            >
              <div class="item-left">
                <app-avatar [src]="friend.avatarUrl" [name]="friend.name" size="sm"></app-avatar>
                <span class="item-name" [title]="friend.name">{{ friend.name }}</span>
              </div>

              <div class="item-balance">
                @if (friend.balance > 0) {
                  <span class="balance-text owed-to-you">+{{ splitwiseService.currency() }} {{ friend.balance.toFixed(0) }}</span>
                } @else if (friend.balance < 0) {
                  <span class="balance-text you-owe">-{{ splitwiseService.currency() }} {{ (-friend.balance).toFixed(0) }}</span>
                } @else {
                  <span class="balance-text settled">settled</span>
                }
              </div>
            </a>
          }
          @if (splitwiseService.friends().length === 0) {
            <div class="empty-hint">No friends added</div>
          }
        </div>
      </div>

      <!-- Quick Invite / Actions Footer -->
      <div class="sidebar-footer">
        <div class="invite-box">
          <span class="material-symbols-outlined invite-icon">group_add</span>
          <div class="invite-info">
            <strong>Split with anyone</strong>
            <p>Add friends and never lose track of money again.</p>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      background: var(--bg-surface);
      border-right: 1px solid var(--border-light);
      display: flex;
      flex-direction: column;
      height: calc(100vh - 64px);
      position: sticky;
      top: 64px;
      overflow-y: auto;
      padding: 1.25rem 0.75rem;
      gap: 1.5rem;
    }

    .nav-section {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.9rem;
      transition: var(--transition);

      .material-symbols-outlined {
        font-size: 1.25rem;
        color: var(--text-muted);
      }

      &:hover {
        background-color: var(--bg-surface-secondary);
        color: var(--text-main);

        .material-symbols-outlined {
          color: var(--text-main);
        }
      }

      &.active {
        background-color: var(--primary-light);
        color: var(--primary-hover);

        .material-symbols-outlined {
          color: var(--primary);
        }
      }
    }

    .sidebar-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 0.5rem;

      .section-title-wrap {
        display: flex;
        align-items: center;
        gap: 0.4rem;

        .section-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.5px;
        }

        .count-pill {
          background: var(--bg-surface-tertiary);
          color: var(--text-muted);
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.1rem 0.4rem;
          border-radius: var(--radius-full);
        }
      }

      .add-section-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.15rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--primary);
        padding: 0.2rem 0.4rem;
        border-radius: var(--radius-xs);
        transition: var(--transition);

        .material-symbols-outlined {
          font-size: 1rem;
        }

        &:hover {
          background-color: var(--primary-light);
        }
      }
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .sidebar-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.65rem;
      border-radius: var(--radius-sm);
      color: var(--text-main);
      font-size: 0.88rem;
      transition: var(--transition);

      &:hover {
        background-color: var(--bg-surface-secondary);
      }

      &.active {
        background-color: #f0fdfa;
        font-weight: 600;
      }

      .item-left {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        overflow: hidden;

        .group-icon {
          font-size: 1.1rem;
        }

        .item-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .item-balance {
        font-size: 0.78rem;
        font-weight: 700;
        white-space: nowrap;

        .owed-to-you {
          color: var(--lent-color);
        }

        .you-owe {
          color: var(--owed-color);
        }

        .settled {
          color: var(--text-subtle);
          font-weight: 500;
        }
      }
    }

    .empty-hint {
      padding: 0.5rem 0.75rem;
      font-size: 0.8rem;
      color: var(--text-subtle);
      font-style: italic;
    }

    .sidebar-footer {
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid var(--border-light);

      .invite-box {
        display: flex;
        align-items: flex-start;
        gap: 0.65rem;
        padding: 0.75rem;
        background: var(--bg-surface-secondary);
        border-radius: var(--radius-sm);

        .invite-icon {
          color: var(--primary);
          font-size: 1.25rem;
        }

        .invite-info {
          font-size: 0.78rem;
          color: var(--text-secondary);

          strong {
            color: var(--text-main);
            display: block;
            margin-bottom: 0.15rem;
          }

          p {
            line-height: 1.3;
            color: var(--text-muted);
          }
        }
      }
    }
  `],
})
export class SidebarComponent {
  readonly splitwiseService = inject(SplitwiseService);
  readonly modalService = inject(ModalService);

  openAddGroup(): void {
    this.modalService.openCreateGroup();
  }

  openAddFriend(): void {
    this.modalService.openAddFriend();
  }

  getCategoryIcon(cat: GroupCategory): string {
    switch (cat) {
      case 'trip': return '✈️';
      case 'home': return '🏠';
      case 'couple': return '❤️';
      case 'project': return '💻';
      default: return '👥';
    }
  }
}
