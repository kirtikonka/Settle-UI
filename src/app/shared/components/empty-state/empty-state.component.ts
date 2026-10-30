import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state-box">
      <div class="empty-icon-wrap">
        <span class="material-symbols-outlined">{{ icon() }}</span>
      </div>
      <h3 class="empty-title">{{ title() }}</h3>
      <p class="empty-desc">{{ description() }}</p>

      @if (actionLabel()) {
        <button class="btn btn-primary" (click)="actionClicked.emit()">
          @if (actionIcon()) {
            <span class="material-symbols-outlined">{{ actionIcon() }}</span>
          }
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      text-align: center;
      background: var(--bg-surface);
      border-radius: var(--radius-md);
      border: 1px dashed var(--border-medium);
      margin: 1rem 0;

      .empty-icon-wrap {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background-color: var(--primary-light);
        color: var(--primary);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1rem;

        .material-symbols-outlined {
          font-size: 2rem;
        }
      }

      .empty-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--text-main);
        margin-bottom: 0.35rem;
      }

      .empty-desc {
        font-size: 0.9rem;
        color: var(--text-muted);
        max-width: 360px;
        margin-bottom: 1.25rem;
        line-height: 1.4;
      }
    }
  `],
})
export class EmptyStateComponent {
  icon = input<string>('receipt_long');
  title = input<string>('No records yet');
  description = input<string>('Get started by adding a new item.');
  actionLabel = input<string | undefined>();
  actionIcon = input<string | undefined>();

  actionClicked = output<void>();
}
