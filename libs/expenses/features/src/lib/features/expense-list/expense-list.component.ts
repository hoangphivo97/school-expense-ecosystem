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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, startWith, map } from 'rxjs/operators';

import { HeaderComponent, FooterComponent, BaseModalComponent, FilterComponent } from '@school-expense-ecosystem/shared/ui';
import { FilterParams, DialogActionEnum, DialogData } from '@school-expense-ecosystem/shared/types';
import { LocalStorageService } from '@school-expense-ecosystem/shared/data-access';
import { DateFormatValue, LocalStorageKey, ModalMessage } from '@school-expense-ecosystem/shared/constants';
import { ExpenseList } from '@school-expense-ecosystem/expenses/types';
import { ExpenseService } from '@school-expense-ecosystem/expenses/data-access';
import { CreateExpenseModalComponent } from '../create-expense-modal/create-expense-modal.component';
import { EnumToStringPipe } from '../EnumToStringPipe/enum-to-string.pipe';
import { toSignal } from '@angular/core/rxjs-interop';
import { FilterMode } from '@school-expense-ecosystem/shared/types'

@Component({
  selector: 'lib-expense-list',
  standalone: true,
  imports: [
    HeaderComponent, FooterComponent, FormsModule, DecimalPipe, CommonModule,
    MatButtonModule, MatTableModule, MatPaginatorModule, MatIconModule, MatInputModule,
    EnumToStringPipe, FilterComponent
  ],
  templateUrl: './expense-list.component.html',
  styleUrl: './expense-list.component.scss',
})
export class ExpenseListComponent implements OnInit {
  readonly localStorageService = inject(LocalStorageService);
  readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  readonly expenseService = inject(ExpenseService);
  private readonly router = inject(Router);

  paidMethodToString = EnumToStringPipe
  filterModeEnum = FilterMode

  displayedColumns: string[] = [
    'date',
    'requesterCode',
    'requesterName',
    'requesterType',
    'facultyId',
    'description',
    'purpose',
    'paidMethod',
    'amount',
    'status',
    'action'
  ];
  dialogActionEnum = DialogActionEnum;

  readonly pageSize = signal<number>(10);
  readonly currentPageIndex = signal<number>(0);
  private readonly pageTokens = signal<Record<number, string>>({ 0: '' });

  readonly filterParams = signal<FilterParams>({
    searchTerm: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: undefined
  });

  readonly expenseResource = this.expenseService.getExpenseListResource(() => {
    const index = this.currentPageIndex();
    const limit = this.pageSize();
    const filter = this.filterParams();
    const tokens = this.pageTokens();
    const currentToken = tokens[index] || '';

    return {
      limit,
      pageToken: currentToken,
      year: filter.year ? Number(filter.year) : undefined,
      month: filter.month ? Number(filter.month) : undefined,
      searchTerm: filter.searchTerm || undefined
    };
  });

  readonly isLoading = this.expenseResource.isLoading;
  readonly errorMessage = computed(() => this.expenseResource.error() ? 'Failed to resolve database entries.' : null);

  readonly totalItems = computed(() => this.expenseResource.value()?.totalItems ?? 0);
  readonly dataSource = computed(() => {
    const list = this.expenseResource.value()?.expenses ?? [];

    const nextToken = this.expenseResource.value()?.nextPageToken;
    if (nextToken) {
      const nextIndex = this.currentPageIndex() + 1;
      untracked(() => {
        this.pageTokens.update(tokens => ({ ...tokens, [nextIndex]: nextToken }));
      });
    }
    return new MatTableDataSource<ExpenseList>(list);
  });

  readonly availableYearsResource = this.expenseService.getAllYearsResource();
  readonly availableYearsSignal = computed(() => this.availableYearsResource.value() ?? [new Date().getFullYear()]);

  constructor() {
    effect(() => {
      this.filterParams();
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

  getListAfterSuccessCallApi(dialogRef: MatDialogRef<CreateExpenseModalComponent | BaseModalComponent>) {
    dialogRef.afterClosed().pipe(
      filter((res: DialogData | undefined): res is DialogData => !!res && res.isSuccess),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((res) => {
      this.expenseResource.reload();
      this.availableYearsResource.reload();
    })
  }

  openCreateExpenseModal() {
    const dialogRef = this.dialog.open(CreateExpenseModalComponent, {
      width: '600px',
      data: { title: 'Create new Request', action: this.dialogActionEnum.Create, isSuccess: false },
      disableClose: true,
    });
    this.getListAfterSuccessCallApi(dialogRef);
  }

  openEditExpenseModal(data: ExpenseList) {
    const dialogRef = this.dialog.open(CreateExpenseModalComponent, {
      width: '600px',
      data: { title: 'Edit Expense', action: this.dialogActionEnum.Edit, isSuccess: false, data } as DialogData,
      disableClose: true,
    });
    this.getListAfterSuccessCallApi(dialogRef);
  }

  initDateFormat() {
    if (!this.localStorageService.getItem(LocalStorageKey.dateFormat)) {
      this.localStorageService.setItem(LocalStorageKey.dateFormat, DateFormatValue.DMY);
    }
  }

  onExpenseFiltersChanged(params: FilterParams): void {
    this.filterParams.set(params);
  }

  get GlobalDateFormat(): string {
    return this.localStorageService.getItem(LocalStorageKey.dateFormat) as string;
  }
}