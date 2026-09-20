import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { AuthenticatedUser, FacultyId, Role, UserType } from '@school-expense-ecosystem/shared/types';
import { AuthSignalStore, FacultyApiService } from '@school-expense-ecosystem/shared/data-access';
import { ConfirmDialogComponent, NotificationService } from '@school-expense-ecosystem/shared/ui';
import { EventApiService } from '@school-expense-ecosystem/projects/data-access';
import {
  EventFundingType,
  EventItem,
  EventStatus
} from '@school-expense-ecosystem/projects/types';
import { EventListComponent, EventViewModel } from './event-list.component';
import { DialogActionEnum } from '@school-expense-ecosystem/shared/types';
import { CreateEventDialogComponent } from '../../dialogs/create-event-dialog/create-event-dialog.component';
import { createMockAuthenticatedUser } from '@school-expense-ecosystem/shared/test-utils';

describe('EventListComponent', () => {
  let component: EventListComponent;
  let fixture: ComponentFixture<EventListComponent>;

  // Reactive state signals
  let mockUserSignal!: WritableSignal<AuthenticatedUser | null>;
  let mockEventsResourceSignal: WritableSignal<{ items: EventItem[]; total: number } | undefined>;
  let mockEventsLoadingSignal: WritableSignal<boolean>;

  // Service and Dialog mocks
  let mockEventApiService: jest.Mocked<Partial<EventApiService>>;
  let mockDialog: { open: jest.Mock };
  let mockNotificationService: jest.Mocked<Partial<NotificationService>>;

  const dummyEvent: EventItem = {
    id: 'EVT-FIT-001',
    name: 'Tech Symposium 2026',
    facultyId: FacultyId.FIT,
    type: EventFundingType.FACULTY,
    budgetCap: 10000000,
    initialSpent: 0,
    currentSpent: 0,
    pendingSpent: 0,
    status: EventStatus.PENDING_DEAN_APPROVAL,
    organizerId: 'teacher-organizer-01',
    joinedStudentIds: ['stu-01', 'stu-02'],
    projectId: null,
    startDate: new Date('2026-11-01').toISOString(),
    endDate: new Date('2026-11-02').toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    // 1. Initialize reactive state mocks
    mockUserSignal = signal<AuthenticatedUser | null>(
      createMockAuthenticatedUser({
        role: Role.LEVEL_2_DEAN,
        facultyId: FacultyId.FIT,
      })
    );

    mockEventsResourceSignal = signal({
      items: [dummyEvent],
      total: 1,
    });
    mockEventsLoadingSignal = signal(false);

    // 2. Initialize service doubles
    mockEventApiService = {
      getEventsResource: jest.fn().mockReturnValue({
        value: mockEventsResourceSignal,
        isLoading: mockEventsLoadingSignal,
        reload: jest.fn(),
      } as any),
      approveEvent: jest.fn().mockReturnValue(of({ success: true })),
    };

    mockDialog = {
      open: jest.fn(),
    };

    mockNotificationService = {
      success: jest.fn(),
      error: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        EventListComponent,
        TranslocoTestingModule.forRoot({
          langs: {},
          translocoConfig: {
            availableLangs: ['en'],
            defaultLang: 'en',
            reRenderOnLangChange: true,
          },
          preloadLangs: true,
        }),
      ],
      providers: [
        { provide: EventApiService, useValue: mockEventApiService },
        { provide: AuthSignalStore, useValue: { user: mockUserSignal } },
        {
          provide: FacultyApiService,
          useValue: { facultiesResource: { value: signal([]) } },
        },
        { provide: MatDialog, useValue: mockDialog },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  describe('Computed dataSource & Permissions Matrix', () => {
    it('should grant approval rights to Dean when event is PENDING_DEAN_APPROVAL within their faculty', () => {
      const viewModels: EventViewModel[] = component.dataSource();
      expect(viewModels.length).toBe(1);

      const target = viewModels[0];
      expect(target.canApprove).toBe(true);
      expect(target.canEdit).toBe(true);
    });

    it('should revoke approval rights if Dean belongs to a different faculty', () => {
      mockUserSignal.set(
        createMockAuthenticatedUser({
          role: Role.LEVEL_2_DEAN,
          facultyId: FacultyId.FBE,
          userType: UserType.TEACHER
        })
      );
      fixture.detectChanges();

      const target = component.dataSource()[0];
      expect(target.canApprove).toBe(false);
      expect(target.canEdit).toBe(false);
    });

    it('should grant approval rights to Finance when event is PENDING_FINANCE_APPROVAL across all faculties', () => {
      mockEventsResourceSignal.set({
        items: [{ ...dummyEvent, status: EventStatus.PENDING_FINANCE_APPROVAL }],
        total: 1,
      });
      mockUserSignal.set(
        createMockAuthenticatedUser({
          role: Role.LEVEL_1_FINANCE,
          facultyId: FacultyId.FIT,
          userType: UserType.TEACHER
        })

      );
      fixture.detectChanges();

      const target = component.dataSource()[0];
      expect(target.canApprove).toBe(true);
      expect(target.canEdit).toBe(true);
    });

    it('should allow organizer to manage join code and edit when event is UPCOMING', () => {
      mockEventsResourceSignal.set({
        items: [{ ...dummyEvent, status: EventStatus.UPCOMING, organizerId: 'teacher-organizer-01' }],
        total: 1,
      });
      mockUserSignal.set(
        createMockAuthenticatedUser({
          role: Role.LEVEL_3_USER,
          facultyId: FacultyId.FIT,
          userType: UserType.TEACHER,
          uid: 'teacher-organizer-01',
        })

      );
      fixture.detectChanges();

      const target = component.dataSource()[0];
      expect(target.canEdit).toBe(true);
      expect(target.canManageJoinCode).toBe(true);
      expect(target.canApprove).toBe(false);
    });
  });

  describe('Filtering & Pagination', () => {
    it('should reset page index to 1 when event filter parameters change', () => {
      component.currentPageIndex.set(4);

      component.onEventFiltersChanged({ searchTerm: 'Hackathon' });

      expect(component.currentPageIndex()).toBe(1);
      expect(component.queryParams()).toEqual(
        expect.objectContaining({
          page: 1,
          search: 'Hackathon',
        })
      );
    });

    it('should update page size and reset current page index', () => {
      component.currentPageIndex.set(3);

      component.onPageSizeChange(50);

      expect(component.pageSize()).toBe(50);
      expect(component.currentPageIndex()).toBe(1);
    });
  });

  describe('Dialog Actions & Approvals', () => {
    it('should trigger approval API call and reload resource when approval dialog is confirmed', () => {
      mockDialog.open.mockReturnValue({
        afterClosed: () => of(true),
      } as any);

      component.onApproveEvent(dummyEvent);

      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockEventApiService.approveEvent).toHaveBeenCalledWith(dummyEvent.id);
      expect(mockNotificationService.success).toHaveBeenCalledWith('project.projectList.notifications.approved');
    });

    it('should prompt confirmation warning when editing an already approved UPCOMING event', () => {
      const upcomingEvent = { ...dummyEvent, status: EventStatus.UPCOMING };

      // Simulate user clicking cancel on re-approval confirmation dialog
      mockDialog.open.mockReturnValue({
        afterClosed: () => of(false),
      } as any);

      component.openEditModal(upcomingEvent);

      // Verify re-approval confirmation dialog was opened instead of direct edit modal
      expect(mockDialog.open).toHaveBeenCalledWith(
        ConfirmDialogComponent,
        expect.objectContaining({
          data: expect.objectContaining({ confirmColor: 'warn', icon: 'warning' }),
        })
      );
      // Ensure CreateEventDialog was not opened because user cancelled
      expect(mockDialog.open).not.toHaveBeenCalledWith(CreateEventDialogComponent, expect.anything());
    });

    it('should open edit dialog directly when event is in PENDING status without extra warning', () => {
      mockDialog.open.mockReturnValue({
        afterClosed: () => of(undefined),
      } as any);

      component.openEditModal(dummyEvent); // status: PENDING_DEAN_APPROVAL

      expect(mockDialog.open).toHaveBeenCalledWith(
        CreateEventDialogComponent,
        expect.objectContaining({
          data: expect.objectContaining({ action: DialogActionEnum.Edit, event: dummyEvent }),
        })
      );
    });
  });

  describe('Conditional UI Rendering', () => {
    it('should render "Create Event" button for Teachers and Deans', () => {
      mockUserSignal.set(
        createMockAuthenticatedUser({
          role: Role.LEVEL_3_USER,
          facultyId: FacultyId.FIT,
          userType: UserType.TEACHER
        })

      );
      fixture.detectChanges();

      const host: HTMLElement = fixture.nativeElement;
      const createBtn = host.querySelector('button[primaryAction]');
      expect(createBtn).not.toBeNull();
    });

    it('should hide "Create Event" button completely when logged in as a Student', () => {
      mockUserSignal.set(
        createMockAuthenticatedUser({
          role: Role.LEVEL_3_USER,
          facultyId: FacultyId.FIT,
          userType: UserType.STUDENT
        })
      );
      fixture.detectChanges();

      const host: HTMLElement = fixture.nativeElement;
      const createBtn = host.querySelector('button[primaryAction]');
      expect(createBtn).toBeNull();
    });

    it('should render Approve button only for authorized Dean', () => {
      const host: HTMLElement = fixture.nativeElement;
      const approveBtn = host.querySelector('button[aria-label="Approve Event"]');
      expect(approveBtn).not.toBeNull();
    });

    it('should render Manage Join Code button when event is UPCOMING and user has permission', () => {
      mockEventsResourceSignal.set({
        items: [{ ...dummyEvent, status: EventStatus.UPCOMING, organizerId: 'dean-uid-01' }],
        total: 1,
      });
      fixture.detectChanges();

      const host: HTMLElement = fixture.nativeElement;
      const joinCodeBtn = host.querySelector('button[aria-label="Manage Join Code"]');
      expect(joinCodeBtn).not.toBeNull();
    });
  });
});