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
  templateUrl: './activity.component.html',
  styleUrl: './activity.component.scss',
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
