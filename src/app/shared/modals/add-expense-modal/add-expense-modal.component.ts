import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../components/modal/modal.component';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { ModalService } from '../../../core/services/modal.service';
import { SettleService } from '../../../core/services/settle.service';
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
  templateUrl: './add-expense-modal.component.html',
  styleUrl: './add-expense-modal.component.scss',
})
export class AddExpenseModalComponent {
  readonly modalService = inject(ModalService);
  readonly settleService = inject(SettleService);

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
    this.selectedPayerId = this.settleService.currentUser().id;
    this.splitType.set('EQUAL');

    const groups = this.settleService.groups();
    const friends = this.settleService.friends();

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
    const me = this.settleService.currentUser();
    let members: User[] = [me];

    if (val.startsWith('group:')) {
      const gId = val.replace('group:', '');
      const group = this.settleService.groups().find((g) => g.id === gId);
      if (group) {
        members = [...group.members];
      }
    } else if (val.startsWith('friend:')) {
      const fId = val.replace('friend:', '');
      const friend = this.settleService.friends().find((f) => f.id === fId);
      if (friend) {
        members = [me, friend];
      }
    }

    this.eligibleMembers.set(members);

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
          ? `${this.settleService.currency()} ${diff.toFixed(2)} remaining to allocate.`
          : `${this.settleService.currency()} ${Math.abs(diff).toFixed(2)} over allocated.`
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

    this.settleService.addExpense({
      title: this.title.trim(),
      amount: this.amount!,
      currency: this.settleService.currency(),
      category: this.category,
      date: this.date,
      groupId,
      paidBy: payers,
      splits,
      splitType: this.splitType(),
      createdBy: this.settleService.currentUser().id,
    });

    this.close();
  }

  close(): void {
    this.modalService.closeAddExpense();
  }
}
