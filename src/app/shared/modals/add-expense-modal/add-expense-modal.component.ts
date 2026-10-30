import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../components/modal/modal.component';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { ModalService } from '../../../core/services/modal.service';
import { SplitwiseService } from '../../../core/services/splitwise.service';
import { ExpenseCategory, ExpensePayer, ExpenseSplit, SplitType } from '../../../core/models/expense.model';
import { User } from '../../../core/models/user.model';

interface SplitRow {
  user: User;
  isIncluded: boolean;
  amount: number;
  percentage: number;
  shares: number;
}

@Component({
  selector: 'app-add-expense-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, AvatarComponent],
  template: `
    <app-modal
      [isOpen]="modalService.isAddExpenseOpen()"
      title="Add an Expense"
      icon="receipt_long"
      maxWidth="580px"
      (close)="close()"
    >
      <div body class="expense-form">
        <!-- Target Selection (Group or Friend) -->
        <div class="form-group">
          <label class="form-label">With you and:</label>
          <div class="context-selector">
            <select
              [ngModel]="selectedContext()"
              (ngModelChange)="onContextChange($event)"
              class="form-control"
            >
              <optgroup label="Groups">
                @for (group of splitwiseService.groups(); track group.id) {
                  <option [value]="'group:' + group.id">Group: {{ group.name }}</option>
                }
              </optgroup>
              <optgroup label="Friends (Individual)">
                @for (friend of splitwiseService.friends(); track friend.id) {
                  <option [value]="'friend:' + friend.id">Friend: {{ friend.name }}</option>
                }
              </optgroup>
            </select>
          </div>
        </div>

        <!-- Description & Amount -->
        <div class="form-row">
          <div class="form-group flex-2">
            <label class="form-label">Description</label>
            <div class="input-with-icon">
              <span class="material-symbols-outlined input-icon">description</span>
              <input
                type="text"
                [(ngModel)]="title"
                placeholder="e.g. Dinner with team, Flight tickets"
                class="form-control"
              />
            </div>
          </div>

          <div class="form-group flex-1">
            <label class="form-label">Amount ({{ splitwiseService.currency() }})</label>
            <div class="input-with-icon">
              <span class="material-symbols-outlined input-icon">payments</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                [(ngModel)]="amount"
                (ngModelChange)="onAmountChange()"
                placeholder="0.00"
                class="form-control amount-input"
              />
            </div>
          </div>
        </div>

        <!-- Category & Date -->
        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">Category</label>
            <select [(ngModel)]="category" class="form-control">
              <option value="food">🍽️ Food & Dining</option>
              <option value="groceries">🛒 Groceries</option>
              <option value="transport">🚕 Transport & Fuel</option>
              <option value="travel">✈️ Travel & Hotel</option>
              <option value="entertainment">🎟️ Entertainment</option>
              <option value="utilities">💡 Utilities & Bills</option>
              <option value="rent">🏠 Rent</option>
              <option value="shopping">🛍️ Shopping</option>
              <option value="general">📦 General</option>
            </select>
          </div>

          <div class="form-group flex-1">
            <label class="form-label">Date</label>
            <input type="date" [(ngModel)]="date" class="form-control" />
          </div>
        </div>

        <!-- Paid By Selector -->
        <div class="form-group paid-by-section">
          <label class="form-label">Paid by:</label>
          <div class="payer-picker">
            <select [(ngModel)]="selectedPayerId" class="form-control">
              <option [value]="splitwiseService.currentUser().id">You ({{ splitwiseService.currentUser().name }})</option>
              @for (member of eligibleMembers(); track member.id) {
                @if (member.id !== splitwiseService.currentUser().id) {
                  <option [value]="member.id">{{ member.name }}</option>
                }
              }
            </select>
          </div>
        </div>

        <!-- Split Mode Tabs -->
        <div class="split-section">
          <div class="split-header">
            <label class="form-label">Split Type:</label>
            <div class="split-tabs">
              <button
                type="button"
                class="split-tab"
                [class.active]="splitType() === 'EQUAL'"
                (click)="setSplitType('EQUAL')"
              >
                Equally (=)
              </button>
              <button
                type="button"
                class="split-tab"
                [class.active]="splitType() === 'EXACT'"
                (click)="setSplitType('EXACT')"
              >
                Exact ($)
              </button>
              <button
                type="button"
                class="split-tab"
                [class.active]="splitType() === 'PERCENT'"
                (click)="setSplitType('PERCENT')"
              >
                Percent (%)
              </button>
              <button
                type="button"
                class="split-tab"
                [class.active]="splitType() === 'SHARES'"
                (click)="setSplitType('SHARES')"
              >
                Shares (x)
              </button>
            </div>
          </div>

          <!-- Split Members Table -->
          <div class="split-table">
            @for (row of splitRows(); track row.user.id; let i = $index) {
              <div class="split-row" [class.row-excluded]="!row.isIncluded">
                <div class="member-info">
                  <input
                    type="checkbox"
                    [(ngModel)]="row.isIncluded"
                    (ngModelChange)="recalculateSplits()"
                  />
                  <app-avatar [src]="row.user.avatarUrl" [name]="row.user.name" size="sm"></app-avatar>
                  <span class="member-name">{{ row.user.name }} {{ row.user.id === splitwiseService.currentUser().id ? '(You)' : '' }}</span>
                </div>

                <div class="split-inputs">
                  @switch (splitType()) {
                    @case ('EQUAL') {
                      <span class="calculated-amount">
                        {{ splitwiseService.currency() }} {{ row.amount.toFixed(2) }}
                      </span>
                    }
                    @case ('EXACT') {
                      <div class="custom-input-group">
                        <span>{{ splitwiseService.currency() }}</span>
                        <input
                          type="number"
                          [(ngModel)]="row.amount"
                          (ngModelChange)="onExactAmountChanged()"
                          [disabled]="!row.isIncluded"
                          class="small-input"
                          step="0.01"
                        />
                      </div>
                    }
                    @case ('PERCENT') {
                      <div class="custom-input-group">
                        <input
                          type="number"
                          [(ngModel)]="row.percentage"
                          (ngModelChange)="onPercentChanged()"
                          [disabled]="!row.isIncluded"
                          class="small-input"
                          step="1"
                        />
                        <span>%</span>
                        <small class="calculated-hint">({{ splitwiseService.currency() }} {{ row.amount.toFixed(2) }})</small>
                      </div>
                    }
                    @case ('SHARES') {
                      <div class="custom-input-group">
                        <input
                          type="number"
                          [(ngModel)]="row.shares"
                          (ngModelChange)="onSharesChanged()"
                          [disabled]="!row.isIncluded"
                          class="small-input"
                          min="1"
                          step="1"
                        />
                        <span>parts</span>
                        <small class="calculated-hint">({{ splitwiseService.currency() }} {{ row.amount.toFixed(2) }})</small>
                      </div>
                    }
                  }
                </div>
              </div>
            }
          </div>

          @if (splitValidationWarning()) {
            <div class="validation-warning">
              <span class="material-symbols-outlined">warning</span>
              <span>{{ splitValidationWarning() }}</span>
            </div>
          }
        </div>
      </div>

      <div footer>
        <button type="button" class="btn btn-outline" (click)="close()">Cancel</button>
        <button
          type="button"
          class="btn btn-primary"
          [disabled]="!isValid()"
          (click)="saveExpense()"
        >
          <span class="material-symbols-outlined">check</span>
          Save Expense
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .expense-form {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }

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

    .form-control {
      width: 100%;
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

    .amount-input {
      font-weight: 700;
      font-size: 1.1rem;
      color: var(--primary-hover);
    }

    .split-section {
      background: var(--bg-surface-secondary);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      padding: 1rem;
    }

    .split-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .split-tabs {
      display: flex;
      background: var(--bg-surface-tertiary);
      border-radius: var(--radius-sm);
      padding: 2px;
      gap: 2px;

      .split-tab {
        padding: 0.3rem 0.65rem;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-muted);
        border-radius: 6px;
        transition: var(--transition);

        &.active {
          background: var(--bg-surface);
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }
      }
    }

    .split-table {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 200px;
      overflow-y: auto;
      padding-right: 0.25rem;
    }

    .split-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-sm);
      transition: var(--transition);

      &.row-excluded {
        opacity: 0.5;
        background: transparent;
      }

      .member-info {
        display: flex;
        align-items: center;
        gap: 0.65rem;

        .member-name {
          font-size: 0.9rem;
          font-weight: 500;
        }
      }

      .calculated-amount {
        font-weight: 600;
        font-size: 0.95rem;
        color: var(--text-main);
      }

      .custom-input-group {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.85rem;

        .small-input {
          width: 75px;
          padding: 0.25rem 0.45rem;
          text-align: right;
          font-weight: 600;
        }

        .calculated-hint {
          color: var(--text-muted);
          font-size: 0.75rem;
        }
      }
    }

    .validation-warning {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.75rem;
      color: #d97706;
      background: #fef3c7;
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 500;

      .material-symbols-outlined {
        font-size: 1.1rem;
      }
    }
  `],
})
export class AddExpenseModalComponent {
  readonly modalService = inject(ModalService);
  readonly splitwiseService = inject(SplitwiseService);

  title = '';
  amount: number | null = null;
  category: ExpenseCategory = 'food';
  date = new Date().toISOString().split('T')[0];

  selectedContext = signal<string>('');
  selectedPayerId = '';
  splitType = signal<SplitType>('EQUAL');

  eligibleMembers = signal<User[]>([]);
  splitRows = signal<SplitRow[]>([]);
  splitValidationWarning = signal<string | null>(null);

  constructor() {
    // When modal opens, initialize fields
    effect(() => {
      if (this.modalService.isAddExpenseOpen()) {
        const initialData = this.modalService.addExpenseData();
        this.initForm(initialData);
      }
    });
  }

  private initForm(initialData: { groupId?: string; friendId?: string } | null): void {
    this.title = '';
    this.amount = null;
    this.category = 'food';
    this.date = new Date().toISOString().split('T')[0];
    this.selectedPayerId = this.splitwiseService.currentUser().id;
    this.splitType.set('EQUAL');

    const groups = this.splitwiseService.groups();
    const friends = this.splitwiseService.friends();

    if (initialData?.groupId) {
      this.selectedContext.set(`group:${initialData.groupId}`);
    } else if (initialData?.friendId) {
      this.selectedContext.set(`friend:${initialData.friendId}`);
    } else if (groups.length > 0) {
      this.selectedContext.set(`group:${groups[0].id}`);
    } else if (friends.length > 0) {
      this.selectedContext.set(`friend:${friends[0].id}`);
    }

    this.updateEligibleMembers();
  }

  onContextChange(val: string): void {
    this.selectedContext.set(val);
    this.updateEligibleMembers();
  }

  private updateEligibleMembers(): void {
    const val = this.selectedContext();
    const me = this.splitwiseService.currentUser();
    let members: User[] = [me];

    if (val.startsWith('group:')) {
      const gId = val.replace('group:', '');
      const group = this.splitwiseService.groups().find((g) => g.id === gId);
      if (group) {
        members = [...group.members];
      }
    } else if (val.startsWith('friend:')) {
      const fId = val.replace('friend:', '');
      const friend = this.splitwiseService.friends().find((f) => f.id === fId);
      if (friend) {
        members = [me, friend];
      }
    }

    this.eligibleMembers.set(members);

    // Setup initial split rows
    const rows: SplitRow[] = members.map((m) => ({
      user: m,
      isIncluded: true,
      amount: 0,
      percentage: Math.round(100 / members.length),
      shares: 1,
    }));

    this.splitRows.set(rows);
    this.recalculateSplits();
  }

  onAmountChange(): void {
    this.recalculateSplits();
  }

  setSplitType(type: SplitType): void {
    this.splitType.set(type);
    this.recalculateSplits();
  }

  recalculateSplits(): void {
    const total = this.amount || 0;
    const currentRows = [...this.splitRows()];
    const included = currentRows.filter((r) => r.isIncluded);

    this.splitValidationWarning.set(null);

    if (included.length === 0) {
      this.splitValidationWarning.set('At least one person must be included in the split.');
      return;
    }

    if (this.splitType() === 'EQUAL') {
      const perPerson = Math.round((total / included.length) * 100) / 100;
      currentRows.forEach((r) => {
        r.amount = r.isIncluded ? perPerson : 0;
      });
      // Handle rounding cents
      const sum = currentRows.reduce((acc, r) => acc + r.amount, 0);
      if (sum !== total && included.length > 0) {
        included[0].amount += Math.round((total - sum) * 100) / 100;
      }
    } else if (this.splitType() === 'PERCENT') {
      currentRows.forEach((r) => {
        r.amount = r.isIncluded ? Math.round(((total * (r.percentage || 0)) / 100) * 100) / 100 : 0;
      });
      const totalPercent = included.reduce((acc, r) => acc + (r.percentage || 0), 0);
      if (totalPercent !== 100) {
        this.splitValidationWarning.set(`Percentages sum to ${totalPercent}%, must equal 100%.`);
      }
    } else if (this.splitType() === 'SHARES') {
      const totalShares = included.reduce((acc, r) => acc + (r.shares || 1), 0);
      currentRows.forEach((r) => {
        r.amount = r.isIncluded && totalShares > 0 ? Math.round(((total * (r.shares || 1)) / totalShares) * 100) / 100 : 0;
      });
    }

    this.splitRows.set(currentRows);
  }

  onExactAmountChanged(): void {
    const total = this.amount || 0;
    const included = this.splitRows().filter((r) => r.isIncluded);
    const sum = included.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

    if (Math.abs(sum - total) > 0.01) {
      const diff = Math.round((total - sum) * 100) / 100;
      this.splitValidationWarning.set(
        diff > 0
          ? `${this.splitwiseService.currency()} ${diff.toFixed(2)} remaining to allocate.`
          : `${this.splitwiseService.currency()} ${Math.abs(diff).toFixed(2)} over allocated.`
      );
    } else {
      this.splitValidationWarning.set(null);
    }
  }

  onPercentChanged(): void {
    this.recalculateSplits();
  }

  onSharesChanged(): void {
    this.recalculateSplits();
  }

  isValid(): boolean {
    if (!this.title.trim() || !this.amount || this.amount <= 0) return false;
    const included = this.splitRows().filter((r) => r.isIncluded);
    if (included.length === 0) return false;
    if (this.splitValidationWarning() !== null) return false;
    return true;
  }

  saveExpense(): void {
    if (!this.isValid()) return;

    const val = this.selectedContext();
    let groupId: string | undefined = undefined;
    if (val.startsWith('group:')) {
      groupId = val.replace('group:', '');
    }

    const payers: ExpensePayer[] = [
      {
        userId: this.selectedPayerId,
        amount: this.amount!,
      },
    ];

    const splits: ExpenseSplit[] = this.splitRows().map((row) => ({
      userId: row.user.id,
      amount: row.amount,
      percentage: row.percentage,
      shares: row.shares,
      isIncluded: row.isIncluded,
    }));

    this.splitwiseService.addExpense({
      title: this.title.trim(),
      amount: this.amount!,
      currency: this.splitwiseService.currency(),
      category: this.category,
      date: this.date,
      groupId,
      paidBy: payers,
      splits,
      splitType: this.splitType(),
      createdBy: this.splitwiseService.currentUser().id,
    });

    this.close();
  }

  close(): void {
    this.modalService.closeAddExpense();
  }
}
