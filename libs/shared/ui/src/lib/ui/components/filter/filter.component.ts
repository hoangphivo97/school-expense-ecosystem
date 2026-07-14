import {
  Component,
  DestroyRef,
  inject,
  input,
  output,
  OnInit,
  computed,
  effect,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableDataSource } from '@angular/material/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FilterMode, FilterParams } from '@school-expense-ecosystem/shared/types';
import { months } from '@school-expense-ecosystem/shared/constants';
import { FacultyId, Role, UserStatus, UserType } from '@school-expense-ecosystem/shared/types';
import { ExpenseStatus } from '@school-expense-ecosystem/shared/types';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';

@Component({
  selector: 'lib-filter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatTooltipModule,
    MatPaginatorModule
  ],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss',
})
export class FilterComponent<T = unknown> implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly paginator = viewChild(MatPaginator);

  mode = input<FilterMode>(FilterMode.EXPENSE);

  readonly showSearch = computed(() => this.mode() === FilterMode.EXPENSE || this.mode() === FilterMode.USER);
  readonly showMonth = computed(() => this.mode() === FilterMode.EXPENSE || this.mode() === FilterMode.REPORT);
  readonly showYear = computed(() => this.mode() === FilterMode.EXPENSE || this.mode() === FilterMode.REPORT);
  readonly showRole = computed(() => this.mode() === FilterMode.USER);
  readonly showUserType = computed(() => this.mode() === FilterMode.USER);
  readonly showStatus = computed(() => this.mode() === FilterMode.USER || this.mode() === FilterMode.EXPENSE);
  readonly showFaculty = computed(() => this.mode() === FilterMode.USER || this.mode() === FilterMode.EXPENSE);

  // Multi-dimensional dynamic model mapping streams
  inputDataSource = input<MatTableDataSource<T> | null>(null);
  value = input<FilterParams | null>(null);
  yearsList = input<number[]>([]);
  facultiesList = input<{ facultyId: string; facultyName: string }[]>([]);

  filterChange = output<FilterParams>();

  readonly systemRolesOptions = [
    { value: 'ALL', label: 'All Roles' },
    { value: Role.LEVEL_0_ADMIN, label: 'Admin' },
    { value: Role.LEVEL_1_FINANCE, label: 'Finance Officer' },
    { value: Role.LEVEL_2_DEAN, label: 'Faculty Dean' },
    { value: Role.LEVEL_3_USER, label: 'End User' }
  ];

  readonly userTypesOptions = [
    { value: 'ALL', label: 'All User Types' },
    { value: UserType.STUDENT, label: 'Student' },
    { value: UserType.TEACHER, label: 'Teacher' },
    { value: UserType.STAFF, label: 'Staff' }
  ];

  readonly accountStatusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: UserStatus.ACTIVE, label: 'Active' },
    { value: UserStatus.ONBOARDING, label: 'Onboarding' },
    { value: UserStatus.REJECTED, label: 'Rejected' },
    // { value: UserStatus.INACTIVE, label: 'Inactive' }
  ];

  readonly expenseStatusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: ExpenseStatus.PENDING_TEACHER_REVIEW, label: 'Pending Teacher' },
    { value: ExpenseStatus.PENDING_DEAN_APPROVAL, label: 'Pending Dean' },
    { value: ExpenseStatus.PENDING_DISBURSEMENT, label: 'Pending Disbursement' },
    { value: ExpenseStatus.DISBURSED, label: 'Disbursed' },
    { value: ExpenseStatus.REJECTED, label: 'Rejected' }
  ];

  readonly currentMonth = new Date().getMonth() + 1;
  readonly currentYear = new Date().getFullYear();

  // Baseline UI state registry holding sentinel default constants
  readonly defaultFilterState = {
    searchTerm: '',
    month: this.currentMonth,
    year: this.currentYear,
    role: 'ALL',
    userType: 'ALL',
    status: 'ALL',
    facultyId: 'ALL'
  };

  readonly filterForm = new FormGroup({
    searchTerm: new FormControl(this.defaultFilterState.searchTerm),
    month: new FormControl<number | null>(this.defaultFilterState.month),
    year: new FormControl<number | null>(this.defaultFilterState.year),
    role: new FormControl(this.defaultFilterState.role),
    userType: new FormControl(this.defaultFilterState.userType),
    status: new FormControl(this.defaultFilterState.status),
    facultyId: new FormControl(this.defaultFilterState.facultyId)
  });

  readonly processedYears = computed(() => {
    const years = [...this.yearsList()];
    if (!years.includes(this.currentYear)) {
      years.push(this.currentYear);
    }
    return years.sort((a, b) => a - b);
  });

  readonly availableMonths = computed(() => months);

  readonly isDirty = computed(() => {
    const currentForm = this.filterForm.value;
    const searchDirty = this.showSearch() && currentForm.searchTerm !== this.defaultFilterState.searchTerm;
    const monthDirty = this.showMonth() && currentForm.month !== this.defaultFilterState.month;
    const yearDirty = this.showYear() && currentForm.year !== this.defaultFilterState.year;
    const roleDirty = this.showRole() && currentForm.role !== this.defaultFilterState.role;
    const userTypeDirty = this.showUserType() && currentForm.userType !== this.defaultFilterState.userType;
    const statusDirty = this.showStatus() && currentForm.status !== this.defaultFilterState.status;
    const facultyDirty = this.showFaculty() && currentForm.facultyId !== this.defaultFilterState.facultyId;

    return searchDirty || monthDirty || yearDirty || roleDirty || userTypeDirty || statusDirty || facultyDirty;
  });

  constructor() {
    effect(() => {
      const incomingState = this.value();
      if (incomingState) {
        this.filterForm.patchValue({
          month: incomingState.month !== undefined ? incomingState.month : this.currentMonth,
          year: incomingState.year !== undefined ? incomingState.year : this.currentYear,
          searchTerm: incomingState.searchTerm ?? '',
          role: incomingState.role ?? 'ALL',
          userType: incomingState.userType ?? 'ALL',
          status: incomingState.status ?? 'ALL',
          facultyId: incomingState.facultyId ?? 'ALL'
        }, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.registerFilterValueStreams();
  }

  private registerFilterValueStreams(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((formValues) => {

        const getValidRole = (val: unknown): Role | undefined => {
          if (val === 'ALL' || val === null || val === '') return undefined;
          return Object.values(Role).includes(val as Role) ? (val as Role) : undefined;
        };

        const getValidUserType = (val: unknown): UserType | undefined => {
          if (val === 'ALL' || val === null || val === '') return undefined;
          return val as UserType;
        };

        const getValidFacultyId = (val: unknown): FacultyId | undefined => {
          if (val === 'ALL' || val === null || val === '') return undefined;
          return val as FacultyId;
        };

        const getValidStatus = (val: unknown): UserStatus | undefined => {
          if (val === 'ALL' || val === null || val === '') return undefined;
          return val as UserStatus;
        };

        const payload: FilterParams = {
          searchTerm: this.showSearch() ? (formValues.searchTerm ?? '') : '',
          month: this.showMonth() ? (formValues.month !== undefined ? formValues.month : null) : null,
          year: this.showYear() ? (formValues.year !== undefined ? formValues.year : null) : null,
          role: this.showRole() ? getValidRole(formValues.role) : undefined,
          userType: this.showUserType() ? getValidUserType(formValues.userType) : undefined,
          status: this.showStatus() ? getValidStatus(formValues.status) : undefined,
          facultyId: this.showFaculty() ? getValidFacultyId(formValues.facultyId) : undefined,
        };

        const dataSource = this.inputDataSource();
        if (dataSource && this.showSearch()) {
          dataSource.filter = (payload.searchTerm as string).trim().toLowerCase();
        }

        this.filterChange.emit(payload);
      });
  }

  resetFilters(): void {
    this.filterForm.setValue({
      searchTerm: this.defaultFilterState.searchTerm,
      month: this.defaultFilterState.month,
      year: this.defaultFilterState.year,
      role: this.defaultFilterState.role,
      userType: this.defaultFilterState.userType,
      status: this.defaultFilterState.status,
      facultyId: this.defaultFilterState.facultyId
    }, { emitEvent: true });
  }
}