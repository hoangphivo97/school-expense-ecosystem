import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild, effect, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserListService } from '@school-expense-ecosystem/admin/data-access';
import { Role, UserBase, UserStatus } from '@school-expense-ecosystem/auth/types';
import { FilterComponent, FooterComponent, HeaderComponent } from '@school-expense-ecosystem/shared/ui';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';
import { FilterMode, FilterParams } from '@school-expense-ecosystem/shared/types';

@Component({
  selector: 'lib-user-list',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    FooterComponent,
    DatePipe,
    FilterComponent,
    HeaderComponent
],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent {
  private readonly userListService = inject(UserListService);

  // Structural grid column configurations including auditing and interactive actions
  displayedColumns: string[] = ['fullName', 'email', 'userCode', 'role', 'userType' ,'status' ,'createdAt', 'action'];

  // DOM viewchild query referencing the active material pagination element
  readonly paginator = viewChild(MatPaginator);

  readonly filterModeEnum = FilterMode;

  readonly activeFilters = signal<FilterParams>({
    searchTerm: '',
    role: undefined,
    status: undefined,
    userType: undefined,
    facultyId: undefined
  });

  private readonly refreshTrigger = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly pageSize = signal<number>(10);
  readonly currentPageIndex = signal<number>(0);
  private readonly pageTokens = signal<Record<number, string>>({ 0: '' });

  readonly RoleEnum = Role;
  readonly UserStatusEnum = UserStatus;

  // Commercial English translation registry mapping raw system roles into presentation texts
  readonly roleLabels: Record<Role, string> = {
    [Role.LEVEL_0_ADMIN]: 'System Administrator',
    [Role.LEVEL_1_FINANCE]: 'Finance Specialist',
    [Role.LEVEL_2_DEAN]: 'Faculty Dean',
    [Role.LEVEL_3_USER]: 'Standard User'
  };

  private readonly remoteParams$ = toObservable(
    computed(() => {
      const index = this.currentPageIndex();
      const limit = this.pageSize();

      const tokens = untracked(this.pageTokens);
      const currentToken = tokens[index] || '';

      return { limit, pageToken: currentToken, refresh: this.refreshTrigger() };
    })
  );

  private readonly apiResponse$ = this.remoteParams$.pipe(
    switchMap(({ limit, pageToken }) => {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      return this.userListService.getPaginatedUsers(limit, pageToken).pipe(
        catchError((err) => {
          console.error('Fetch paginated users failed:', err);
          this.errorMessage.set('Failed to load user directory. Please verify server connectivity');
          return of({ users: [] as UserBase[], nextPageToken: null as string | null, totalItems: 0 });
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
    initialValue: { users: [] as UserBase[], nextPageToken: null as string | null, totalItems: 0 }
  });

  readonly totalItems = computed(() => this.apiResponseSignal().totalItems);

  readonly dataSource = computed(() => {
    const rawList = this.apiResponseSignal().users;
    const filters = this.activeFilters();

    const query = (filters.searchTerm || '').toLowerCase().trim();

    const filteredList = rawList.filter((user: UserBase) => {
      const matchesQuery = !query ||
        user.fullName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.userCode?.toLowerCase().includes(query);

      const matchesRole = !filters.role || user.role === filters.role;
      const matchesStatus = !filters.status || user.status?.toUpperCase() === (filters.status as string).toUpperCase();

      return matchesQuery && matchesRole && matchesStatus;
    });

    const processedList = filteredList.map((user: UserBase) => {
      return {
        ...user,
        roleLabel: this.roleLabels[user.role as Role] || String(user.role)
      };
    });

    return new MatTableDataSource<any>(processedList);
  });

  constructor() {
    effect(() => {
      this.activeFilters()

      untracked(() => {
        this.currentPageIndex.set(0);
        this.pageTokens.set({ 0: '' });
      });
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.currentPageIndex.set(event.pageIndex);
  }

  triggerRefresh(): void {
    this.refreshTrigger.update((n) => n + 1);
  }

  openEditUserModal(user: UserBase): void {
    console.log('Triggered edit modal workflow for target account:', user);
  }

  onUserFiltersChanged(cleanParams: FilterParams): void {
    this.activeFilters.set(cleanParams);
  }

  openManualProvisioningModal(): void {
    // Administration provisioning workflow execution line
  }
}