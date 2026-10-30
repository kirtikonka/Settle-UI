import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, Friend } from '../models/user.model';
import { Group, SimplifiedDebt } from '../models/group.model';
import { Expense } from '../models/expense.model';
import { Settlement } from '../models/settlement.model';
import { ActivityItem } from '../models/activity.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // Auth / User

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/me`);
  }

  // Friends

  getFriends(): Observable<Friend[]> {
    return this.http.get<Friend[]>(`${this.baseUrl}/friends`);
  }

  addFriend(data: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/friends`, data);
  }

  // Groups

  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.baseUrl}/groups`);
  }

  getGroupById(id: string): Observable<Group> {
    return this.http.get<Group>(`${this.baseUrl}/groups/${id}`);
  }

  createGroup(data: Omit<Group, 'id' | 'createdAt'>): Observable<Group> {
    return this.http.post<Group>(`${this.baseUrl}/groups`, data);
  }

  // Expenses

  getExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.baseUrl}/expenses`);
  }

  getExpensesByGroup(groupId: string): Observable<Expense[]> {
    const params = new HttpParams().set('groupId', groupId);
    return this.http.get<Expense[]>(`${this.baseUrl}/expenses`, { params });
  }

  getExpensesByFriend(friendId: string): Observable<Expense[]> {
    const params = new HttpParams().set('friendId', friendId);
    return this.http.get<Expense[]>(`${this.baseUrl}/expenses`, { params });
  }

  addExpense(data: Omit<Expense, 'id' | 'createdAt'>): Observable<Expense> {
    return this.http.post<Expense>(`${this.baseUrl}/expenses`, data);
  }

  updateExpense(id: string, data: Partial<Expense>): Observable<Expense> {
    return this.http.put<Expense>(`${this.baseUrl}/expenses/${id}`, data);
  }

  deleteExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/expenses/${id}`);
  }

  // Settlements

  getSettlements(): Observable<Settlement[]> {
    return this.http.get<Settlement[]>(`${this.baseUrl}/settlements`);
  }

  getSettlementsByFriend(friendId: string): Observable<Settlement[]> {
    const params = new HttpParams().set('friendId', friendId);
    return this.http.get<Settlement[]>(`${this.baseUrl}/settlements`, { params });
  }

  addSettlement(data: Omit<Settlement, 'id' | 'createdAt'>): Observable<Settlement> {
    return this.http.post<Settlement>(`${this.baseUrl}/settlements`, data);
  }

  // Activities

  getActivities(): Observable<ActivityItem[]> {
    return this.http.get<ActivityItem[]>(`${this.baseUrl}/activities`);
  }

  // Balances (computed on backend)

  getGroupMemberBalances(groupId: string): Observable<{ user: User; balance: number }[]> {
    return this.http.get<{ user: User; balance: number }[]>(
      `${this.baseUrl}/groups/${groupId}/balances`
    );
  }

  getSimplifiedDebts(groupId: string): Observable<SimplifiedDebt[]> {
    return this.http.get<SimplifiedDebt[]>(
      `${this.baseUrl}/groups/${groupId}/simplified-debts`
    );
  }

  getDashboardSummary(): Observable<{ totalOwedToYou: number; totalYouOwe: number; netBalance: number }> {
    return this.http.get<{ totalOwedToYou: number; totalYouOwe: number; netBalance: number }>(
      `${this.baseUrl}/dashboard/summary`
    );
  }

  // Reset

  resetData(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/reset`, {});
  }
}
