import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../components/modal/modal.component';
import { ModalService } from '../../../core/services/modal.service';
import { SplitwiseService } from '../../../core/services/splitwise.service';

@Component({
  selector: 'app-add-friend-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal
      [isOpen]="modalService.isAddFriendOpen()"
      title="Add a Friend"
      icon="person_add"
      maxWidth="450px"
      (close)="close()"
    >
      <div body class="add-friend-form">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <div class="input-with-icon">
            <span class="material-symbols-outlined input-icon">person</span>
            <input
              type="text"
              [(ngModel)]="name"
              placeholder="e.g. John Watson"
              class="form-control"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Email Address</label>
          <div class="input-with-icon">
            <span class="material-symbols-outlined input-icon">mail</span>
            <input
              type="email"
              [(ngModel)]="email"
              placeholder="e.g. john@example.com"
              class="form-control"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Phone Number (optional)</label>
          <div class="input-with-icon">
            <span class="material-symbols-outlined input-icon">call</span>
            <input
              type="tel"
              [(ngModel)]="phone"
              placeholder="e.g. +1 555-0123"
              class="form-control"
            />
          </div>
        </div>
      </div>

      <div footer>
        <button type="button" class="btn btn-outline" (click)="close()">Cancel</button>
        <button
          type="button"
          class="btn btn-primary"
          [disabled]="!isValid()"
          (click)="saveFriend()"
        >
          <span class="material-symbols-outlined">person_add</span>
          Add Friend
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .add-friend-form {
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

    .input-with-icon {
      position: relative;
      display: flex;
      align-items: center;

      .input-icon {
        position: absolute;
        left: 0.75rem;
        color: var(--text-subtle);
        font-size: 1.25rem;
        pointer-events: none;
      }

      input {
        padding-left: 2.5rem;
      }
    }
  `],
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
