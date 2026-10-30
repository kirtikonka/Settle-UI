import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../components/modal/modal.component';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { ModalService } from '../../../core/services/modal.service';
import { SplitwiseService } from '../../../core/services/settle.service';
import { GroupCategory, GroupMember } from '../../../core/models/group.model';

@Component({
  selector: 'app-create-group-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, AvatarComponent],
  templateUrl: './create-group-modal.component.html',
  styleUrl: './create-group-modal.component.scss',
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
