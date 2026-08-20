import { Component, OnInit, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { FacultyId, FilterMode, SharedFilterFields, UserType } from '@school-expense-ecosystem/shared/types';
import { AuthSignalStore, FacultyApiService } from '@school-expense-ecosystem/shared/data-access';
import { FilterComponent, FooterComponent, HeaderComponent, LoadingDirective, PaginationComponent } from '@school-expense-ecosystem/shared/ui';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { MatMenuModule } from '@angular/material/menu';
import { ProjectApiService } from '@school-expense-ecosystem/projects/data-access';
import { Project, ProjectQueryPayload, ProjectStatus } from '@school-expense-ecosystem/projects/types';
import { CreateProjectDialogComponent, CreateProjectDialogData } from '../dialogs/create-project-dialog/create-project-dialog.component';


@Component({
  selector: 'lib-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss'],
  imports: [HeaderComponent, FilterComponent, LoadingDirective, CommonModule, PaginationComponent, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, FooterComponent, TranslocoModule, MatMenuModule],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'project' }
  ]
})
export class ProjectListComponent implements OnInit {
  private readonly projectApiService = inject(ProjectApiService);
  private readonly authSignalStore = inject(AuthSignalStore);
  private readonly facultyApiService = inject(FacultyApiService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

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

  navigateToDetail(projectId: string): void {
    this.router.navigate(['/projects', projectId]);
  }

  openCreateProjectModal(): void {
    const dialogData: CreateProjectDialogData = {
      facultyId: this.currentUser()?.facultyId,
    };

    const dialogRef = this.dialog.open(CreateProjectDialogComponent, {
      width: '700px',
      data: dialogData,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((createdProject) => {
      if (createdProject) {
        this.projectsResource.reload();
      }
    });
  }

  openJoinByCodeModal(): void {
    // Open student join code input dialog logic
  }

  openJoinCodeModal(project: Project): void {
    // Open join code configuration/QR dialog logic
  }
}