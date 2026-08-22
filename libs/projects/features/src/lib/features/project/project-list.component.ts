import { Component, OnInit, Signal, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogActionEnum, FacultyId, FilterMode, Role, SharedFilterFields, UserType } from '@school-expense-ecosystem/shared/types';
import { AuthSignalStore, FacultyApiService } from '@school-expense-ecosystem/shared/data-access';
import { FilterComponent, FooterComponent, HeaderComponent, LoadingDirective, NotificationService, PaginationComponent } from '@school-expense-ecosystem/shared/ui';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TRANSLOCO_SCOPE, TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { MatMenuModule } from '@angular/material/menu';
import { ProjectApiService } from '@school-expense-ecosystem/projects/data-access';
import { Project, ProjectQueryPayload, ProjectStatus } from '@school-expense-ecosystem/projects/types';
import { CreateProjectDialogComponent } from '../dialogs/create-project-dialog/create-project-dialog.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';


@Component({
  selector: 'lib-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss'],
  imports: [HeaderComponent, FilterComponent, LoadingDirective, CommonModule, PaginationComponent, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, FooterComponent, TranslocoModule, MatMenuModule, MatSnackBarModule],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'project' }
  ]
})
export class ProjectListComponent implements OnInit {
  private readonly projectApiService = inject(ProjectApiService);
  private readonly authSignalStore = inject(AuthSignalStore);
  private readonly facultyApiService = inject(FacultyApiService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);

  // State Signals
  readonly pageSize = signal<number>(10);
  readonly currentPageIndex = signal<number>(1);
  readonly filterParams = signal<SharedFilterFields>({});
  readonly availableYearsSignal = signal<number[]>([2024, 2025, 2026]);

  // 2. Computed Query Pipeline
  readonly queryParams = computed<ProjectQueryPayload>(() => {
    const filters = this.filterParams();
    return {
      page: this.currentPageIndex(),
      limit: this.pageSize(),
      ...(filters.searchTerm ? { search: filters.searchTerm.trim() } : {}),
      ...(filters.facultyId ? { facultyId: filters.facultyId as FacultyId } : {}),
      ...(filters.status ? { status: filters.status as ProjectStatus } : {}),
    }
  });

  // 3. Declarative HTTP Resource 
  readonly projectsResource = this.projectApiService.getProjectsResource(this.queryParams);

  // 4. State Signals dẫn xuất trực tiếp từ Resource (Không cần set thủ công)
  readonly isGridDataLoading = this.projectsResource.isLoading;
  readonly dataSource = computed(() => this.projectsResource.value().items);
  readonly totalItems = computed(() => this.projectsResource.value().total);

  // Auth Context Signals
  readonly currentUser = this.authSignalStore.user;
  readonly isStudent = computed(() => this.currentUser()?.userType === UserType.STUDENT);

  // Dynamic Lookup Signals
  readonly facultiesListSignal = computed(() =>
    this.facultyApiService.facultiesResource.value().map((faculty) => ({
      facultyId: faculty.id,
      facultyName: faculty.name,
    }))
  );

  // Reactive Grid Data & Columns
  readonly dynamicDisplayedColumns: Signal<string[]> = computed(() => [
    'id',
    'name',
    'type',
    'facultyId',
    'budgetCap',
    'currentSpent',
    'timeline',
    'status',
    'action',
  ]);

  filterModeEnum = FilterMode

  ngOnInit(): void {
  }

  canManageJoinCode(project: Project): boolean {
    const user = this.currentUser();
    if (!user) return false;
    // Mentors or admins can configure invitation codes for active projects
    return (user.uid === project.mentorId || user.userType === UserType.TEACHER) && project.status === ProjectStatus.ACTIVE;
  }

  onProjectFiltersChanged(filters: SharedFilterFields): void {
    this.filterParams.set(filters);
    this.currentPageIndex.set(1); // Reset to first page upon applying new filter
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
      width: '700px',
      data: {
        facultyId: this.currentUser()?.facultyId,
        action: DialogActionEnum.Create
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((createdProject) => {
      if (createdProject) {
        this.notify.success('project.projectList.notifications.created');
        this.projectsResource.reload();
      }
    });
  }
  navigateToDetail(project: Project): void {
    this.dialog.open(CreateProjectDialogComponent, {
      width: '700px',
      data: {
        action: DialogActionEnum.Detail,
        project,
      },
      disableClose: false,
    });
  }

  canEditProject(project: Project): boolean {
    const user = this.currentUser();
    if (!user) return false;

    const isLocked = [ProjectStatus.ARCHIVED, ProjectStatus.COMPLETED, ProjectStatus.REJECTED].includes(project.status);
    if (isLocked) return false;

    const isMentor = user.uid === project.mentorId;
    const isDean = user.role === Role.LEVEL_2_DEAN && user.facultyId === project.facultyId;
    const isFinanceOrAdmin = user.role === Role.LEVEL_1_FINANCE || user.role === Role.LEVEL_0_ADMIN;

    return isMentor || isDean || isFinanceOrAdmin;
  }

  canApproveProject(project: Project): boolean {
    const user = this.currentUser();
    if (!user || project.status !== ProjectStatus.PENDING_DEAN_APPROVAL) return false;

    const isFacultyDean = user.role === Role.LEVEL_2_DEAN && user.facultyId === project.facultyId;
    const isFinance = user.role === Role.LEVEL_1_FINANCE;

    return isFacultyDean || isFinance;
  }

  onApproveProject(project: Project): void {
    this.projectApiService.approveProject(project.id).subscribe({
      next: () => {
        this.notify.success('project.projectList.notifications.approved');
        this.projectsResource.reload();
      },
    });
  }

  openEditModal(project: Project): void {
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

  canRejectProject(project: Project): boolean {
    return this.canApproveProject(project);
  }

  onRejectProject(project: Project): void {
    this.projectApiService.rejectProject(project.id).subscribe({
      next: () => {
        this.notify.success('project.projectList.notifications.rejected');
        this.projectsResource.reload();
      },
      error: (err) => {
        this.notify.error(err?.error?.errorMsg || 'Failed to reject project proposal.');
      },
    });
  }

  openJoinByCodeModal(): void {
    // Open student join code input dialog logic
  }

  openJoinCodeModal(project: Project): void {
    // Open join code configuration/QR dialog logic
  }
}