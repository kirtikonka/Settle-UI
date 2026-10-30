import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../components/modal/modal.component';
import { ModalService } from '../../../core/services/modal.service';
import { SplitwiseService } from '../../../core/services/settle.service';

@Component({
  selector: 'app-add-friend-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './add-friend-modal.component.html',
  styleUrl: './add-friend-modal.component.scss',
})
export class AddFriendModalComponent {
  readonly modalService = inject(ModalService);
  readonly splitwiseService = inject(SplitwiseService);

  name = '';
  email = '';
  phone = '';

  isValid(): boolean {
    return !!this.name.trim() && !!this.email.trim();
  }

  saveFriend(): void {
    if (!this.isValid()) return;

    this.splitwiseService.addFriend({
      name: this.name.trim(),
      email: this.email.trim(),
      phone: this.phone.trim() || undefined,
    });

    this.close();
  }

  close(): void {
    this.name = '';
    this.email = '';
    this.phone = '';
    this.modalService.closeAddFriend();
  }
}
