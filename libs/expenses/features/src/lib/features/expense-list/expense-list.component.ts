import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
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

  displayedColumns: string[] = ['date', 'description', 'purpose', 'paid', 'for', 'amount', 'action'];
  dialogActionEnum = DialogActionEnum;
  paidMethodEnum = PaidMethodEnum;

  // Reactive trigger state to force-refresh underlying data streams
  private readonly refreshTrigger = signal<number>(0);

  // Listens to router events to safely parse query parameters into an Angular Signal context
  private readonly queryParamsSignal = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.parseUrl(this.router.url).queryParams),
      startWith(this.router.parseUrl(this.router.url).queryParams)
    )
  );

  // Computed signal to derive structured filter parameters whenever URL queries mutate
  readonly filterParams = computed<FilterParams>(() => {
    // Hàm này giả định ông import helper để parse data thô từ URL ra đúng format số/chuỗi
    return this.router.parseUrl(this.router.url).queryParams as unknown as FilterParams;
  });

  // DECLARATIVE DATA FETCHING STREAM: Reacts to active filters and reactive triggers simultaneously
  private readonly rawExpenses$ = toObservable(
    computed(() => ({ filter: this.filterParams(), refresh: this.refreshTrigger() }))
  ).pipe(
    switchMap(({ filter }) => this.expenseService.getExpenseList(filter)),
    catchError((err) => {
      console.error('Failed to resolve expense listing from API gateway:', err);
      return of([] as ExpenseList[]);
    })
  );

  readonly expensesSignal = toSignal(this.rawExpenses$, { initialValue: [] as ExpenseList[] });

  // Automatically remaps standard arrays into MatTableDataSource whenever state values resolve
  readonly dataSource = computed(() => new MatTableDataSource<ExpenseList>(this.expensesSignal()));

  // REACTIVE YEAR LIST STREAM: Re-triggers dropdown population smoothly post mutations
  readonly availableYears = toSignal(
    toObservable(this.refreshTrigger).pipe(
      switchMap(() => this.expenseService.getAllYearsWithDate()),
      catchError(() => of([new Date().getFullYear()]))
    ),
    { initialValue: [new Date().getFullYear()] }
  );

  ngOnInit() {
    this.initDateFormat();
  }

  openCreateExpenseModal() {
    const dialogRef = this.dialog.open(CreateExpenseModalComponent, {
      height: '400px',
      width: '600px',
      data: { title: 'Create new Expense', action: this.dialogActionEnum.Create, isSuccess: false } as DialogData,
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

  /**
   * FLATTENED MODAL WORKFLOW (ELIMINATING SPAGHETTI SUBSCRIPTIONS):
   * Leverages switchMap streams to prevent nested subscription blocks and safeguard memory leaks.
   */
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
          // Creation/Edition mutation payloads are managed inside modal context; react to success here
          return of(res);
        }),
        takeUntilDestroyed(this.destroyRef) // Automatically cleans up bindings on component destruction
      )
      .subscribe(() => {
        // Kickstart trigger to signal state graphs to fetch pristine data automatically
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
      queryParams: { year: params.year, month: params.month },
      queryParamsHandling: 'merge',
    });
  }

  get GlobalDateFormat(): string {
    return this.localStorageService.getItem(LocalStorageKey.dateFormat) as string;
  }
}