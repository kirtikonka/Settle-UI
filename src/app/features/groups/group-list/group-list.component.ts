import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SettleService } from '../../../core/services/settle.service';
import { ModalService } from '../../../core/services/modal.service';
import { GroupCategory } from '../../../core/models/group.model';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [CommonModule, RouterLink, AvatarComponent, EmptyStateComponent],
  templateUrl: './group-list.component.html',
  styleUrl: './group-list.component.scss',
})
export class GroupListComponent {
  readonly settleService = inject(SettleService);
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
    return this.settleService.getGroupExpenses(groupId).length;
  }

  getMyGroupBalance(groupId: string): number {
    const me = this.settleService.currentUser();
    const balances = this.settleService.getGroupMemberBalances(groupId);
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
    const curr = this.settleService.currency();
    if (bal > 0.01) return `+${curr} ${bal.toFixed(2)}`;
    if (bal < -0.01) return `-${curr} ${(-bal).toFixed(2)}`;
    return 'settled';
  }
}
