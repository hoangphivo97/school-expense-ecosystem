import { Component, OnInit, Signal, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogData, DialogActionEnum, FacultyId, FilterFieldConfig, FilterOption, Role, SharedFilterFields, UserType } from '@school-expense-ecosystem/shared/types';
import { AuthSignalStore, MasterDataStore } from '@school-expense-ecosystem/shared/data-access';
import { BaseModalComponent, BaseModalData, ConfirmDialogComponent, CopyToClipboardDirective, FilterComponent, LoadingDirective, NotificationService, PaginationComponent } from '@school-expense-ecosystem/shared/ui';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TRANSLOCO_SCOPE, TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { MatMenuModule } from '@angular/material/menu';
import { ProjectApiService } from '@school-expense-ecosystem/projects/data-access';
import { JoinCodeDialogData, JoinCodeDialogResult, ProjectFundingType, ProjectItem, ProjectQueryPayload, ProjectStatus } from '@school-expense-ecosystem/projects/types';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { calculateActivityCapacity } from '@school-expense-ecosystem/projects/utils';
import { ActivityCapacityProgressComponent, BudgetExhaustionProgressComponent } from '@school-expense-ecosystem/projects/ui';
import { CreateProjectDialogComponent } from '../../dialogs/create-project-dialog/create-project-dialog.component';
import { ManageJoinCodeDialogComponent, ManageJoinCodeDialogData, ManageJoinCodeDialogResult } from '../../dialogs/manage-join-code-dialog/manage-join-code-dialog.component';
import { JoinCodeDialogComponent } from '../../dialogs/join-code-dialog/join-code-dialog.component';

export interface ProjectViewModel extends ProjectItem {
  canApprove: boolean;
  canReject: boolean;
  canEdit: boolean;
  enrollmentPercentage?: number;
  isEnrollmentFull?: boolean;
}

@Component({
  selector: 'lib-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss'],
  imports: [FilterComponent, LoadingDirective, CommonModule, PaginationComponent, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, TranslocoModule, MatMenuModule, MatSnackBarModule, CopyToClipboardDirective,
    ActivityCapacityProgressComponent, BudgetExhaustionProgressComponent
  ],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'project' }
  ]
})
export class ProjectListComponent implements OnInit {
  private readonly projectApiService = inject(ProjectApiService);
  private readonly authSignalStore = inject(AuthSignalStore);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly translocoService = inject(TranslocoService);
  private readonly masterDataStore = inject(MasterDataStore);

  // State Signals
  readonly pageSize = signal<number>(10);
  readonly currentPageIndex = signal<number>(1);
  readonly currentUser = this.authSignalStore.user;
  readonly filterParams = signal<SharedFilterFields>({
    facultyId: this.currentUser()?.facultyId
  });
  readonly availableYearsSignal = signal<number[]>([2024, 2025, 2026]);

  readonly isFacultyDisabled = computed(() => {
    const user = this.currentUser();
    return user?.role === Role.LEVEL_2_DEAN || user?.userType === UserType.STUDENT;
  });

  // 2. Computed Query Pipeline
  readonly queryParams = computed<ProjectQueryPayload>(() => {
    const filters = this.filterParams();

    return {
      page: this.currentPageIndex(),
      limit: this.pageSize(),
      ...(filters.searchTerm ? { search: filters.searchTerm.trim() } : {}),
      ...(filters.facultyId ? { facultyId: filters.facultyId as FacultyId } : {}),
      ...(filters.status ? { status: filters.status as ProjectStatus } : {}),
      ...(filters.year ? { year: Number(filters.year) } : {}),
      ...(filters.projectType ? { type: filters.projectType as ProjectFundingType } : {}),
    };
  });

  readonly statusOptions: FilterOption[] = [
    { value: 'ALL', labelKey: 'shared.filter.options.projectStatus.ALL', label: 'All Statuses' },
    ...Object.values(ProjectStatus).map((status) => ({
      value: status,
      label: status,
      labelKey: `shared.filter.options.projectStatus.${status}`
    }))
  ];

  readonly yearOptions = computed<FilterOption[]>(() => [
    { value: 'ALL', labelKey: 'shared.filter.options.years.ALL', label: 'All Years' },
    ...this.availableYearsSignal().map((year) => ({
      value: year,
      label: `${year}`
    }))
  ]);

  // Project type options matching project-specific funding sources
  readonly projectTypeOptions: FilterOption[] = [
    { value: 'ALL', labelKey: 'shared.filter.options.projectType.ALL', label: 'All Types' },
    { value: 'SCHOOL', labelKey: 'shared.filter.options.projectType.SCHOOL', label: 'School Funded' },
    { value: 'FACULTY', labelKey: 'shared.filter.options.projectType.FACULTY', label: 'Faculty Funded' },
    { value: 'OUTSOURCE', labelKey: 'shared.filteroptions.projectType.OUTSOURCE', label: 'External / Outsource' }
  ];

  // Declarative schema for Project list toolbar
  readonly projectFilterConfigs = computed<FilterFieldConfig[]>(() => [
    {
      key: 'searchTerm',
      type: 'search',
      labelKey: 'shared.filter.searchLabel',
      placeholderKey: 'shared.filter.searchPlaceholder',
      defaultValue: ''
    },
    {
      key: 'facultyId',
      type: 'select',
      labelKey: 'shared.filter.labels.faculty',
      defaultValue: this.currentUser()?.facultyId ?? 'ALL',
      disabled: this.isFacultyDisabled,
      options: this.masterDataStore.facultyOptions,
      customWidth: '220px'
    },
    {
      key: 'status',
      type: 'select',
      labelKey: 'shared.filter.labels.projectStatus',
      defaultValue: 'ALL',
      options: this.statusOptions,
      customWidth: '180px'
    },
    {
      key: 'year',
      type: 'select',
      labelKey: 'shared.filter.labels.year',
      defaultValue: 'ALL',
      options: this.yearOptions,
      customWidth: '140px'
    },
    {
      key: 'projectType',
      type: 'select',
      labelKey: 'shared.filter.labels.projectType',
      defaultValue: 'ALL',
      options: this.projectTypeOptions,
      customWidth: '180px'
    }
  ]);

  // 3. Declarative HTTP Resource 
  readonly projectsResource = this.projectApiService.getProjectsResource(this.queryParams);

  readonly isGridDataLoading = this.projectsResource.isLoading;
  readonly dataSource = computed<ProjectViewModel[]>(() => {
    const items = this.projectsResource.value()?.items ?? [];
    const user = this.currentUser();

    if (!user) return [];

    return items.map((project) => {
      const isPending = project.status === ProjectStatus.PENDING_DEAN_APPROVAL;
      const isFacultyDean = user.role === Role.LEVEL_2_DEAN && user.facultyId === project.facultyId;
      const isFinance = user.role === Role.LEVEL_1_FINANCE;
      const isDeanOrFinance = isFacultyDean || isFinance;

      const isLocked = [ProjectStatus.ARCHIVED, ProjectStatus.COMPLETED, ProjectStatus.REJECTED].includes(project.status);
      const isMentor = user.uid === project.mentorId;
      const isAdmin = user.role === Role.LEVEL_0_ADMIN;

      const capacityMetrics = calculateActivityCapacity(project);

      return {
        ...project,
        ...capacityMetrics,
        canApprove: isPending && isDeanOrFinance,
        canReject: isPending && isDeanOrFinance,
        canEdit: !isLocked && (isMentor || isFacultyDean || isFinance || isAdmin),
      };
    });
  });
  readonly totalItems = computed(() => this.projectsResource.value()?.total ?? 0);

  // Auth Context Signals
  readonly isStudent = computed(() => this.currentUser()?.userType === UserType.STUDENT);

  // Reactive Grid Data & Columns
  readonly dynamicDisplayedColumns: Signal<string[]> = computed(() => [
    'id',
    'name',
    'type',
    'facultyId',
    'budgetCap',
    'pendingSpent',
    'currentSpent',
    'timeline',
    'enrolledStudents',
    'budgetExhaustion',
    'status',
    'action',
  ]);

  ngOnInit(): void {
  }

  canManageJoinCode(project: ProjectItem): boolean {
    const user = this.currentUser();
    if (!user) return false;
    // Mentors or admins can configure invitation codes for active projects
    return (user.uid === project.mentorId || user.userType === UserType.TEACHER) && project.status === ProjectStatus.ACTIVE;
  }

  onProjectFiltersChanged(filters: SharedFilterFields): void {
    const rawStatus = filters.status as unknown;
    const rawFaculty = filters.facultyId as unknown;
    const rawYear = filters.year as unknown;
    const rawType = filters.projectType as unknown;

    this.filterParams.set({
      searchTerm: filters.searchTerm?.trim() || '',
      status: rawStatus === 'ALL' || !rawStatus ? undefined : (rawStatus as ProjectStatus),
      facultyId: rawFaculty === 'ALL' || !rawFaculty ? undefined : (rawFaculty as FacultyId),
      year: rawYear === 'ALL' || !rawYear ? undefined : Number(rawYear),
      projectType: rawType === 'ALL' || !rawType ? undefined : (rawType as ProjectFundingType),
    });
    this.currentPageIndex.set(1);
  }

  onPageChange(page: number): void {
    this.currentPageIndex.set(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPageIndex.set(1);
  }

  openCreateProjectModal(): void {
    const dialogRef = this.dialog.open(CreateProjectDialogComponent, {
      panelClass: 'floating-multi-modal-panel',
      width: 'auto',
      data: {
        facultyId: this.currentUser()?.facultyId,
        action: DialogActionEnum.Create
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((createdProject: ProjectItem | undefined) => {
      if (!createdProject) return;

      const joinCode = createdProject.joinConfig?.code;

      if (joinCode) {
        // Automatically write join code to clipboard
        navigator.clipboard.writeText(joinCode).then(() => {
          this.notify.success('project.projectList.notifications.createdWithCodeCopied', {
            name: createdProject.name,
            code: joinCode,
          });
        }).catch(() => {
          this.notify.success('project.projectList.notifications.createdWithCode', {
            name: createdProject.name,
            code: joinCode,
          });
        });
      } else {
        this.notify.success('project.projectList.notifications.createdSuccess', {
          name: createdProject.name,
        });
      }

      this.projectsResource.reload();
    });
  }
  navigateToDetail(project: ProjectItem): void {
    this.dialog.open(CreateProjectDialogComponent, {
      width: '700px',
      data: {
        action: DialogActionEnum.Detail,
        project,
      },
      disableClose: false,
    });
  }

  canEditProject(project: ProjectItem): boolean {
    const user = this.currentUser();
    if (!user) return false;

    const isLocked = [ProjectStatus.ARCHIVED, ProjectStatus.COMPLETED, ProjectStatus.REJECTED].includes(project.status);
    if (isLocked) return false;

    const isMentor = user.uid === project.mentorId;
    const isDean = user.role === Role.LEVEL_2_DEAN && user.facultyId === project.facultyId;
    const isFinanceOrAdmin = user.role === Role.LEVEL_1_FINANCE || user.role === Role.LEVEL_0_ADMIN;

    return isMentor || isDean || isFinanceOrAdmin;
  }

  canApproveProject(project: ProjectItem): boolean {
    const user = this.currentUser();
    if (!user) return false;

    const isDeanPending = project.status === ProjectStatus.PENDING_DEAN_APPROVAL;
    const isFinancePending = project.status === ProjectStatus.PENDING_FINANCE_APPROVAL;

    const isFacultyDean = user.role === Role.LEVEL_2_DEAN && user.facultyId === project.facultyId;
    const isFinance = user.role === Role.LEVEL_1_FINANCE;

    return (isDeanPending && isFacultyDean) || (isFinancePending && isFinance);
  }

  onApproveProject(project: ProjectItem): void {
    const confirmData: ConfirmDialogData = {
      title: this.translocoService.translate('project.projectList.approveModal.title'),
      message: this.translocoService.translate('project.projectList.approveModal.message', { name: project.name }),
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

      this.projectApiService.approveProject(project.id).subscribe({
        next: () => {
          this.notify.success('project.projectList.notifications.approved');
          this.projectsResource.reload();
        },
        error: (err) => {
          this.notify.error(err?.error?.errorMsg || 'Failed to approve project proposal.');
        },
      });
    });
  }

  openEditModal(project: ProjectItem): void {
    const dialogRef = this.dialog.open(CreateProjectDialogComponent, {
      width: '700px',
      data: {
        action: DialogActionEnum.Edit,
        project,
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((updatedProject) => {
      if (updatedProject) {
        this.notify.success('project.projectList.notifications.updated');
        this.projectsResource.reload();
      }
    });
  }

  canRejectProject(project: ProjectItem): boolean {
    return this.canApproveProject(project);
  }

  onRejectProject(project: ProjectItem): void {
    const modalData: BaseModalData = {
      title: this.translocoService.translate('project.projectList.rejectModal.title'),
      message: this.translocoService.translate('project.projectList.rejectModal.message', { name: project.name }),
      placeholder: this.translocoService.translate('project.projectList.rejectModal.placeholder'),
    };

    const dialogRef = this.dialog.open(BaseModalComponent, {
      width: '500px',
      data: modalData,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((reason: string | null) => {
      if (!reason) return;

      this.projectApiService.rejectProject(project.id, reason).subscribe({
        next: () => {
          this.notify.success('project.projectList.notifications.rejected');
          this.projectsResource.reload();
        },
        error: (err) => {
          this.notify.error(err?.error?.errorMsg || 'Failed to reject project proposal.');
        },
      });
    });
  }

  openJoinByCodeDialog(): void {
    const dialogRef = this.dialog.open<
      JoinCodeDialogComponent,
      JoinCodeDialogData,
      JoinCodeDialogResult
    >(JoinCodeDialogComponent, {
      width: '420px',
      data: { context: 'PROJECT' },
    });

    dialogRef.afterClosed().subscribe((result: JoinCodeDialogResult | undefined) => {
      if (result?.success) {
        this.projectsResource.reload();
      }
    });
  }

  openManageJoinCodeModal(project: ProjectItem): void {
    const dialogRef = this.dialog.open<
      ManageJoinCodeDialogComponent,
      ManageJoinCodeDialogData,
      ManageJoinCodeDialogResult
    >(ManageJoinCodeDialogComponent, {
      width: '540px',
      data: { entity: project, type: "PROJECT" },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result?: ManageJoinCodeDialogResult) => {
      if (result) {
        this.projectsResource.reload();
      }
    });
  }
}