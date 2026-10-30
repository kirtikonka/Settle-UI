import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AddExpenseModalComponent } from '../../shared/modals/add-expense-modal/add-expense-modal.component';
import { SettleUpModalComponent } from '../../shared/modals/settle-up-modal/settle-up-modal.component';
import { CreateGroupModalComponent } from '../../shared/modals/create-group-modal/create-group-modal.component';
import { AddFriendModalComponent } from '../../shared/modals/add-friend-modal/add-friend-modal.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    AddExpenseModalComponent,
    SettleUpModalComponent,
    CreateGroupModalComponent,
    AddFriendModalComponent,
  ],
  template: `
    <div class="app-layout">
      <app-header></app-header>

      <div class="app-body">
        <app-sidebar class="app-sidebar-pane"></app-sidebar>

        <main class="main-content-pane">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Global Modals -->
      <app-add-expense-modal></app-add-expense-modal>
      <app-settle-up-modal></app-settle-up-modal>
      <app-create-group-modal></app-create-group-modal>
      <app-add-friend-modal></app-add-friend-modal>
    </div>
  `,
  styles: [`
    .app-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: var(--bg-app);
    }

    .app-body {
      display: flex;
      flex: 1;
      width: 100%;
      max-width: 1440px;
      margin: 0 auto;
    }

    .app-sidebar-pane {
      flex-shrink: 0;
    }

    .main-content-pane {
      flex: 1;
      min-width: 0;
      padding: 1.5rem 2rem;
      overflow-y: auto;

      @media (max-width: 768px) {
        padding: 1rem;
      }
    }
  `],
})
export class ShellComponent {}
