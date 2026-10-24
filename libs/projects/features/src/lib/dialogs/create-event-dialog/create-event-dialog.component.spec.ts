import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { of } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { EventApiService, ProjectApiService } from '@school-expense-ecosystem/projects/data-access';
import {
  EventFundingType,
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
import { createMockEventItem, createMockProjectItem } from '@school-expense-ecosystem/projects/test-utils';

describe('CreateEventDialogComponent', () => {
  let component: CreateEventDialogComponent;
  let fixture: ComponentFixture<CreateEventDialogComponent>;

  let mockDialogRef: jest.Mocked<Partial<MatDialogRef<CreateEventDialogComponent>>>;
  let mockDialog: { open: jest.Mock };
  let mockEventApiService: jest.Mocked<Partial<EventApiService>>;
  let mockProjectApiService: jest.Mocked<Partial<ProjectApiService>>;
  let mockFacultyApiService: {
    facultiesResource: {
      value: WritableSignal<{ id: FacultyId; name: string }[]>;
      isLoading: WritableSignal<boolean>;
    };
  };
  let mockUserSignal: WritableSignal<AuthenticatedUser | null>;
  let mockProjectsResourceSignal: WritableSignal<{ items: ProjectItem[]; total: number } | undefined>;

  const dummyProject = createMockProjectItem({
    id: 'PRJ-FIT-001',
    status: ProjectStatus.ACTIVE,
    facultyId: FacultyId.FIT,
    startDate: new Date('2026-11-01T00:00:00.000Z').toISOString(),
    endDate: new Date('2026-11-30T23:59:59.999Z').toISOString(),
    budgetCap: 20000000,
    currentSpent: 5000000,
    pendingSpent: 2000000,
  });

  const dummyEvent = createMockEventItem({
    startDate: new Date('2026-11-01').toISOString(),
    endDate: new Date('2026-11-02').toISOString(),
    facultyId: FacultyId.FIT,
    type: EventFundingType.FACULTY,
  });


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
      } as unknown as ReturnType<ProjectApiService['getProjectsResource']>),
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

    it('should invalidate form when event startDate is before parent project startDate', () => {
      component.form.patchValue({
        type: EventFundingType.PROJECT,
        projectId: dummyProject.id,
        startDate: new Date('2026-10-28'), // Prior to parent project start (2026-11-01)
        endDate: new Date('2026-11-15'),
      });

      expect(component.form.errors).toEqual(
        expect.objectContaining({ eventOutsideParentProjectTimeline: true })
      );
      expect(component.form.valid).toBe(false);
    });

    it('should invalidate form when event endDate is after parent project endDate', () => {
      component.form.patchValue({
        type: EventFundingType.PROJECT,
        projectId: dummyProject.id,
        startDate: new Date('2026-11-10'),
        endDate: new Date('2026-12-05'), // Past parent project end (2026-11-30)
      });

      expect(component.form.errors).toEqual(
        expect.objectContaining({ eventOutsideParentProjectTimeline: true })
      );
      expect(component.form.valid).toBe(false);
    });

    it('should pass timeline validation when event dates fall cleanly within parent project window', () => {
      component.form.patchValue({
        type: EventFundingType.PROJECT,
        projectId: dummyProject.id,
        startDate: new Date('2026-11-05'),
        endDate: new Date('2026-11-20'),
      });

      expect(component.form.errors?.['eventOutsideParentProjectTimeline']).toBeUndefined();
    });

    it('should bypass parent timeline validation when event funding type is not PROJECT', () => {
      // Standalone event with dates beyond dummyProject duration
      component.form.patchValue({
        type: EventFundingType.SCHOOL,
        projectId: null,
        startDate: new Date('2026-10-15'),
        endDate: new Date('2026-12-15'),
      });

      expect(component.form.errors?.['eventOutsideParentProjectTimeline']).toBeUndefined();
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
      } as unknown as MatDialogRef<unknown>);

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
        afterClosed: () => of(true),
      } as unknown as MatDialogRef<unknown>);

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

    it('should reset projectId and update selectedFacultyId signal when faculty changes', () => {
      component.form.get('projectId')?.setValue('PRJ-FIT-001');

      component.form.get('facultyId')?.setValue(FacultyId.FBE);

      expect(component.selectedFacultyId()).toBe(FacultyId.FBE);
      expect(component.form.get('projectId')?.value).toBeNull();
    });

    it('should synchronize selectedProjectId and selectedProject computed signal on projectId change', () => {
      expect(component.selectedProjectId()).toBeNull();
      expect(component.selectedProject()).toBeNull();

      component.form.get('projectId')?.setValue(dummyProject.id);

      expect(component.selectedProjectId()).toBe(dummyProject.id);
      expect(component.selectedProject()).toEqual(dummyProject);

      component.form.get('projectId')?.setValue(null);

      expect(component.selectedProjectId()).toBeNull();
      expect(component.selectedProject()).toBeNull();
    });
  });
})
