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
  templateUrl: './friend-list.component.html',
  styleUrl: './friend-list.component.scss',
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
