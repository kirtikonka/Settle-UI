import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../components/modal/modal.component';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { ModalService } from '../../../core/services/modal.service';
import { SplitwiseService } from '../../../core/services/splitwise.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-settle-up-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, AvatarComponent],
  template: `
    <app-modal
      [isOpen]="modalService.isSettleUpOpen()"
      title="Settle Up"
      icon="handshake"
      maxWidth="500px"
      (close)="close()"
    >
      <div body class="settle-form">
        <!-- Relationship selector -->
        <div class="settle-participant-card">
          <div class="participant-side">
            <app-avatar [src]="getPayerUser()?.avatarUrl" [name]="getPayerUser()?.name || 'Payer'" size="md"></app-avatar>
            <span class="user-role-label">Payer</span>
            <span class="user-name-label">{{ getPayerUser()?.name }}</span>
          </div>

          <div class="arrow-wrap">
            <button type="button" class="swap-direction-btn" (click)="swapDirection()" title="Swap direction">
              <span class="material-symbols-outlined">sync_alt</span>
            </button>
          </div>

          <div class="participant-side">
            <app-avatar [src]="getReceiverUser()?.avatarUrl" [name]="getReceiverUser()?.name || 'Receiver'" size="md"></app-avatar>
            <span class="user-role-label">Receiver</span>
            <span class="user-name-label">{{ getReceiverUser()?.name }}</span>
          </div>
        </div>

        <!-- Friend Selector if multiple -->
        <div class="form-group">
          <label class="form-label">Settle with friend:</label>
          <select [ngModel]="selectedFriendId()" (ngModelChange)="onFriendChange($event)" class="form-control">
            @for (friend of splitwiseService.friends(); track friend.id) {
              <option [value]="friend.id">
                {{ friend.name }}
                @if (friend.balance > 0) {
                  (Owes you {{ splitwiseService.currency() }} {{ friend.balance.toFixed(2) }})
                } @else if (friend.balance < 0) {
                  (You owe {{ splitwiseService.currency() }} {{ (-friend.balance).toFixed(2) }})
                } @else {
                  (Settled up)
                }
              </option>
            }
          </select>
        </div>

        <!-- Direction toggle (I paid them vs They paid me) -->
        <div class="direction-toggle-group">
          <button
            type="button"
            class="direction-btn"
            [class.active]="direction() === 'ME_PAID_THEM'"
            (click)="setDirection('ME_PAID_THEM')"
          >
            You paid {{ getFriend()?.name }}
          </button>
          <button
            type="button"
            class="direction-btn"
            [class.active]="direction() === 'THEY_PAID_ME'"
            (click)="setDirection('THEY_PAID_ME')"
          >
            {{ getFriend()?.name }} paid you
          </button>
        </div>

        <!-- Amount -->
        <div class="form-group">
          <label class="form-label">Amount ({{ splitwiseService.currency() }})</label>
          <div class="amount-container">
            <span class="currency-prefix">{{ splitwiseService.currency() }}</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              [(ngModel)]="amount"
              placeholder="0.00"
              class="form-control amount-field"
            />
          </div>
        </div>

        <!-- Payment Method & Date -->
        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">Payment Method</label>
            <select [(ngModel)]="paymentMethod" class="form-control">
              <option value="cash">💵 Cash</option>
              <option value="upi">⚡ UPI / Instant Pay</option>
              <option value="venmo">📱 Venmo</option>
              <option value="paypal">💳 PayPal</option>
              <option value="bank_transfer">🏦 Bank Transfer</option>
              <option value="other">📝 Other</option>
            </select>
          </div>

          <div class="form-group flex-1">
            <label class="form-label">Date</label>
            <input type="date" [(ngModel)]="date" class="form-control" />
          </div>
        </div>

        <!-- Notes -->
        <div class="form-group">
          <label class="form-label">Notes (optional)</label>
          <input
            type="text"
            [(ngModel)]="notes"
            placeholder="e.g. Settle up for trip dinner"
            class="form-control"
          />
        </div>
      </div>

      <div footer>
        <button type="button" class="btn btn-outline" (click)="close()">Cancel</button>
        <button
          type="button"
          class="btn btn-primary"
          [disabled]="!isValid()"
          (click)="recordSettlement()"
        >
          <span class="material-symbols-outlined">payments</span>
          Record Payment
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .settle-form {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
    }

    .settle-participant-card {
      display: flex;
      align-items: center;
      justify-content: space-around;
      background: var(--bg-surface-secondary);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      padding: 1.25rem 1rem;

      .participant-side {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.35rem;

        .user-role-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .user-name-label {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-main);
        }
      }

      .swap-direction-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--bg-surface);
        border: 1px solid var(--border-medium);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--primary);
        box-shadow: var(--shadow-sm);
        transition: var(--transition);

        &:hover {
          background: var(--primary-light);
          border-color: var(--primary);
          transform: rotate(180deg);
        }
      }
    }

    .direction-toggle-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;

      .direction-btn {
        padding: 0.65rem 0.5rem;
        font-size: 0.85rem;
        font-weight: 600;
        border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm);
        background: var(--bg-surface);
        color: var(--text-secondary);
        transition: var(--transition);
        text-align: center;

        &.active {
          border-color: var(--primary);
          background-color: var(--primary-light);
          color: var(--primary-hover);
        }
      }
    }

    .amount-container {
      position: relative;
      display: flex;
      align-items: center;

      .currency-prefix {
        position: absolute;
        left: 0.85rem;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-muted);
        pointer-events: none;
      }

      .amount-field {
        font-size: 1.5rem;
        font-weight: 700;
        padding-left: 2.75rem;
        color: var(--text-main);
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .flex-1 { flex: 1; }

    .form-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
  `],
})
export class SettleUpModalComponent {
  readonly modalService = inject(ModalService);
  readonly splitwiseService = inject(SplitwiseService);

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
    const friends = this.splitwiseService.friends();
    const me = this.splitwiseService.currentUser();
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

    // Setup direction and amount based on who owes whom
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
        // I owe friend
        this.direction.set('ME_PAID_THEM');
        this.amount = Math.abs(friend.balance);
      } else if (friend.balance > 0) {
        // Friend owes me
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
    const friend = this.splitwiseService.friends().find((f) => f.id === fId);
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
    return this.splitwiseService.friends().find((f) => f.id === this.selectedFriendId());
  }

  getPayerUser(): User | undefined {
    const me = this.splitwiseService.currentUser();
    return this.direction() === 'ME_PAID_THEM' ? me : this.getFriend();
  }

  getReceiverUser(): User | undefined {
    const me = this.splitwiseService.currentUser();
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

    this.splitwiseService.settleDebt({
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
