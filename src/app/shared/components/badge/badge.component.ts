import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="badge"
      [class.badge-lent]="type() === 'lent'"
      [class.badge-owed]="type() === 'owed'"
      [class.badge-settled]="type() === 'settled'"
      [class.badge-primary]="type() === 'primary'"
    >
      <ng-content></ng-content>
    </span>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
    `,
  ],
})
export class BadgeComponent {
  type = input<'lent' | 'owed' | 'settled' | 'primary'>('primary');
}
