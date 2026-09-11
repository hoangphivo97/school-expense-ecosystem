import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TRANSLOCO_SCOPE, TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { EventApiService } from '@school-expense-ecosystem/projects/data-access';
import { EventQueryPayload, EventStatus, EventItem, BaseActivityViewModel } from '@school-expense-ecosystem/projects/types';
import { calculateActivityCapacity } from '@school-expense-ecosystem/projects/utils';
import { AuthSignalStore, FacultyApiService } from '@school-expense-ecosystem/shared/data-access';
import {
  ConfirmDialogData,
  DialogActionEnum,
  FacultyId,
  FilterMode,
  Role,
  SharedFilterFields,
  UserType,
} from '@school-expense-ecosystem/shared/types';
import {
  ConfirmDialogComponent,
  CopyToClipboardDirective,
  FilterComponent,
  LoadingDirective,
  NotificationService,
  PaginationComponent,
} from '@school-expense-ecosystem/shared/ui';
import { ActivityCapacityProgressComponent } from '@school-expense-ecosystem/projects/ui';
import { CreateEventDialogComponent } from '../../dialogs/create-event-dialog/create-event-dialog.component';
import { ManageJoinCodeDialogComponent, ManageJoinCodeDialogResult } from '../../dialogs/manage-join-code-dialog/manage-join-code-dialog.component';

export interface EventViewModel extends EventItem, BaseActivityViewModel {
  canManage: boolean;
  canApprove: boolean;
  canManageJoinCode: boolean;
}

@Component({
  selector: 'lib-event-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    TranslocoModule,
    FilterComponent,
    PaginationComponent,
    LoadingDirective,
    CopyToClipboardDirective,
    ActivityCapacityProgressComponent
  ],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'project' }, DecimalPipe],
})
export class EventListComponent {
  private readonly authSignalStore = inject(AuthSignalStore);
  private readonly facultyApiService = inject(FacultyApiService);
  private readonly eventService = inject(EventApiService)
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly translocoService = inject(TranslocoService);

  readonly filterModeEnum = FilterMode;
  readonly currentUser = this.authSignalStore.user;
  readonly isStudent = computed(() => this.currentUser()?.userType === UserType.STUDENT);

  // Pagination & Filter States
  readonly pageSize = signal<number>(10);
  readonly currentPageIndex = signal<number>(1);
  readonly filterParams = signal<SharedFilterFields>({});
  readonly availableYearsSignal = signal<number[]>([2024, 2025, 2026]);

  readonly queryParams = computed<EventQueryPayload>(() => {
    const filters = this.filterParams();
    return {
      page: this.currentPageIndex(),
      limit: this.pageSize(),
      ...(filters.searchTerm ? { search: filters.searchTerm.trim() } : {}),
      ...(filters.facultyId ? { facultyId: filters.facultyId as FacultyId } : {}),
      ...(filters.status ? { status: filters.status as EventStatus } : {}),
    };
  });

  // Reactive resource call via signal getter
  readonly eventResource = this.eventService.getEventsResource(() => this.queryParams());
  readonly isGridDataLoading = this.eventResource.isLoading;

  // Dynamic Lookup for faculties
  readonly facultiesListSignal = computed(() =>
    this.facultyApiService.facultiesResource.value().map((faculty) => ({
      facultyId: faculty.id,
      facultyName: faculty.name,
    }))
  );

  // Derive total items and event records directly from API resource
  readonly allowedRoles = [Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN];
  readonly events = computed(() => this.eventResource.value()?.items ?? []);
  readonly totalItems = computed(() => this.eventResource.value()?.total ?? 0);

  readonly dataSource = computed<EventViewModel[]>(() => {
    const items = this.events();
    const user = this.currentUser();
    if (!user) return [];

    return items.map((event) => {
      const capacityMetrics = calculateActivityCapacity(event);

      // 1. Role-based permissions: Finance/Admin sit globally, Dean is faculty-scoped, Organizer manages their own
      const isFacultyDean = user.role === Role.LEVEL_2_DEAN && user.facultyId === event.facultyId;
      const isFinance = user.role === Role.LEVEL_1_FINANCE;
      const isOrganizer = user.userType === UserType.TEACHER && event.organizerId === user.uid;
      const hasPermission = isFinance || isFacultyDean || isOrganizer;

      // 2. Lifecycle status constraints: Only allow edits during pending approvals or prior to execution (Upcoming)
      const isEditableStatus = [
        EventStatus.PENDING_DEAN_APPROVAL,
        EventStatus.PENDING_FINANCE_APPROVAL,
        EventStatus.UPCOMING,
      ].includes(event.status);

      const canEdit = hasPermission && isEditableStatus;
      const isDeanPending = event.status === EventStatus.PENDING_DEAN_APPROVAL;
      const isFinancePending = event.status === EventStatus.PENDING_FINANCE_APPROVAL;
      const canApprove =
        (isDeanPending && isFacultyDean) ||
        (isFinancePending && isFinance);
      const isRecruitingStatus =
        event.status === EventStatus.UPCOMING || event.status === EventStatus.ONGOING;
      const canManageJoinCode = hasPermission && isRecruitingStatus;

      return {
        ...event,
        ...capacityMetrics,
        canEdit,
        canManage: hasPermission,
        canApprove,
        canManageJoinCode
      };
    });
  });

  readonly dynamicDisplayedColumns: string[] = [
    'id',
    'name',
    'facultyId',
    'budgetCap',
    'currentSpent',
    'timeline',
    'participants',
    'status',
    'action',
  ];

  onEventFiltersChanged(filters: SharedFilterFields): void {
    this.filterParams.set(filters);
    this.currentPageIndex.set(1);
  }

  onPageChange(page: number): void {
    this.currentPageIndex.set(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPageIndex.set(1);
  }

  openCreateEventModal(): void {
    const dialogRef = this.dialog.open(CreateEventDialogComponent, {
      panelClass: 'floating-multi-modal-panel',
      width: 'auto',
      data: {
        facultyId: this.currentUser()?.facultyId,
        action: DialogActionEnum.Create
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((createEvent: EventItem | undefined) => {
      if (!createEvent) return;

      const joinCode = createEvent.joinConfig?.code;

      if (joinCode) {
        // Automatically write join code to clipboard
        navigator.clipboard.writeText(joinCode).then(() => {
          this.notify.success('project.projectList.notifications.createdWithCodeCopied', {
            name: createEvent.name,
            code: joinCode,
          });
        }).catch(() => {
          this.notify.success('project.projectList.notifications.createdWithCode', {
            name: createEvent.name,
            code: joinCode,
          });
        });
      } else {
        this.notify.success('project.projectList.notifications.createdSuccess', {
          name: createEvent.name,
        });
      }

      this.eventResource.reload();
    });
  }

  navigateToDetail(event: EventItem): void {
    this.dialog.open(CreateEventDialogComponent, {
      width: '700px',
      data: {
        action: DialogActionEnum.Detail,
        event,
        facultyId: event.facultyId,
      },
      disableClose: false,
    });
  }

  openEditModal(event: EventItem): void {
    const proceedWithEdit = () => {
      const dialogRef = this.dialog.open(CreateEventDialogComponent, {
        width: '700px',
        data: {
          action: DialogActionEnum.Edit,
          event,
          facultyId: event.facultyId,
        },
        disableClose: true,
      });

      dialogRef.afterClosed().subscribe((updatedEvent: EventItem | undefined) => {
        if (updatedEvent) {
          this.notify.success('project.projectList.notifications.updated');
          this.eventResource.reload();
        }
      });
    };

    // Warn users that modifying an already approved Upcoming event resets it for re-approval
    if (event.status === EventStatus.UPCOMING) {
      const confirmRef = this.dialog.open(ConfirmDialogComponent, {
        width: '440px',
        data: {
          title: this.translocoService.translate('event.editModal.reapprovalWarning.title'),
          message: this.translocoService.translate('event.editModal.reapprovalWarning.message', {
            name: event.name,
          }),
          confirmText: this.translocoService.translate('event.editModal.reapprovalWarning.confirm'),
          cancelText: this.translocoService.translate('event.editModal.reapprovalWarning.cancel'),
          confirmColor: 'warn',
          icon: 'warning',
        },
        disableClose: true,
      });

      confirmRef.afterClosed().subscribe((isConfirmed: boolean) => {
        if (isConfirmed) {
          proceedWithEdit();
        }
      });
      return;
    }

    proceedWithEdit();
  }

  openJoinCodeModal(event: EventItem): void {
    const dialogRef = this.dialog.open(ManageJoinCodeDialogComponent, {
      width: '540px',
      data: { event },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result?: ManageJoinCodeDialogResult) => {
      if (result) {
        this.eventResource.reload();
      }
    });
  }

  onApproveEvent(event: EventItem): void {
    const confirmData: ConfirmDialogData = {
      title: this.translocoService.translate('project.projectList.approveModal.title'),
      message: this.translocoService.translate('project.projectList.approveModal.message', {
        name: event.name,
      }),
      confirmText: this.translocoService.translate('project.projectList.approveModal.confirm'),
      cancelText: this.translocoService.translate('project.projectList.approveModal.cancel'),
      confirmColor: 'primary',
      icon: 'check_circle',
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: confirmData,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((isConfirmed: boolean) => {
      if (!isConfirmed) return;

      this.eventService.approveEvent(event.id).subscribe({
        next: () => {
          this.notify.success('project.projectList.notifications.approved');
          this.eventResource.reload();
        },
        error: (err) => {
          this.notify.error(err?.error?.errorMsg || 'Failed to approve event proposal.');
        },
      });
    });
  }
}