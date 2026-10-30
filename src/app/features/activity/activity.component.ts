import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SplitwiseService } from '../../core/services/splitwise.service';
import { ActivityItem, ActivityType } from '../../core/models/activity.model';

type ActivityFilter = 'all' | 'expense' | 'settlement' | 'group';

@Component({
  selector: 'app-activity',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  template: `
    <div class="activity-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Recent Activity</h1>
          <p class="page-subtitle">A real-time timeline of shared expenses, settlements, and group updates</p>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="filters-card card">
        <div class="filter-chips">
          <button
            class="chip-btn"
            [class.active]="filter() === 'all'"
            (click)="filter.set('all')"
          >
            All Activity
          </button>
          <button
            class="chip-btn"
            [class.active]="filter() === 'expense'"
            (click)="filter.set('expense')"
          >
            Expenses Only
          </button>
          <button
            class="chip-btn"
            [class.active]="filter() === 'settlement'"
            (click)="filter.set('settlement')"
          >
            Payments & Settlements
          </button>
          <button
            class="chip-btn"
            [class.active]="filter() === 'group'"
            (click)="filter.set('group')"
          >
            Groups & Friends
          </button>
        </div>
      </div>

      <!-- Activity Timeline -->
      @if (filteredActivities().length > 0) {
        <div class="timeline-container card">
          <div class="timeline-list">
            @for (item of filteredActivities(); track item.id) {
              <div class="timeline-item">
                <div class="timeline-icon-box" [ngClass]="getActivityIconClass(item.type)">
                  <span class="material-symbols-outlined">{{ getActivityIcon(item.type) }}</span>
                </div>

                <div class="timeline-content">
                  <div class="timeline-header-row">
                    <span class="activity-title">{{ item.title }}</span>
                    <span class="activity-time">{{ formatTime(item.timestamp) }}</span>
                  </div>

                  @if (item.description || item.groupName) {
                    <div class="activity-meta">
                      @if (item.groupName) {
                        <span class="group-tag">In {{ item.groupName }}</span>
                      }
                      @if (item.description) {
                        <span class="item-desc">{{ item.description }}</span>
                      }
                    </div>
                  }
                </div>

                @if (item.amount) {
                  <div class="timeline-amount-box">
                    <span class="amount-val">{{ splitwiseService.currency() }} {{ item.amount.toFixed(2) }}</span>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      } @else {
        <app-empty-state
          icon="history"
          title="No recent activity"
          description="Actions like adding expenses, paying debts, and creating groups will appear here."
        ></app-empty-state>
      }
    </div>
  `,
  styles: [`
    .activity-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      .page-title {
        font-size: 1.75rem;
        font-weight: 800;
        color: var(--text-main);
      }

      .page-subtitle {
        font-size: 0.9rem;
        color: var(--text-muted);
      }
    }

    .filters-card {
      padding: 0.75rem 1rem;

      .filter-chips {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;

        .chip-btn {
          padding: 0.4rem 0.85rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          background: var(--bg-surface-secondary);
          border-radius: var(--radius-full);
          border: 1px solid var(--border-light);
          transition: var(--transition);

          &:hover {
            color: var(--text-main);
            border-color: var(--border-medium);
          }

          &.active {
            background: var(--primary-light);
            color: var(--primary-hover);
            border-color: var(--primary-border);
          }
        }
      }
    }

    .timeline-container {
      padding: 1.25rem 1.5rem;
    }

    .timeline-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        top: 15px;
        bottom: 15px;
        left: 20px;
        width: 2px;
        background: var(--border-light);
      }
    }

    .timeline-item {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
      position: relative;

      .timeline-icon-box {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        z-index: 1;
        border: 2px solid var(--bg-surface);
        box-shadow: var(--shadow-sm);

        .material-symbols-outlined {
          font-size: 1.25rem;
        }

        &.icon-expense {
          background: #e0f2fe;
          color: #0284c7;
        }

        &.icon-settlement {
          background: #dcfce7;
          color: #16a34a;
        }

        &.icon-group {
          background: #fef3c7;
          color: #d97706;
        }

        &.icon-delete {
          background: #fee2e2;
          color: #dc2626;
        }
      }

      .timeline-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding-top: 0.2rem;

        .timeline-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;

          .activity-title {
            font-size: 0.95rem;
            font-weight: 700;
            color: var(--text-main);
          }

          .activity-time {
            font-size: 0.78rem;
            color: var(--text-subtle);
            white-space: nowrap;
          }
        }

        .activity-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--text-muted);

          .group-tag {
            background: var(--bg-surface-secondary);
            padding: 0.1rem 0.45rem;
            border-radius: var(--radius-xs);
            font-weight: 600;
          }
        }
      }

      .timeline-amount-box {
        padding-top: 0.2rem;

        .amount-val {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--text-main);
        }
      }
    }
  `],
})
export class ActivityComponent {
  readonly splitwiseService = inject(SplitwiseService);
  readonly filter = signal<ActivityFilter>('all');

  readonly filteredActivities = computed<ActivityItem[]>(() => {
    const list = this.splitwiseService.recentActivities();
    const f = this.filter();

    if (f === 'all') return list;
    if (f === 'expense') {
      return list.filter((a) => a.type.startsWith('expense_'));
    }
    if (f === 'settlement') {
      return list.filter((a) => a.type === 'settlement_added');
    }
    if (f === 'group') {
      return list.filter((a) => a.type === 'group_created' || a.type === 'friend_added');
    }
    return list;
  });

  getActivityIcon(type: ActivityType): string {
    switch (type) {
      case 'expense_added': return 'receipt_long';
      case 'expense_updated': return 'edit_note';
      case 'expense_deleted': return 'delete';
      case 'settlement_added': return 'payments';
      case 'group_created': return 'group_add';
      case 'friend_added': return 'person_add';
    }
  }

  getActivityIconClass(type: ActivityType): string {
    if (type === 'settlement_added') return 'icon-settlement';
    if (type === 'expense_deleted') return 'icon-delete';
    if (type === 'group_created' || type === 'friend_added') return 'icon-group';
    return 'icon-expense';
  }

  formatTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}
