import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SplitwiseService } from '../../../core/services/splitwise.service';
import { ModalService } from '../../../core/services/modal.service';
import { Friend } from '../../../core/models/user.model';

@Component({
  selector: 'app-friend-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, AvatarComponent, EmptyStateComponent],
  template: `
    <div class="friends-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Friends</h1>
          <p class="page-subtitle">Track individual balances and shared debts with your friends</p>
        </div>

        <button class="btn btn-primary" (click)="openAddFriend()">
          <span class="material-symbols-outlined">person_add</span>
          Add a friend
        </button>
      </div>

      <!-- Search Filter Bar -->
      <div class="search-filter-card card">
        <div class="search-input-wrap">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search friends by name or email..."
            class="search-input"
          />
        </div>
      </div>

      <!-- Friends List Grid -->
      @if (filteredFriends().length > 0) {
        <div class="friends-grid">
          @for (friend of filteredFriends(); track friend.id) {
            <div class="friend-card card card-hover">
              <a [routerLink]="['/friends', friend.id]" class="friend-link-area">
                <app-avatar [src]="friend.avatarUrl" [name]="friend.name" size="lg"></app-avatar>
                <div class="friend-info">
                  <h3 class="friend-name">{{ friend.name }}</h3>
                  <span class="friend-email">{{ friend.email }}</span>
                </div>
              </a>

              <div class="friend-card-bottom">
                <div class="balance-indicator">
                  <span class="balance-label">Status</span>
                  <div class="balance-val" [ngClass]="getBalanceClass(friend.balance)">
                    @if (friend.balance > 0.01) {
                      owes you {{ currency() }} {{ friend.balance.toFixed(2) }}
                    } @else if (friend.balance < -0.01) {
                      you owe {{ currency() }} {{ (-friend.balance).toFixed(2) }}
                    } @else {
                      settled up
                    }
                  </div>
                </div>

                <div class="card-actions">
                  <button class="btn btn-outline btn-sm" (click)="settleWithFriend(friend)">
                    <span class="material-symbols-outlined">handshake</span>
                    Settle
                  </button>
                  <a [routerLink]="['/friends', friend.id]" class="btn btn-ghost btn-sm" title="View details">
                    <span class="material-symbols-outlined">chevron_right</span>
                  </a>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <app-empty-state
          icon="group"
          title="No friends found"
          [description]="searchQuery() ? 'No friends matched your search.' : 'Add your friends to start splitting expenses easily.'"
          actionLabel="Add Friend"
          actionIcon="person_add"
          (actionClicked)="openAddFriend()"
        ></app-empty-state>
      }
    </div>
  `,
  styles: [`
    .friends-page {
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

    .search-filter-card {
      padding: 0.75rem 1rem;

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
          border: none;
          background: transparent;
          padding-left: 2.5rem;
          font-size: 0.95rem;

          &:focus {
            box-shadow: none;
          }
        }
      }
    }

    .friends-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
    }

    .friend-card {
      display: flex;
      flex-direction: column;
      padding: 1.25rem;
      gap: 1rem;

      .friend-link-area {
        display: flex;
        align-items: center;
        gap: 1rem;
        text-decoration: none;
        color: inherit;

        .friend-info {
          display: flex;
          flex-direction: column;

          .friend-name {
            font-size: 1.05rem;
            font-weight: 700;
            color: var(--text-main);
          }

          .friend-email {
            font-size: 0.8rem;
            color: var(--text-muted);
          }
        }
      }

      .friend-card-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 0.85rem;
        border-top: 1px solid var(--border-light);
        margin-top: auto;

        .balance-indicator {
          display: flex;
          flex-direction: column;

          .balance-label {
            font-size: 0.7rem;
            text-transform: uppercase;
            font-weight: 700;
            color: var(--text-subtle);
          }

          .balance-val {
            font-size: 0.88rem;
            font-weight: 700;

            &.lent { color: var(--lent-color); }
            &.owed { color: var(--owed-color); }
            &.settled { color: var(--neutral-settled); font-weight: 500; }
          }
        }

        .card-actions {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
      }
    }
  `],
})
export class FriendListComponent {
  readonly splitwiseService = inject(SplitwiseService);
  readonly modalService = inject(ModalService);

  searchQuery = signal<string>('');
  readonly currency = this.splitwiseService.currency;

  readonly filteredFriends = computed<Friend[]>(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.splitwiseService.friends();
    if (!q) return list;
    return list.filter((f) => f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q));
  });

  openAddFriend(): void {
    this.modalService.openAddFriend();
  }

  settleWithFriend(friend: Friend): void {
    this.modalService.openSettleUp({ friendId: friend.id });
  }

  getBalanceClass(bal: number): string {
    if (bal > 0.01) return 'lent';
    if (bal < -0.01) return 'owed';
    return 'settled';
  }
}
