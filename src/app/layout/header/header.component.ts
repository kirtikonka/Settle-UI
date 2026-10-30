import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { SettleService } from '../../core/services/settle.service';
import { ModalService } from '../../core/services/modal.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, AvatarComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly settleService = inject(SettleService);
  readonly modalService = inject(ModalService);

  openAddExpense(): void {
    this.modalService.openAddExpense();
  }

  onCurrencyChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.settleService.currency.set(val);
  }

  resetData(): void {
    if (confirm('Reset all demo data to default Settle state?')) {
      this.settleService.resetDemoData();
    }
  }
}
