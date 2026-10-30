import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../components/modal/modal.component';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { ModalService } from '../../../core/services/modal.service';
import { SplitwiseService } from '../../../core/services/splitwise.service';
import { GroupCategory, GroupMember } from '../../../core/models/group.model';

@Component({
  selector: 'app-create-group-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, AvatarComponent],
  template: `
    <app-modal
      [isOpen]="modalService.isCreateGroupOpen()"
      title="Create New Group"
      icon="group_add"
      maxWidth="500px"
      (close)="close()"
    >
      <div body class="create-group-form">
        <div class="form-group">
          <label class="form-label">Group Name</label>
          <input
            type="text"
            [(ngModel)]="name"
            placeholder="e.g. Summer Euro Trip, House 204"
            class="form-control"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Type / Category</label>
          <div class="category-grid">
            <button
              type="button"
              class="cat-chip"
              [class.active]="category === 'trip'"
              (click)="category = 'trip'"
            >
              <span>✈️</span> Trip / Vacation
            </button>
            <button
              type="button"
              class="cat-chip"
              [class.active]="category === 'home'"
              (click)="category = 'home'"
            >
              <span>🏠</span> Home / Flatmates
            </button>
            <button
              type="button"
              class="cat-chip"
              [class.active]="category === 'couple'"
              (click)="category = 'couple'"
            >
              <span>❤️</span> Couple
            </button>
            <button
              type="button"
              class="cat-chip"
              [class.active]="category === 'other'"
              (click)="category = 'other'"
            >
              <span>✨</span> Other
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Add Members (from Friends):</label>
          <div class="friends-selection-list">
            <div class="friend-item current-user-item">
              <input type="checkbox" checked disabled />
              <app-avatar [src]="splitwiseService.currentUser().avatarUrl" [name]="splitwiseService.currentUser().name" size="sm"></app-avatar>
              <span class="user-name">{{ splitwiseService.currentUser().name }} (You)</span>
            </div>

            @for (friend of splitwiseService.friends(); track friend.id) {
              <div
                class="friend-item"
                [class.selected]="selectedFriendIds.has(friend.id)"
                (click)="toggleFriend(friend.id)"
              >
                <input
                  type="checkbox"
                  [checked]="selectedFriendIds.has(friend.id)"
                  (click)="$event.stopPropagation()"
                  (change)="toggleFriend(friend.id)"
                />
                <app-avatar [src]="friend.avatarUrl" [name]="friend.name" size="sm"></app-avatar>
                <span class="user-name">{{ friend.name }}</span>
              </div>
            }
          </div>
        </div>
      </div>

      <div footer>
        <button type="button" class="btn btn-outline" (click)="close()">Cancel</button>
        <button
          type="button"
          class="btn btn-primary"
          [disabled]="!name.trim()"
          (click)="createGroup()"
        >
          <span class="material-symbols-outlined">add</span>
          Create Group
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .create-group-form {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .form-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .category-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;

      .cat-chip {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.65rem 0.85rem;
        border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm);
        background: var(--bg-surface);
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-secondary);
        transition: var(--transition);

        &:hover {
          background-color: var(--bg-surface-secondary);
        }

        &.active {
          border-color: var(--primary);
          background-color: var(--primary-light);
          color: var(--primary-hover);
        }
      }
    }

    .friends-selection-list {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      max-height: 180px;
      overflow-y: auto;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-sm);
      padding: 0.5rem;
      background: var(--bg-surface-secondary);

      .friend-item {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        padding: 0.4rem 0.6rem;
        border-radius: var(--radius-xs);
        cursor: pointer;
        transition: var(--transition);

        &:hover {
          background-color: var(--bg-surface);
        }

        &.selected {
          background-color: var(--primary-light);
        }

        .user-name {
          font-size: 0.9rem;
          font-weight: 500;
        }

        &.current-user-item {
          opacity: 0.75;
          cursor: default;
        }
      }
    }
  `],
})
export class CreateGroupModalComponent {
  readonly modalService = inject(ModalService);
  readonly splitwiseService = inject(SplitwiseService);

  name = '';
  category: GroupCategory = 'trip';
  selectedFriendIds = new Set<string>();

  toggleFriend(friendId: string): void {
    if (this.selectedFriendIds.has(friendId)) {
      this.selectedFriendIds.delete(friendId);
    } else {
      this.selectedFriendIds.add(friendId);
    }
  }

  createGroup(): void {
    if (!this.name.trim()) return;

    const me = this.splitwiseService.currentUser();
    const members: GroupMember[] = [
      {
        ...me,
        role: 'admin',
        joinedAt: new Date().toISOString(),
      },
    ];

    this.selectedFriendIds.forEach((friendId) => {
      const friend = this.splitwiseService.friends().find((f) => f.id === friendId);
      if (friend) {
        members.push({
          ...friend,
          role: 'member',
          joinedAt: new Date().toISOString(),
        });
      }
    });

    this.splitwiseService.addGroup({
      name: this.name.trim(),
      category: this.category,
      members,
      createdBy: me.id,
      simplifyDebtsDefault: true,
    });

    this.close();
  }

  close(): void {
    this.name = '';
    this.selectedFriendIds.clear();
    this.category = 'trip';
    this.modalService.closeCreateGroup();
  }
}
