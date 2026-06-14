// libs/expenses/features/src/lib/features/expense-list/expense-list.component.ts
import { Component, computed, DestroyRef, inject, OnInit, signal, effect, untracked } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, filter, map, of, startWith, switchMap } from 'rxjs';

import { HeaderComponent, FooterComponent, BaseModalComponent, FilterComponent, SettingsServiceService } from '@school-expense-ecosystem/shared/ui';
import { FilterParams, DialogActionEnum, DialogData } from '@school-expense-ecosystem/shared/types';
import { LocalStorageService } from '@school-expense-ecosystem/shared/data-access';
import { DateFormatValue, LocalStorageKey, ModalMessage } from '@school-expense-ecosystem/shared/constants';
import { ExpenseList, PaidMethodEnum } from '@school-expense-ecosystem/expenses/types';
import { ExpenseService } from '@school-expense-ecosystem/expenses/data-access';
import { CreateExpenseModalComponent } from '../create-expense-modal/create-expense-modal.component';
import { EnumToStringPipe } from '../EnumToStringPipe/enum-to-string.pipe';
import { AuthSignalStore } from '@school-expense-ecosystem/auth/data-access';

@Component({
  selector: 'lib-expense-list',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    FormsModule,
    DecimalPipe,
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatInputModule,
    EnumToStringPipe,
    FilterComponent,
  ],
  templateUrl: './expense-list.component.html',
  styleUrl: './expense-list.component.scss',
})
export class ExpenseListComponent implements OnInit {
  readonly settingsService = inject(SettingsServiceService);
  readonly localStorageService = inject(LocalStorageService);
  readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  readonly expenseService = inject(ExpenseService);
  private readonly router = inject(Router);
  private readonly authSignalStore = inject(AuthSignalStore);

  displayedColumns: string[] = ['date', 'description', 'purpose', 'paid', 'for', 'amount', 'action'];
  dialogActionEnum = DialogActionEnum;
  paidMethodEnum = PaidMethodEnum;

  // Local states managed via native Angular Signals matching the administration UI
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  private readonly refreshTrigger = signal<number>(0);

  // Server-side pagination states fully driven by active stream configurations
  readonly pageSize = signal<number>(10);
  readonly currentPageIndex = signal<number>(0);
  private readonly pageTokens = signal<Record<number, string>>({ 0: '' });

  private readonly queryParamsSignal = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.parseUrl(this.router.url).queryParams),
      startWith(this.router.parseUrl(this.router.url).queryParams)
    )
  );

  readonly filterParams = computed<FilterParams>(() => {
    const params = this.queryParamsSignal();
    return params as unknown as FilterParams;
  });

  // PURE USER-LIST ARCHITECTURE PATTERN: Consolidates operational query metadata parameters
  private readonly remoteParams$ = toObservable(
    computed(() => {
      const index = this.currentPageIndex();
      const limit = this.pageSize();
      const filter = this.filterParams();

      const tokens = untracked(this.pageTokens);
      const currentToken = tokens[index] || '';

      return {
        limit,
        pageToken: currentToken,
        year: filter.year ? Number(filter.year) : undefined,
        month: filter.month ? Number(filter.month) : undefined,
        searchTerm: filter.searchTerm || undefined, // 👈 Đăng ký dependency tìm kiếm cho pipeline
        refresh: this.refreshTrigger()
      };
    })
  );

  // ASYNC NETWORK PIPELINE CONTEXT: Directly derived from the remote parameters stream topology
  private readonly apiResponse$ = this.remoteParams$.pipe(
    switchMap(({ limit, pageToken, year, month, searchTerm }) => {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      return this.expenseService.getExpenseList({ limit, pageToken, year, month, searchTerm }).pipe(
        catchError((err) => {
          console.error('Fetch paginated expenses pipeline crashed:', err);
          this.errorMessage.set('Failed to resolve database entries.');
          return of({ expenses: [] as ExpenseList[], nextPageToken: null as string | null, totalItems: 0 });
        })
      );
    }),
    map((response) => {
      this.isLoading.set(false);

      if (response.nextPageToken) {
        const nextIndex = this.currentPageIndex() + 1;
        this.pageTokens.update(tokens => ({
          ...tokens,
          [nextIndex]: response.nextPageToken as string
        }));
      }
      return response;
    })
  );

  readonly apiResponseSignal = toSignal(this.apiResponse$, {
    initialValue: { expenses: [] as ExpenseList[], nextPageToken: null as string | null, totalItems: 0 }
  });

  // Exposes total records count straight to the UI paginator layout configuration
  readonly totalItems = computed(() => this.apiResponseSignal().totalItems);

  readonly dataSource = computed(() => new MatTableDataSource<ExpenseList>(this.apiResponseSignal().expenses));

  readonly availableYears = toSignal(
    toObservable(this.refreshTrigger).pipe(
      switchMap(() => this.expenseService.getAllYearsWithDate()),
      catchError(() => of([new Date().getFullYear()]))
    ),
    { initialValue: [new Date().getFullYear()] }
  );

  constructor() {
    // SAFETY EFFECT EFFECT: Flushes page pointers safely back to root coordinates upon filter alterations
    effect(() => {
      this.filterParams();
      this.refreshTrigger();

      untracked(() => {
        this.currentPageIndex.set(0);
        this.pageTokens.set({ 0: '' });
      });
    });
  }

  ngOnInit() {
    this.initDateFormat();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.currentPageIndex.set(event.pageIndex);
  }

  openCreateExpenseModal() {
    const dialogRef = this.dialog.open(CreateExpenseModalComponent, {
      height: '400px',
      width: '600px',
      data: { title: 'Create new Expense', action: this.dialogActionEnum.Create, isSuccess: false },
      disableClose: true,
    });
    this.getListAfterSuccessCallApi(dialogRef);
  }

  openEditExpenseModal(data: ExpenseList) {
    const dialogRef = this.dialog.open(CreateExpenseModalComponent, {
      height: '400px',
      width: '600px',
      data: { title: 'Edit Expense', action: this.dialogActionEnum.Edit, isSuccess: false, data } as DialogData,
      disableClose: true,
    });
    this.getListAfterSuccessCallApi(dialogRef);
  }

  openDeleteConfirmModal(id: string, description: string) {
    const dialogRef = this.dialog.open(BaseModalComponent, {
      height: '200px',
      width: '400px',
      data: {
        title: 'Delete',
        action: this.dialogActionEnum.Delete,
        isSuccess: false,
        data: id,
        content: { message: ModalMessage.delete, description }
      } as DialogData,
      disableClose: true,
    });
    this.getListAfterSuccessCallApi(dialogRef);
  }

  getListAfterSuccessCallApi(
    dialogRef: MatDialogRef<CreateExpenseModalComponent | BaseModalComponent>,
  ) {
    dialogRef
      .afterClosed()
      .pipe(
        filter((res: DialogData | undefined): res is DialogData => !!res && res.isSuccess),
        switchMap((res: DialogData) => {
          if (res.action === this.dialogActionEnum.Delete && res.data) {
            return this.expenseService.deleteExpense(res.data as string).pipe(
              catchError((err) => {
                console.error('Error encountered while processing delete operation:', err);
                return of(null);
              })
            );
          }
          return of(res);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.refreshTrigger.update((n) => n + 1);
      });
  }

  initDateFormat() {
    if (!this.localStorageService.getItem(LocalStorageKey.dateFormat)) {
      this.localStorageService.setItem(LocalStorageKey.dateFormat, DateFormatValue.DMY);
    }
  }

  onFilterChanged(params: FilterParams) {
    this.router.navigate([], {
      queryParams: { 
        year: params.year, 
        month: params.month,
        searchTerm: params.searchTerm || null
      },
      queryParamsHandling: 'merge',
    });
  }

  get GlobalDateFormat(): string {
    return this.localStorageService.getItem(LocalStorageKey.dateFormat) as string;
  }
}