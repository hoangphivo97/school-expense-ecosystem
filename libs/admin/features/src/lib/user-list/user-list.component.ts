import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild, effect, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserListService } from '@school-expense-ecosystem/admin/data-access';
import { UserBase } from '@school-expense-ecosystem/shared/types';
import { BaseModalComponent, FilterComponent, FooterComponent, HeaderComponent } from '@school-expense-ecosystem/shared/ui';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';
import { DialogActionEnum, FilterMode, FilterParams } from '@school-expense-ecosystem/shared/types';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserFormModalComponent } from '../user-form-modal/user-form-modal.component';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UserStatus, UserType, Role } from '@school-expense-ecosystem/shared/types'
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons/faCircleCheck';
import { faBan } from '@fortawesome/free-solid-svg-icons/faBan';
import { faLockOpen } from '@fortawesome/free-solid-svg-icons/faLockOpen';
import { faLock } from '@fortawesome/free-solid-svg-icons/faLock';
import { faUserXmark } from '@fortawesome/free-solid-svg-icons/faUserXmark';
import { faCirclePause } from '@fortawesome/free-solid-svg-icons/faCirclePause';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserDeleteModalComponent } from '../user-delete-modal/user-delete-modal';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

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
    HeaderComponent,
    MatDialogModule,
    FontAwesomeModule,
    MatTooltipModule,
    TranslocoModule
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'admin' }
  ]
})
export class UserListComponent {
  private readonly userListService = inject(UserListService);
  private readonly dialog = inject(MatDialog);
  private readonly authStore = inject(AuthSignalStore);

  private readonly dialogActionEnum = DialogActionEnum;

  // Structural grid column configurations including auditing and interactive actions
  displayedColumns: string[] = ['fullName', 'email', 'userCode', 'role', 'userType', 'status', 'createdAt', 'action'];

  protected readonly faCircleCheck = faCircleCheck;
  protected readonly faBan = faBan;
  protected readonly faLockOpen = faLockOpen;
  protected readonly faCirclePause = faCirclePause;
  protected readonly faLock = faLock;
  protected readonly faUserXMark = faUserXmark

  // DOM viewchild query referencing the active material pagination element
  readonly paginator = viewChild(MatPaginator);

  readonly filterModeEnum = FilterMode;

  protected readonly currentAdminId = computed(() => this.authStore.user()?.uid ?? '');

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
  readonly processingUserId = signal<string | null>(null);

  readonly pageSize = signal<number>(10);
  readonly currentPageIndex = signal<number>(0);
  private readonly pageTokens = signal<Record<number, string>>({ 0: '' });
  readonly UserStatusEnum = UserStatus;

  readonly isAdmin = computed(() => this.authStore.user()?.role === Role.LEVEL_0_ADMIN);
  readonly isFinance = computed(() => this.authStore.user()?.role === Role.LEVEL_1_FINANCE);

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
          this.isLoading.set(false);
          this.errorMessage.set('Failed to load user directory. Please verify server connectivity.');
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
      const matchesUserType = !filters.userType || user.userType?.toLowerCase() === (filters.userType as string).toLowerCase();

      return matchesQuery && matchesRole && matchesStatus && matchesUserType;
    });

    return filteredList.map((user: UserBase) => {
      const isPending = user.status === UserStatus.PENDING;
      const isActive = user.status === UserStatus.ACTIVE;
      const isSuspended = user.status === UserStatus.SUSPENDED;

      const toggles = [];
      if (isPending) {
        toggles.push({ status: UserStatus.ACTIVE, icon: this.faCircleCheck, color: 'primary', tooltip: 'admin.userList.actions.activate', cssClass: 'text-success' });
        toggles.push({ status: UserStatus.REJECTED, icon: this.faUserXMark, color: 'warn', tooltip: 'admin.userList.actions.reject', cssClass: 'text-danger' });
      } else if (isActive) {
        toggles.push({ status: UserStatus.SUSPENDED, icon: this.faLock, color: 'warn', tooltip: 'admin.userList.actions.deactivate', cssClass: 'text-danger' });
      } else if (isSuspended) {
        toggles.push({ status: UserStatus.ACTIVE, icon: this.faLockOpen, color: 'primary', tooltip: 'admin.userList.actions.liftRestriction', cssClass: 'text-primary' });
      }

      return {
        ...user,
        isPending,
        isActive,
        isSuspended,
        availableToggles: toggles,
        isNotCurrentAdmin: user.uid !== this.currentAdminId(),
        isProcessing: user.uid === this.processingUserId(),
        isOnboarding: user.status === UserStatus.ONBOARDING,
        targetIsAdmin: user.role === Role.LEVEL_0_ADMIN,
        isRejected: user.status === UserStatus.REJECTED
      }
    });
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

  onUserFiltersChanged(cleanParams: FilterParams): void {
    this.activeFilters.set(cleanParams);
  }

  openProvisionModal(): void {
    const dialogRef = this.dialog.open(UserFormModalComponent, {
      width: '650px',
      disableClose: true,
      data: { title: 'Create User', action: this.dialogActionEnum.Create },
    });

    dialogRef.afterClosed().subscribe((result) => {
      // 🌟 CLEAN: Just listen to the success signal to trigger data grid hydration
      if (result?.isSuccess) {
        this.triggerRefresh();
      }
    });
  }

  /**
   * Opens the modification modal flow for an existing institutional user.
   * @param user The targeting user profile entity data snapshot.
   */
  openUpdateModal(user: UserBase): void {
    const dialogRef = this.dialog.open(UserFormModalComponent, {
      width: '540px',
      disableClose: true,
      data: { user: user, title: 'Update User Profile', action: this.dialogActionEnum.Edit },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.isSuccess) {
        this.triggerRefresh();
      }
    });
  }

  openDetailModal(user: UserBase) {
    const dialogRef = this.dialog.open(UserFormModalComponent, {
      width: '540px',
      disableClose: true,
      data: {
        user: user,
        title: 'User Detail',
        action: this.dialogActionEnum.Detail,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.isSuccess) {
        this.triggerRefresh();
      }
    });
  }

  updateUserStatus(user: UserBase, newStatus: UserStatus): void {
    if (user.uid === this.currentAdminId()) {
      alert('Administrative security constraint: You are restricted from mutating your own account status context.');
      return;
    }

    // Intercept and enforce audit logging for restrictive transitions
    if (newStatus === UserStatus.SUSPENDED || newStatus === UserStatus.REJECTED) {
      const dialogRef = this.dialog.open(BaseModalComponent, {
        width: '440px',
        disableClose: true,
        data: {
          title: `${newStatus === UserStatus.REJECTED ? 'Reject' : 'Suspend'} User Account`,
          message: 'An explicit administrative trail reason is mandatory to alter this profile operational boundary.',
          placeholder: 'Enter formal reasoning context...'
        }
      });

      dialogRef.afterClosed().subscribe((reason: string | null) => {
        if (reason) {
          this.executeStatusMutation(user.uid, newStatus, reason);
        }
      });
      return;
    }

    // Direct execution pipeline for standard states (e.g. Active)
    this.executeStatusMutation(user.uid, newStatus);
  }

  private executeStatusMutation(uid: string, newStatus: UserStatus, reason?: string): void {
    this.processingUserId.set(uid);
    this.isLoading.set(true);

    this.userListService.updateUserStatus(uid, newStatus, reason).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.processingUserId.set(null);
        this.triggerRefresh();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.processingUserId.set(null);

        console.error('Administrative status mutation failed:', err);

        const apiErrorMsg = err.error?.errorMsg || 'Failed to alter user status configuration boundary.';
        this.errorMessage.set(apiErrorMsg);
      }
    });
  }

  protected openDeleteModal(user: UserBase): void {
    const dialogRef = this.dialog.open(UserDeleteModalComponent, {
      data: { user },
      autoFocus: false,
      disableClose: true,
      width: '640px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;

      if (result.isDeleted && result.targetUid) {
        this.triggerRefresh();
      }

      if (result.action === 'SECURITY_LOCKED') {
        // For Future develop
      }
    });
  }

}