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
        title: 'Dashboard — SettleWise',
      },
      {
        path: 'groups',
        loadComponent: () =>
          import('./features/groups/group-list/group-list.component').then((m) => m.GroupListComponent),
        title: 'Groups — SettleWise',
      },
      {
        path: 'groups/:id',
        loadComponent: () =>
          import('./features/groups/group-detail/group-detail.component').then((m) => m.GroupDetailComponent),
        title: 'Group Details — SettleWise',
      },
      {
        path: 'friends',
        loadComponent: () =>
          import('./features/friends/friend-list/friend-list.component').then((m) => m.FriendListComponent),
        title: 'Friends — SettleWise',
      },
      {
        path: 'friends/:id',
        loadComponent: () =>
          import('./features/friends/friend-detail/friend-detail.component').then((m) => m.FriendDetailComponent),
        title: 'Friend Details — SettleWise',
      },
      {
        path: 'activity',
        loadComponent: () =>
          import('./features/activity/activity.component').then((m) => m.ActivityComponent),
        title: 'Recent Activity — SettleWise',
      },
      {
        path: 'expenses',
        loadComponent: () =>
          import('./features/expenses/expense-list/expense-list.component').then((m) => m.ExpenseListComponent),
        title: 'All Expenses — SettleWise',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
