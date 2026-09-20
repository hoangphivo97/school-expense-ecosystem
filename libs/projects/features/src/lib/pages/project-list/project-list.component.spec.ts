import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AuthenticatedUser, FacultyId, Role, UserType } from '@school-expense-ecosystem/shared/types';
import { AuthSignalStore, FacultyApiService } from '@school-expense-ecosystem/shared/data-access';
import { NotificationService } from '@school-expense-ecosystem/shared/ui';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { ProjectApiService } from '@school-expense-ecosystem/projects/data-access';
import { ProjectFundingType, ProjectItem, ProjectStatus } from '@school-expense-ecosystem/projects/types';
import { ProjectListComponent, ProjectViewModel } from './project-list.component';
import { createMockAuthenticatedUser } from '@school-expense-ecosystem/shared/test-utils';

describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;

  // Writable Signals to control mock reactive state dynamically
  let mockUserSignal: WritableSignal<AuthenticatedUser | null>;
  let mockProjectsResourceSignal: WritableSignal<{ items: ProjectItem[]; total: number } | undefined>;
  let mockProjectsLoadingSignal: WritableSignal<boolean>;

  let mockProjectApiService: jest.Mocked<Partial<ProjectApiService>>;
  let mockDialog: { open: jest.Mock };
  let mockNotificationService: jest.Mocked<Partial<NotificationService>>;

  const dummyProject: ProjectItem = {
    id: 'PRJ-FIT-001',
    name: 'AI Research Platform',
    type: ProjectFundingType.FACULTY,
    status: ProjectStatus.PENDING_DEAN_APPROVAL,
    budgetCap: 20000000,
    initialSpent: 0,
    currentSpent: 0,
    mentorId: 'mentor-uid-01',
    facultyId: FacultyId.FIT,
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    joinedStudentIds: ['stu-01'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    // 1. Initialize reactive mock signals
    mockUserSignal = signal<AuthenticatedUser | null>(
      createMockAuthenticatedUser({
        role: Role.LEVEL_2_DEAN,
        facultyId: FacultyId.FIT,
        userType: UserType.TEACHER
      })
    );

    mockProjectsResourceSignal = signal({
      items: [dummyProject],
      total: 1,
    });
    mockProjectsLoadingSignal = signal(false);

    // 2. Setup service mocks
    mockProjectApiService = {
      getProjectsResource: jest.fn().mockReturnValue({
        value: mockProjectsResourceSignal,
        isLoading: mockProjectsLoadingSignal,
        reload: jest.fn(),
      } as any),
      approveProject: jest.fn().mockReturnValue(of({ success: true })),
      rejectProject: jest.fn().mockReturnValue(of({ success: true })),
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
        ProjectListComponent,
        // Provides full mock environment for *transloco directive and | transloco pipe
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
        { provide: ProjectApiService, useValue: mockProjectApiService },
        { provide: AuthSignalStore, useValue: { user: mockUserSignal } },
        {
          provide: FacultyApiService,
          useValue: { facultiesResource: { value: signal([]) } },
        },
        { provide: MatDialog, useValue: mockDialog },
        { provide: NotificationService, useValue: mockNotificationService },
        // Removed manual TranslocoService mock provider
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  describe('Computed dataSource & Permission Matrix', () => {
    it('should allow Dean to approve and reject pending projects within their faculty', () => {
      // User is Dean of FIT and project facultyId is FIT with PENDING_DEAN_APPROVAL status
      const viewModels: ProjectViewModel[] = component.dataSource();
      expect(viewModels.length).toBe(1);

      const targetProject = viewModels[0];
      expect(targetProject.canApprove).toBe(true);
      expect(targetProject.canReject).toBe(true);
      expect(targetProject.canEdit).toBe(true);
    });

    it('should revoke approval rights if project belongs to a different faculty', () => {
      // Switch Dean faculty to foreign faculty
      mockUserSignal.set(
        createMockAuthenticatedUser({
          role: Role.LEVEL_2_DEAN,
          facultyId: FacultyId.FET,
          userType: UserType.TEACHER,
        })
      );
      fixture.detectChanges();

      const viewModels = component.dataSource();
      expect(viewModels[0].canApprove).toBe(false);
      expect(viewModels[0].canReject).toBe(false);
    });

    it('should identify student user type correctly via isStudent signal', () => {
      mockUserSignal.set(
        createMockAuthenticatedUser({
          role: Role.LEVEL_3_USER,
          facultyId: FacultyId.FIT,
          userType: UserType.STUDENT,
        })
      );
      fixture.detectChanges();

      expect(component.isStudent()).toBe(true);
    });
  });

  describe('Filtering & Pagination Pipeline', () => {
    it('should reset page index to 1 when search filters change', () => {
      component.currentPageIndex.set(3);

      component.onProjectFiltersChanged({ searchTerm: 'Blockchain' });

      expect(component.currentPageIndex()).toBe(1);
      expect(component.queryParams()).toEqual(
        expect.objectContaining({
          page: 1,
          search: 'Blockchain',
        })
      );
    });
  });

  describe('Project Approval Flow', () => {
    it('should trigger approval API and reload resource when confirmation dialog confirms', () => {
      // Mock user confirming the dialog
      mockDialog.open.mockReturnValue({
        afterClosed: () => of(true),
      } as any);

      component.onApproveProject(dummyProject);

      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockProjectApiService.approveProject).toHaveBeenCalledWith(dummyProject.id);
      expect(mockNotificationService.success).toHaveBeenCalledWith('project.projectList.notifications.approved');
    });

    it('should abort approval if user cancels dialog', () => {
      // Mock user cancelling the dialog
      mockDialog.open.mockReturnValue({
        afterClosed: () => of(false),
      } as any);

      component.onApproveProject(dummyProject);

      expect(mockProjectApiService.approveProject).not.toHaveBeenCalled();
    });
  });

  describe('Conditional UI Rendering by Role & State', () => {
    describe('Header Actions (Student vs Non-Student)', () => {
      it('should render "Join by Code" button and hide "Create Project" button for Student', () => {
        // Set state to Student
        mockUserSignal.set(
          createMockAuthenticatedUser({
            role: Role.LEVEL_3_USER,
            facultyId: FacultyId.FIT,
            userType: UserType.STUDENT,
          })
        );
        fixture.detectChanges();

        const hostElement: HTMLElement = fixture.nativeElement;
        const createBtn = hostElement.querySelector('button[primaryAction] mat-icon');

        // Verify icon of primaryAction matches vpn_key (Join by Code) instead of add
        expect(createBtn?.textContent?.trim()).toBe('vpn_key');
      });

      it('should render "Create Project" button and hide "Join by Code" for Teacher/Dean', () => {
        // Set state to Dean / Teacher
        mockUserSignal.set(
          createMockAuthenticatedUser({
            role: Role.LEVEL_2_DEAN,
            facultyId: FacultyId.FIT,
            userType: UserType.TEACHER
          })
        );
        fixture.detectChanges();

        const hostElement: HTMLElement = fixture.nativeElement;
        const createBtn = hostElement.querySelector('button[primaryAction] mat-icon');

        expect(createBtn?.textContent?.trim()).toBe('add');
      });
    });

    describe('Grid Row Actions (Permissions Matrix)', () => {
      it('should render Approve and Reject buttons when user is Dean of the same faculty and project is pending', () => {
        // Dean of FIT viewing a PENDING_DEAN_APPROVAL project of FIT
        mockUserSignal.set(
          createMockAuthenticatedUser({
            role: Role.LEVEL_2_DEAN,
            facultyId: FacultyId.FIT,
            userType: UserType.TEACHER
          })
        );
        fixture.detectChanges();

        const hostElement: HTMLElement = fixture.nativeElement;
        const approveBtn = hostElement.querySelector('button[aria-label="Approve Project"]');
        const rejectBtn = hostElement.querySelector('button[aria-label="Reject Project"]');
        const editBtn = hostElement.querySelector('button[aria-label="Edit Project"]');

        expect(approveBtn).not.toBeNull();
        expect(rejectBtn).not.toBeNull();
        expect(editBtn).not.toBeNull();
      });

      it('should NOT render Approve and Reject buttons if Dean belongs to a different faculty', () => {
        // Dean of FEE viewing project belonging to FIT
        mockUserSignal.set(
          createMockAuthenticatedUser({
            role: Role.LEVEL_2_DEAN,
            facultyId: FacultyId.FET,
            userType: UserType.TEACHER,
          })
        );
        fixture.detectChanges();

        const hostElement: HTMLElement = fixture.nativeElement;
        const approveBtn = hostElement.querySelector('button[aria-label="Approve Project"]');
        const rejectBtn = hostElement.querySelector('button[aria-label="Reject Project"]');

        // Elements should be removed from DOM by @if
        expect(approveBtn).toBeNull();
        expect(rejectBtn).toBeNull();
      });

      it('should render Manage Join Code button only when project is ACTIVE and user is Mentor/Teacher', () => {
        // Update mock project to ACTIVE status
        mockProjectsResourceSignal.set({
          items: [{ ...dummyProject, status: ProjectStatus.ACTIVE, mentorId: 'teacher-01' }],
          total: 1,
        });
        mockUserSignal.set(
          createMockAuthenticatedUser({
            role: Role.LEVEL_3_USER,
            facultyId: FacultyId.FIT,
            userType: UserType.TEACHER
          })
        );
        fixture.detectChanges();

        const hostElement: HTMLElement = fixture.nativeElement;
        const joinCodeBtn = hostElement.querySelector('button[aria-label="Manage Join Code"]');

        expect(joinCodeBtn).not.toBeNull();
      });
    });
  });
});