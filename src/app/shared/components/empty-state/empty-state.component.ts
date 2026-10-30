import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  icon = input<string>('receipt_long');
  title = input<string>('No records yet');
  description = input<string>('Get started by adding a new item.');
  actionLabel = input<string | undefined>();
  actionIcon = input<string | undefined>();

  actionClicked = output<void>();
}
