import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, effect, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserListService } from '@school-expense-ecosystem/admin/data-access';
import { SharedFilterParams, UserBase } from '@school-expense-ecosystem/shared/types';
import { BaseModalComponent, FilterComponent, FooterComponent, HeaderComponent, LoadingDirective, PaginationComponent } from '@school-expense-ecosystem/shared/ui';
import { DialogActionEnum, FilterMode, FilterUserParams } from '@school-expense-ecosystem/shared/types';
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
import { trackLoading } from '@school-expense-ecosystem/shared/utils-frontend';

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
    MatIconModule,
    MatButtonModule,
    FooterComponent,
    DatePipe,
    FilterComponent,
    HeaderComponent,
    MatDialogModule,
    FontAwesomeModule,
    MatTooltipModule,
    TranslocoModule,
    LoadingDirective,
    PaginationComponent
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

  readonly filterModeEnum = FilterMode;

  protected readonly currentAdminId = computed(() => this.authStore.user()?.uid ?? '');

  readonly activeFilters = signal<FilterUserParams>({
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

  protected readonly userResource = this.userListService.getUsersResource(() => {
    this.refreshTrigger();

    const index = this.currentPageIndex();
    const tokens = this.pageTokens();
    const currentToken = tokens[index] || '';
    const filters = this.activeFilters();

    return {
      limit: this.pageSize(),
      pageToken: currentToken,
      searchTerm: filters.searchTerm,
      role: filters.role,
      status: filters.status,
      userType: filters.userType,
      facultyId: filters.facultyId
    };
  });

  private readonly pageTokenTrackerEffect = effect(() => {
    const response = this.userResource.value();
    if (response?.nextPageToken) {
      const nextIndex = untracked(this.currentPageIndex) + 1;
      untracked(() => {
        this.pageTokens.update(tokens => {
          if (tokens[nextIndex] === response.nextPageToken) return tokens;
          return { ...tokens, [nextIndex]: response.nextPageToken! };
        });
      });
    }
  });

  readonly totalItems = computed(() => this.userResource.value()?.totalItems ?? 0);

  readonly dataSource = computed(() => {
    // Server handles filtering natively; frontend array filtering boilerplate is completely stripped out
    const rawList = this.userResource.value()?.users ?? [];

    return rawList.map((user: UserBase) => {
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
      };
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

  onPageChange(pageIndex: number): void {
    this.currentPageIndex.set(pageIndex);
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    
    this.currentPageIndex.set(0);
    this.pageTokens.set({ 0: '' });
  }

  triggerRefresh(): void {
    this.userResource.reload();
  }

  onUserFiltersChanged(cleanParams: SharedFilterParams): void {
    this.activeFilters.set(cleanParams as FilterUserParams);
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

    this.userListService.updateUserStatus(uid, newStatus, reason).pipe(trackLoading(this.isLoading)).subscribe({
      next: () => {
        this.processingUserId.set(null);
        this.triggerRefresh();
      },
      error: (err) => {
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