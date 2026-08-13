import { Component, OnInit, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { FilterMode, SharedFilterFields, UserType } from '@school-expense-ecosystem/shared/types';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { FilterComponent, FooterComponent, HeaderComponent, LoadingDirective, PaginationComponent } from '@school-expense-ecosystem/shared/ui';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { MatMenuModule } from '@angular/material/menu';
import { ProjectApiService } from '@school-expense-ecosystem/projects/data-access';
import { Project, ProjectStatus } from '@school-expense-ecosystem/projects/types';


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
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  // State Signals
  readonly isGridDataLoading = signal<boolean>(false);
  readonly projectsSignal = signal<Project[]>([]);
  readonly totalItems = signal<number>(0);
  readonly pageSize = signal<number>(10);
  readonly currentPageIndex = signal<number>(1);
  readonly filterParams = signal<SharedFilterFields>({});
  readonly availableYearsSignal = signal<number[]>([2024, 2025, 2026]);

  // Auth Context Signals
  readonly currentUser = this.authSignalStore.user;
  readonly isStudent = computed(() => this.currentUser()?.userType === UserType.STUDENT);
  readonly facultiesListSignal = signal<{ facultyId: string; facultyName: string }[]>([
    { facultyId: 'FIT', facultyName: 'Information Technology' },
    { facultyId: 'FBA', facultyName: 'Business Administration' },
    { facultyId: 'FET', facultyName: 'Engineering & Technology' }
  ]);

  // Reactive Grid Data & Columns
  readonly dataSource = computed(() => this.projectsSignal());
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
    this.loadProjects();
  }

  loadProjects(): void {
    this.isGridDataLoading.set(true);
    // Architect Practice: Pass reactive filter params down to HTTP Client layer
    this.projectApiService.getProjects().subscribe({
      next: (projects) => {
        this.projectsSignal.set(projects);
        this.totalItems.set(projects.length);
        this.isGridDataLoading.set(false);
      },
      error: () => this.isGridDataLoading.set(false),
    });
  }

  canManageJoinCode(project: Project): boolean {
    const user = this.currentUser();
    if (!user) return false;
    // Mentors or admins can configure invitation codes for active projects
    return (user.uid === project.mentorId || user.userType === UserType.TEACHER) && project.status === ProjectStatus.ACTIVE;
  }

  onProjectFiltersChanged(filters: SharedFilterFields): void {
    this.filterParams.set(filters);
    // TODO: Connect filters to backend API query once Project filter specification is finalized
  }

  onPageChange(page: number): void {
    this.currentPageIndex.set(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
  }

  navigateToDetail(projectId: string): void {
    this.router.navigate(['/finance/projects', projectId]);
  }

  openCreateProjectModal(): void {
    // Open project creation dialog logic
  }

  openJoinByCodeModal(): void {
    // Open student join code input dialog logic
  }

  openJoinCodeModal(project: Project): void {
    // Open join code configuration/QR dialog logic
  }
}