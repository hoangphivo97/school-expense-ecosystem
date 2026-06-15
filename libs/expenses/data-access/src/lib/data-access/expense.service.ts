import { inject, Injectable } from '@angular/core';
import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExpenseList, CreateExpenseDto, UpdateExpenseDto, PaginatedExpensesResponse, ExpenseAnalyticsDto, ExpenseFilters, AnalyticsFilters } from '@school-expense-ecosystem/expenses/types';
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

  getExpenseListResource(filterFn: () => Omit<ExpenseFilters, 'userId'>): HttpResourceRef<PaginatedExpensesResponse | undefined> {
    return httpResource<PaginatedExpensesResponse>(() => {
      const filters = filterFn();
      let url = `${this.apiUrl}/?limit=${filters.limit}`;

      if (filters.pageToken) url += `&pageToken=${encodeURIComponent(filters.pageToken)}`;
      if (filters.year) url += `&year=${filters.year}`;
      if (filters.month) url += `&month=${filters.month}`;
      if (filters.searchTerm) url += `&searchTerm=${encodeURIComponent(filters.searchTerm)}`;

      return url;
    });
  }

  getAnalyticsResource(filterFn: () => AnalyticsFilters) : HttpResourceRef<ExpenseAnalyticsDto | undefined> {
    return httpResource<ExpenseAnalyticsDto>(() => {
      const filters = filterFn(); // 🔥 ĐÃ ĐƯA VÀO TRONG: Đảm bảo Angular theo dõi được tín hiệu thay đổi
      let url = `${this.apiUrl}/analytics`;
      const queryParams: string[] = [];

      if (filters.year !== undefined && filters.year !== null) {
        queryParams.push(`year=${filters.year}`);
      }
      if (filters.month !== undefined && filters.month !== null) {
        queryParams.push(`month=${filters.month}`);
      }

      if (queryParams.length > 0) url += `?${queryParams.join('&')}`;
      return url;
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
  getAllYearsResource(): HttpResourceRef<number[] | undefined> {
    return httpResource<number[]>(() => `${this.apiUrl}/years`);
  }
}