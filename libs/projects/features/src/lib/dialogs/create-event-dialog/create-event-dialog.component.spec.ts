import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { of } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { EventApiService, ProjectApiService } from '@school-expense-ecosystem/projects/data-access';
import {
  EventFundingType,
  EventItem,
  EventStatus,
  ProjectFundingType,
  ProjectItem,
  ProjectStatus,
} from '@school-expense-ecosystem/projects/types';
import { AuthSignalStore, FacultyApiService } from '@school-expense-ecosystem/shared/data-access';
import {
  AuthenticatedUser,
  DialogActionEnum,
  FacultyId,
  Role,
  UserType,
} from '@school-expense-ecosystem/shared/types';
import { ConfirmDialogComponent } from '@school-expense-ecosystem/shared/ui';
import { createMockAuthenticatedUser } from '@school-expense-ecosystem/shared/test-utils';
import { CreateEventDialogComponent, CreateEventDialogData } from './create-event-dialog.component';

describe('CreateEventDialogComponent', () => {
  let component: CreateEventDialogComponent;
  let fixture: ComponentFixture<CreateEventDialogComponent>;

  let mockDialogRef: jest.Mocked<Partial<MatDialogRef<CreateEventDialogComponent>>>;
  let mockDialog: { open: jest.Mock };
  let mockEventApiService: jest.Mocked<Partial<EventApiService>>;
  let mockProjectApiService: jest.Mocked<Partial<ProjectApiService>>;
  let mockFacultyApiService: { facultiesResource: { value: WritableSignal<any[]>; isLoading: WritableSignal<boolean> } };
  let mockUserSignal: WritableSignal<AuthenticatedUser | null>;
  let mockProjectsResourceSignal: WritableSignal<{ items: ProjectItem[]; total: number } | undefined>;

  const dummyProject: ProjectItem = {
    id: 'PRJ-FIT-001',
    name: 'AI Research Platform',
    type: ProjectFundingType.FACULTY,
    status: ProjectStatus.ACTIVE,
    budgetCap: 20000000,
    initialSpent: 5000000,
    currentSpent: 5000000,
    pendingSpent: 2000000, // Headroom = 20M - (5M + 2M) = 13M
    mentorId: 'mentor-01',
    facultyId: FacultyId.FIT,
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    joinedStudentIds: [],
  };

  const dummyEvent: EventItem = {
    id: 'EVT-FIT-001',
    name: 'Tech Symposium 2026',
    facultyId: FacultyId.FIT,
    type: EventFundingType.FACULTY,
    budgetCap: 10000000,
    initialSpent: 0,
    currentSpent: 0,
    status: EventStatus.PENDING_DEAN_APPROVAL,
    organizerId: 'teacher-01',
    startDate: new Date('2026-11-01').toISOString(),
    endDate: new Date('2026-11-02').toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    joinedStudentIds: [],
  };

  beforeEach(async () => {
    mockDialogRef = {
      close: jest.fn(),
      updateSize: jest.fn(),
    };

    mockDialog = {
      open: jest.fn(),
    };

    mockEventApiService = {
      createEvent: jest.fn().mockReturnValue(of(dummyEvent)),
      updateEvent: jest.fn().mockReturnValue(of(dummyEvent)),
    };

    mockProjectsResourceSignal = signal({ items: [dummyProject], total: 1 });
    mockProjectApiService = {
      getProjectsResource: jest.fn().mockReturnValue({
        value: mockProjectsResourceSignal,
        isLoading: signal(false),
      } as any),
    };

    mockFacultyApiService = {
      facultiesResource: {
        value: signal([{ id: FacultyId.FIT, name: 'Faculty of IT' }]),
        isLoading: signal(false),
      },
    };

    mockUserSignal = signal(
      createMockAuthenticatedUser({
        role: Role.LEVEL_2_DEAN,
        facultyId: FacultyId.FIT,
        userType: UserType.TEACHER,
      })
    );

    await TestBed.configureTestingModule({
      imports: [
        CreateEventDialogComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatDialog, useValue: mockDialog },
        { provide: EventApiService, useValue: mockEventApiService },
        { provide: ProjectApiService, useValue: mockProjectApiService },
        { provide: FacultyApiService, useValue: mockFacultyApiService },
        { provide: AuthSignalStore, useValue: { user: mockUserSignal } },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            action: DialogActionEnum.Create,
            facultyId: FacultyId.FIT,
          } as CreateEventDialogData,
        },
      ],
    }).overrideComponent(CreateEventDialogComponent, {
      add: {
        providers: [{ provide: MatDialog, useValue: mockDialog }],
      },
    })
      .compileComponents();

    fixture = TestBed.createComponent(CreateEventDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation & Financial Guardrails', () => {
    it('should invalidate form when startDate is after endDate', () => {
      // Set startDate ahead of endDate to trigger invalidDateRange error
      component.form.patchValue({
        startDate: new Date('2026-11-10'),
        endDate: new Date('2026-11-05'),
      });

      expect(component.form.errors).toEqual(
        expect.objectContaining({ invalidDateRange: true })
      );
      expect(component.form.valid).toBe(false);
    });

    it('should invalidate form when initialSpent exceeds budgetCap', () => {
      // Set initial expenditure higher than the assigned budget ceiling
      component.form.patchValue({
        budgetCap: 5000000,
        initialSpent: 6000000,
      });

      expect(component.form.get('initialSpent')?.hasError('initialSpentExceedsBudget')).toBe(true);
      expect(component.form.errors).toEqual(
        expect.objectContaining({ initialSpentExceedsBudget: true })
      );
    });

    it('should require projectId when funding type is switched to PROJECT', () => {
      // Switching to PROJECT type must enforce parent project selection
      component.form.get('type')?.setValue(EventFundingType.PROJECT);

      const projectControl = component.form.get('projectId');
      expect(projectControl?.hasError('required')).toBe(true);

      projectControl?.setValue('PRJ-FIT-001');
      expect(projectControl?.hasError('required')).toBe(false);
    });

    it('should fail validation when event budgetCap exceeds parent project headroom', () => {
      // Parent project headroom is 13M (20M - 5M current - 2M pending)
      component.form.patchValue({
        type: EventFundingType.PROJECT,
        projectId: 'PRJ-FIT-001',
        budgetCap: 15000000, // 15M > 13M headroom
      });

      expect(component.form.get('budgetCap')?.hasError('parentBudgetExceeded')).toBe(true);
      expect(component.form.errors).toEqual(
        expect.objectContaining({ parentBudgetExceeded: true })
      );
    });

    it('should invalidate join code configuration if expiresAt is set after event endDate', () => {
      // Enable join code and set expiry date past the event end date
      component.form.patchValue({
        endDate: new Date('2026-11-05'),
        generateJoinCode: true,
        expiresAt: new Date('2026-11-06'),
      });

      expect(component.form.errors).toEqual(
        expect.objectContaining({ invalidJoinCodeExpiration: true })
      );
    });
  });

  describe('Dynamic Layout & State Synchronization', () => {
    it('should expand dialog to 1020px when join code is enabled and shrink to 600px when disabled', () => {
      // Toggle join code checkbox to trigger dialog size mutation
      component.form.get('generateJoinCode')?.setValue(true);
      expect(mockDialogRef.updateSize).toHaveBeenCalledWith('1020px');

      component.form.get('generateJoinCode')?.setValue(false);
      expect(mockDialogRef.updateSize).toHaveBeenCalledWith('600px');
    });

    it('should reset projectId and update selectedFacultyId signal when faculty changes', () => {
      component.form.get('projectId')?.setValue('PRJ-FIT-001');

      component.form.get('facultyId')?.setValue(FacultyId.FBE);

      expect(component.selectedFacultyId()).toBe(FacultyId.FBE);
      expect(component.form.get('projectId')?.value).toBeNull();
    });
  });

  describe('Submission Pipeline & Confirmation Guards', () => {
    it('should prompt confirmation warning dialog for Dean creating a SCHOOL funded event', () => {
      // Fill valid form fields
      component.form.patchValue({
        name: 'Annual IT Festival',
        type: EventFundingType.SCHOOL,
        facultyId: FacultyId.FIT,
        budgetCap: 5000000,
        startDate: new Date('2026-11-01'),
        endDate: new Date('2026-11-03'),
      });

      // User confirms the warning modal
      mockDialog.open.mockReturnValue({
        afterClosed: () => of(true),
      } as any);

      component.onSubmit();

      // Ensure warning confirmation modal is displayed before dispatching API
      expect(mockDialog.open).toHaveBeenCalledWith(
        ConfirmDialogComponent,
        expect.objectContaining({
          data: expect.objectContaining({ icon: 'help_outline' }),
        })
      );
      expect(mockEventApiService.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Annual IT Festival',
          type: EventFundingType.SCHOOL,
          budgetCap: 5000000,
        })
      );
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should abort creation if user cancels the warning confirmation dialog', () => {
      component.form.patchValue({
        name: 'Annual IT Festival',
        type: EventFundingType.SCHOOL,
        facultyId: FacultyId.FIT,
        budgetCap: 5000000,
        startDate: new Date('2026-11-01'),
        endDate: new Date('2026-11-03'),
      });

      // User cancels the warning modal
      mockDialog.open.mockReturnValue({
        afterClosed: () => of(false),
      } as any);

      component.onSubmit();

      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockEventApiService.createEvent).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should prompt discard confirmation when closing with a dirty form', () => {
      // Mark form as dirty by user input
      component.form.get('name')?.setValue('Draft Event');
      component.form.markAsDirty();

      mockDialog.open.mockReturnValue({
        afterClosed: () => of(true),
      } as any);

      component.onCancel();

      // Ensure discard confirmation modal is invoked to prevent accidental data loss
      expect(mockDialog.open).toHaveBeenCalledWith(
        ConfirmDialogComponent,
        expect.objectContaining({
          data: expect.objectContaining({ confirmColor: 'warn' }),
        })
      );
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });
})
