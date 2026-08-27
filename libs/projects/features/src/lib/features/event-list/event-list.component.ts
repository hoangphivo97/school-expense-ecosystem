import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TRANSLOCO_SCOPE, TranslocoModule, TranslocoService } from '@ngneat/transloco';
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
  CopyToClipboardDirective,
  FilterComponent,
  LoadingDirective,
  NotificationService,
  PaginationComponent,
} from '@school-expense-ecosystem/shared/ui';

export interface EventItem {
  id: string;
  name: string;
  projectId?: string;
  facultyId: FacultyId;
  budgetCap: number;
  currentSpent: number;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  participantCount: number;
  maxParticipants?: number;
}

export interface EventViewModel extends EventItem {
  canEdit: boolean;
  canManage: boolean;
  attendancePercentage?: number;
  isFull?: boolean;
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

  readonly isGridDataLoading = signal<boolean>(false);

  // Dynamic Lookup for faculties
  readonly facultiesListSignal = computed(() =>
    this.facultyApiService.facultiesResource.value().map((faculty) => ({
      facultyId: faculty.id,
      facultyName: faculty.name,
    }))
  );

  // Reactive Grid Data Pipeline
  readonly rawEvents = signal<EventItem[]>([]);
  readonly totalItems = computed(() => this.rawEvents().length);

  readonly dataSource = computed<EventViewModel[]>(() => {
    const items = this.rawEvents();
    const user = this.currentUser();
    if (!user) return [];

    const isPrivileged = [Role.LEVEL_0_ADMIN, Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN].includes(
      user.role
    );

    return items.map((event) => {
      const percentage = event.maxParticipants
        ? Math.min(Math.round((event.participantCount / event.maxParticipants) * 100), 100)
        : undefined;

      return {
        ...event,
        canEdit: isPrivileged || user.userType === UserType.TEACHER,
        canManage: isPrivileged || user.userType === UserType.TEACHER,
        attendancePercentage: percentage,
        isFull: event.maxParticipants ? event.participantCount >= event.maxParticipants : false,
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