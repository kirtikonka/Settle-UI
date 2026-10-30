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
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {}
