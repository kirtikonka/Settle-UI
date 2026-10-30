import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../components/modal/modal.component';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { ModalService } from '../../../core/services/modal.service';
import { SettleService } from '../../../core/services/settle.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-settle-up-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, AvatarComponent],
  templateUrl: './settle-up-modal.component.html',
  styleUrl: './settle-up-modal.component.scss',
})
export class SettleUpModalComponent {
  readonly modalService = inject(ModalService);
  readonly settleService = inject(SettleService);

  selectedFriendId = signal<string>('');
  direction = signal<'ME_PAID_THEM' | 'THEY_PAID_ME'>('ME_PAID_THEM');
  amount: number | null = null;
  paymentMethod: 'cash' | 'upi' | 'venmo' | 'paypal' | 'bank_transfer' | 'other' = 'upi';
  date = new Date().toISOString().split('T')[0];
  notes = '';
  groupId?: string;

  constructor() {
    effect(() => {
      if (this.modalService.isSettleUpOpen()) {
        const data = this.modalService.settleUpData();
        this.initForm(data);
      }
    });
  }

  private initForm(data: { friendId?: string; groupId?: string; amount?: number; toUserId?: string; fromUserId?: string } | null): void {
    const friends = this.settleService.friends();
    const me = this.settleService.currentUser();
    this.date = new Date().toISOString().split('T')[0];
    this.notes = '';
    this.groupId = data?.groupId;

    let targetFriendId = data?.friendId;
    if (!targetFriendId && data?.toUserId && data.toUserId !== me.id) {
      targetFriendId = data.toUserId;
    }
    if (!targetFriendId && data?.fromUserId && data.fromUserId !== me.id) {
      targetFriendId = data.fromUserId;
    }

    if (!targetFriendId && friends.length > 0) {
      targetFriendId = friends[0].id;
    }

    this.selectedFriendId.set(targetFriendId || '');

    const friend = friends.find((f) => f.id === targetFriendId);
    if (data?.amount) {
      this.amount = data.amount;
      if (data.fromUserId === me.id) {
        this.direction.set('ME_PAID_THEM');
      } else if (data.toUserId === me.id) {
        this.direction.set('THEY_PAID_ME');
      }
    } else if (friend) {
      if (friend.balance < 0) {
        this.direction.set('ME_PAID_THEM');
        this.amount = Math.abs(friend.balance);
      } else if (friend.balance > 0) {
        this.direction.set('THEY_PAID_ME');
        this.amount = friend.balance;
      } else {
        this.direction.set('ME_PAID_THEM');
        this.amount = 0;
      }
    }
  }

  onFriendChange(fId: string): void {
    this.selectedFriendId.set(fId);
    const friend = this.settleService.friends().find((f) => f.id === fId);
    if (friend) {
      if (friend.balance < 0) {
        this.direction.set('ME_PAID_THEM');
        this.amount = Math.abs(friend.balance);
      } else if (friend.balance > 0) {
        this.direction.set('THEY_PAID_ME');
        this.amount = friend.balance;
      }
    }
  }

  setDirection(dir: 'ME_PAID_THEM' | 'THEY_PAID_ME'): void {
    this.direction.set(dir);
  }

  swapDirection(): void {
    this.direction.set(this.direction() === 'ME_PAID_THEM' ? 'THEY_PAID_ME' : 'ME_PAID_THEM');
  }

  getFriend(): User | undefined {
    return this.settleService.friends().find((f) => f.id === this.selectedFriendId());
  }

  getPayerUser(): User | undefined {
    const me = this.settleService.currentUser();
    return this.direction() === 'ME_PAID_THEM' ? me : this.getFriend();
  }

  getReceiverUser(): User | undefined {
    const me = this.settleService.currentUser();
    return this.direction() === 'ME_PAID_THEM' ? this.getFriend() : me;
  }

  isValid(): boolean {
    return !!this.selectedFriendId() && !!this.amount && this.amount > 0;
  }

  recordSettlement(): void {
    if (!this.isValid()) return;

    const payer = this.getPayerUser();
    const receiver = this.getReceiverUser();
    if (!payer || !receiver) return;

    this.settleService.settleDebt({
      fromUserId: payer.id,
      toUserId: receiver.id,
      amount: this.amount!,
      date: this.date,
      notes: this.notes.trim() || undefined,
      groupId: this.groupId,
      paymentMethod: this.paymentMethod,
    });

    this.close();
  }

  close(): void {
    this.modalService.closeSettleUp();
  }
}
