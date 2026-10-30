import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { SettleService } from '../../core/services/settle.service';
import { ModalService } from '../../core/services/modal.service';
import { GroupCategory } from '../../core/models/group.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, AvatarComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly settleService = inject(SettleService);
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
