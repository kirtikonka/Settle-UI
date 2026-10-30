import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { SplitwiseService } from '../../core/services/splitwise.service';
import { ModalService } from '../../core/services/modal.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, AvatarComponent],
  template: `
    <header class="app-header">
      <div class="header-left">
        <a routerLink="/dashboard" class="brand-logo">
          <div class="logo-icon">
            <span class="material-symbols-outlined">account_balance_wallet</span>
          </div>
          <span class="brand-name">Settle<span class="highlight">Wise</span></span>
        </a>
      </div>

      <div class="header-center">
        <!-- Quick search or status info -->
        <div class="quick-status">
          <span class="status-indicator"></span>
          <span>Synced locally</span>
        </div>
      </div>

      <div class="header-right">
        <!-- Currency Selector -->
        <div class="currency-toggle">
          <select [value]="splitwiseService.currency()" (change)="onCurrencyChange($event)" class="currency-select" title="Change Currency">
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
            <option value="GBP">£ GBP</option>
            <option value="INR">₹ INR</option>
          </select>
        </div>

        <!-- Reset Demo Data -->
        <button class="btn btn-outline btn-sm reset-btn" (click)="resetData()" title="Reset mock data to initial demo state">
          <span class="material-symbols-outlined">restart_alt</span>
          <span class="btn-text">Reset Demo</span>
        </button>

        <!-- Quick Add Expense -->
        <button class="btn btn-primary btn-sm" (click)="openAddExpense()">
          <span class="material-symbols-outlined">add</span>
          <span>Add Expense</span>
        </button>

        <!-- User Profile -->
        <div class="user-pill">
          <app-avatar
            [src]="splitwiseService.currentUser().avatarUrl"
            [name]="splitwiseService.currentUser().name"
            size="sm"
          ></app-avatar>
          <span class="user-name">{{ splitwiseService.currentUser().name }}</span>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      height: 64px;
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-light);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      text-decoration: none;

      .logo-icon {
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #1cc29f 0%, #159c7e 100%);
        color: #ffffff;
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 8px rgba(28, 194, 159, 0.35);

        .material-symbols-outlined {
          font-size: 1.35rem;
        }
      }

      .brand-name {
        font-size: 1.3rem;
        font-weight: 800;
        letter-spacing: -0.5px;
        color: var(--text-main);

        .highlight {
          color: var(--primary);
        }
      }
    }

    .header-center {
      display: flex;
      align-items: center;

      .quick-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
        background: var(--bg-surface-secondary);
        padding: 0.25rem 0.65rem;
        border-radius: var(--radius-full);

        .status-indicator {
          width: 7px;
          height: 7px;
          background: #10b981;
          border-radius: 50%;
        }
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .currency-select {
      padding: 0.35rem 0.6rem;
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-medium);
      background-color: var(--bg-surface-secondary);
      cursor: pointer;
    }

    .reset-btn {
      color: var(--text-muted);

      &:hover {
        color: var(--text-main);
      }

      @media (max-width: 768px) {
        .btn-text {
          display: none;
        }
      }
    }

    .user-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.65rem 0.25rem 0.25rem;
      background: var(--bg-surface-secondary);
      border-radius: var(--radius-full);
      border: 1px solid var(--border-light);

      .user-name {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-main);
      }
    }
  `],
})
export class HeaderComponent {
  readonly splitwiseService = inject(SplitwiseService);
  readonly modalService = inject(ModalService);

  openAddExpense(): void {
    this.modalService.openAddExpense();
  }

  onCurrencyChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.splitwiseService.currency.set(val);
  }

  resetData(): void {
    if (confirm('Reset all demo data to default Splitwise state?')) {
      this.splitwiseService.resetDemoData();
    }
  }
}
