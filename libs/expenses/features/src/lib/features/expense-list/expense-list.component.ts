import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { HeaderComponent, FooterComponent, BaseModalComponent, FilterComponent, SettingsServiceService } from '@school-expense-ecosystem/shared/ui';
import {
  FilterParams,
} from '@school-expense-ecosystem/shared/types';
import { EnumToStringPipe } from '../EnumToStringPipe/enum-to-string.pipe';
import { PaidMethodEnum, EditExpense, ExpenseList, parseRouterFilterParams } from '@school-expense-ecosystem/expenses/data-access';
import { CreateExpenseModalComponent } from '../create-expense-modal/create-expense-modal.component';
import { ExpenseService } from '@school-expense-ecosystem/expenses/data-access';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DateFormatValue,
  LocalStorageKey,
  ModalMessage,
} from '@school-expense-ecosystem/shared/constants';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  DialogActionEnum,
  DialogData
} from '@school-expense-ecosystem/shared/types';
import { LocalStorageService } from '@school-expense-ecosystem/shared/data-access';;
import { MatInputModule } from '@angular/material/input';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatPaginator } from '@angular/material/paginator';
import { catchError, filter, map, of, startWith, switchMap } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'lib-expense-list',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    NgbPaginationModule,
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


  displayedColumns: string[] = [
    'date',
    'description',
    'purpose',
    'paid',
    'for',
    'amount',
    'action',
  ];

  private readonly queryParamsSignal = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.parseUrl(this.router.url).queryParams),
      startWith(this.router.parseUrl(this.router.url).queryParams) // Extracts parameters instantly on load
    )
  );

  private readonly refreshTrigger = signal<number>(0);

  dialogActionEnum = DialogActionEnum;
  paidMethodEnum = PaidMethodEnum;

  params!: FilterParams;

  availableYears: number[] = [];

  readonly filterParams = computed<FilterParams>(() =>
    parseRouterFilterParams(this.queryParamsSignal())
  );

  private readonly rawExpenses$ =
    toObservable(
      computed(() => ({ filter: this.filterParams(), refresh: this.refreshTrigger() })))
      .pipe(
        switchMap(({ filter }) => this.expenseService.getExpenseList(filter)
        ), catchError((e) => {
          console.error("Get List Firebase Error", e);
          return of([] as ExpenseList[]);
        })
      );

  readonly expensesSignal = toSignal(this.rawExpenses$, { initialValue: [] as ExpenseList[] });

  readonly dataSource = computed(() => {
    const list = this.expensesSignal();
    return new MatTableDataSource<ExpenseList>(list);
  });


  ngOnInit() {
    this.initDateFormat();
    this.getCurrYear();
  }

  private getCurrYear() {
    this.expenseService.getAllYearsWithDate()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(years => this.availableYears = years);
  }

  openCreateExpenseModal() {
    const dialogRef = this.dialog.open(CreateExpenseModalComponent, {
      height: '400px',
      width: '600px',
      data: {
        title: 'Create new Expense',
        action: this.dialogActionEnum.Create,
        isSuccess: false,
      } as DialogData,
      disableClose: true,
    });

    this.getListAfterSuccessCallApi(dialogRef);
  }

  openEditExpenseModal(data: EditExpense) {
    const dialogRef = this.dialog.open(CreateExpenseModalComponent, {
      height: '400px',
      width: '600px',
      data: {
        title: 'Edit Expense',
        action: this.dialogActionEnum.Edit,
        isSuccess: false,
        data: data,
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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: DialogData) => {
        if (!res.isSuccess || !res) return;

        if (res.action === this.dialogActionEnum.Delete && res.data) {
          this.expenseService.deleteExpense(res.data as string)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.refreshTrigger.update(n => n + 1);
              },
              error: (e) => console.error('Error while deleting expense', e)
            });
        } else {
          this.refreshTrigger.update(n => n + 1);
        }
      });
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
        content: {
          message: ModalMessage.delete,
          description: description
        },
      } as DialogData,
      disableClose: true,
    });

    this.getListAfterSuccessCallApi(dialogRef);
  }

  initDateFormat() {
    if (!this.localStorageService.getItem(LocalStorageKey.dateFormat)) {
      this.localStorageService.setItem(
        LocalStorageKey.dateFormat,
        DateFormatValue.DMY,
      );
    }
  }

  onFilterChanged(params: FilterParams) {
    this.router.navigate([], {
      queryParams: { year: params.year, month: params.month },
      queryParamsHandling: 'merge',
    });
  }

  get GlobalDateFormat(): string {
    return this.localStorageService.getItem(
      LocalStorageKey.dateFormat,
    ) as string;
  }
}
