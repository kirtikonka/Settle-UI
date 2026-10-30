import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Dashboard — Settle',
      },
      {
        path: 'groups',
        loadComponent: () =>
          import('./features/groups/group-list/group-list.component').then((m) => m.GroupListComponent),
        title: 'Groups — Settle',
      },
      {
        path: 'groups/:id',
        loadComponent: () =>
          import('./features/groups/group-detail/group-detail.component').then((m) => m.GroupDetailComponent),
        title: 'Group Details — Settle',
      },
      {
        path: 'friends',
        loadComponent: () =>
          import('./features/friends/friend-list/friend-list.component').then((m) => m.FriendListComponent),
        title: 'Friends — Settle',
      },
      {
        path: 'friends/:id',
        loadComponent: () =>
          import('./features/friends/friend-detail/friend-detail.component').then((m) => m.FriendDetailComponent),
        title: 'Friend Details — Settle',
      },
      {
        path: 'activity',
        loadComponent: () =>
          import('./features/activity/activity.component').then((m) => m.ActivityComponent),
        title: 'Recent Activity — Settle',
      },
      {
        path: 'expenses',
        loadComponent: () =>
          import('./features/expenses/expense-list/expense-list.component').then((m) => m.ExpenseListComponent),
        title: 'All Expenses — Settle',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
