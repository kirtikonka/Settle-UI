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
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
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
