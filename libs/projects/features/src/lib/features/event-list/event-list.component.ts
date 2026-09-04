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
  FacultyId,
  FilterMode,
  Role,
  SharedFilterFields,
  UserType,
} from '@school-expense-ecosystem/shared/types';
import {
  CopyToClipboardDirective,
  FilterComponent,
  LoadingDirective,
  NotificationService,
  PaginationComponent,
} from '@school-expense-ecosystem/shared/ui';

export interface EventViewModel extends EventItem, BaseActivityViewModel {
  canManage: boolean;
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

    const isPrivileged = this.allowedRoles.includes(user.role);

    return items.map((event) => {
      const capacityMetrics = calculateActivityCapacity(event);

      return {
        ...event,
        ...capacityMetrics,
        canEdit: isPrivileged || (user.userType === UserType.TEACHER && event.organizerId === user.uid),
        canManage: isPrivileged || (user.userType === UserType.TEACHER && event.organizerId === user.uid),
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
    // Open create event dialog modal logic
  }

  navigateToDetail(event: EventItem): void {
    // Open detail inspection modal logic
  }

  openEditModal(event: EventItem): void {
    // Open edit dialog modal logic
  }
}