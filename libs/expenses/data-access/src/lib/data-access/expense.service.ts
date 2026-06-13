import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExpenseList, CreateExpenseDto, UpdateExpenseDto } from '@school-expense-ecosystem/expenses/types';
import { FilterParams } from '@school-expense-ecosystem/shared/types';
import { API_BASE_URL } from '@school-expense-ecosystem/shared/tokens';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly apiUrl = `${this.baseUrl}/api/expenses`;

  /**
   * Fetches the expense list based on active routing filter parameters
   */
  getExpenseList(params: Partial<FilterParams>): Observable<ExpenseList[]> {
    return this.http.get<ExpenseList[]>(this.apiUrl, {
      params: params as Record<string, string | string[]>
    });
  }

  /**
   * Creates a new expense record in the system
   */
  createExpense(data: CreateExpenseDto): Observable<ExpenseList> {
    return this.http.post<ExpenseList>(this.apiUrl, data);
  }

  /**
   * Updates an existing expense record by its unique identifier
   */
  editExpense(id: string, data: UpdateExpenseDto): Observable<ExpenseList> {
    return this.http.put<ExpenseList>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Deletes an expense record from the system
   */
  deleteExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Fetches all unique years containing data to populate the filter dropdown
   */
  getAllYearsWithDate(): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/years`);
  }
}