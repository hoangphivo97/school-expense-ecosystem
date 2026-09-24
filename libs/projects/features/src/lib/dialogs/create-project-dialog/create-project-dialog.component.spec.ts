import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { of } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { ProjectApiService } from '@school-expense-ecosystem/projects/data-access';
import {
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
import {
  CreateProjectDialogComponent,
  CreateProjectDialogData,
} from './create-project-dialog.component';

describe('CreateProjectDialogComponent', () => {
  let component: CreateProjectDialogComponent;
  let fixture: ComponentFixture<CreateProjectDialogComponent>;

  let mockDialogRef: jest.Mocked<Partial<MatDialogRef<CreateProjectDialogComponent>>>;
  let mockDialog: { open: jest.Mock };
  let mockProjectApiService: jest.Mocked<Partial<ProjectApiService>>;
  let mockFacultyApiService: { facultiesResource: { value: WritableSignal<any[]>; isLoading: WritableSignal<boolean> } };
  let mockUserSignal: WritableSignal<AuthenticatedUser | null>;

  const dummyProject: ProjectItem = {
    id: 'PRJ-FIT-001',
    name: 'AI Research Platform',
    type: ProjectFundingType.FACULTY,
    status: ProjectStatus.ACTIVE,
    budgetCap: 20000000,
    initialSpent: 5000000,
    currentSpent: 5000000,
    mentorId: 'mentor-01',
    facultyId: FacultyId.FIT,
    joinedStudentIds: [],
    startDate: new Date('2026-11-01').toISOString(),
    endDate: new Date('2026-11-30').toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    mockDialogRef = {
      close: jest.fn(),
      updateSize: jest.fn(),
    };

    mockDialog = {
      open: jest.fn(),
    };

    mockProjectApiService = {
      createProject: jest.fn().mockReturnValue(of(dummyProject)),
      updateProject: jest.fn().mockReturnValue(of(dummyProject)),
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
        CreateProjectDialogComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ProjectApiService, useValue: mockProjectApiService },
        { provide: FacultyApiService, useValue: mockFacultyApiService },
        { provide: AuthSignalStore, useValue: { user: mockUserSignal } },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            action: DialogActionEnum.Create,
            facultyId: FacultyId.FIT,
          } as CreateProjectDialogData,
        },
      ],
    })
      .overrideComponent(CreateProjectDialogComponent, {
        add: {
          providers: [{ provide: MatDialog, useValue: mockDialog }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CreateProjectDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation & Financial Guardrails', () => {
    it('should invalidate form when startDate is after endDate', () => {
      component.form.patchValue({
        startDate: new Date('2026-11-20'),
        endDate: new Date('2026-11-10'),
      });

      expect(component.form.errors).toEqual(
        expect.objectContaining({ invalidDateRange: true })
      );
      expect(component.form.valid).toBe(false);
    });

    it('should invalidate form when initialSpent exceeds budgetCap', () => {
      component.form.patchValue({
        budgetCap: 10000000,
        initialSpent: 15000000,
      });

      expect(component.form.get('initialSpent')?.hasError('initialSpentExceedsBudget')).toBe(true);
      expect(component.form.errors).toEqual(
        expect.objectContaining({ initialSpentExceedsBudget: true })
      );
    });

    it('should invalidate join code schedule when expiresAt is after project endDate', () => {
      component.form.patchValue({
        endDate: new Date('2026-11-25'),
        generateJoinCode: true,
        expiresAt: new Date('2026-11-30'),
      });

      expect(component.form.errors).toEqual(
        expect.objectContaining({ invalidJoinCodeExpiration: true })
      );
    });

    it('should automatically set expiresAt to endDate when join code is activated', () => {
      const targetEndDate = new Date('2026-12-15');
      component.form.patchValue({ endDate: targetEndDate });

      component.form.get('generateJoinCode')?.setValue(true);

      expect(component.form.get('expiresAt')?.value).toEqual(targetEndDate);
    });
  });

  describe('Dynamic Layout & State Synchronization', () => {
    it('should expand dialog to 1020px when join code is enabled and shrink to 600px when disabled', () => {
      component.form.get('generateJoinCode')?.setValue(true);
      expect(mockDialogRef.updateSize).toHaveBeenCalledWith('1020px');

      component.form.get('generateJoinCode')?.setValue(false);
      expect(mockDialogRef.updateSize).toHaveBeenCalledWith('600px');
    });

    it('should reset maxUses and expiresAt when join code checkbox is unticked', () => {
      component.form.patchValue({
        generateJoinCode: true,
        maxUses: 50,
        expiresAt: new Date('2026-12-01'),
      });

      component.form.get('generateJoinCode')?.setValue(false);

      expect(component.form.get('maxUses')?.value).toBeNull();
      expect(component.form.get('expiresAt')?.value).toBeNull();
    });
  });

  describe('Submission Pipeline & Confirmation Guards', () => {
    it('should prompt confirmation warning dialog for Dean creating a SCHOOL funded project', () => {
      component.form.patchValue({
        name: 'Quantum Computing Lab',
        type: ProjectFundingType.SCHOOL,
        facultyId: FacultyId.FIT,
        budgetCap: 50000000,
        startDate: new Date('2026-11-01'),
        endDate: new Date('2026-11-30'),
      });

      mockDialog.open.mockReturnValue({
        afterClosed: () => of(true),
      } as any);

      component.onSubmit();

      expect(mockDialog.open).toHaveBeenCalledWith(
        ConfirmDialogComponent,
        expect.objectContaining({
          data: expect.objectContaining({ icon: 'help_outline' }),
        })
      );
      expect(mockProjectApiService.createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Quantum Computing Lab',
          type: ProjectFundingType.SCHOOL,
          budgetCap: 50000000,
        })
      );
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should abort creation if user cancels warning confirmation dialog', () => {
      component.form.patchValue({
        name: 'Quantum Computing Lab',
        type: ProjectFundingType.SCHOOL,
        facultyId: FacultyId.FIT,
        budgetCap: 50000000,
        startDate: new Date('2026-11-01'),
        endDate: new Date('2026-11-30'),
      });

      mockDialog.open.mockReturnValue({
        afterClosed: () => of(false),
      } as any);

      component.onSubmit();

      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockProjectApiService.createProject).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should dispatch updateProject API directly when in edit mode', () => {
      component.action.set(DialogActionEnum.Edit);
      (component as any).data = {
        action: DialogActionEnum.Edit,
        project: dummyProject,
      };

      component.form.patchValue({
        name: 'Updated Project Name',
        type: ProjectFundingType.FACULTY,
        facultyId: FacultyId.FIT,
        budgetCap: 25000000,
        startDate: new Date('2026-11-01'),
        endDate: new Date('2026-11-30'),
      });

      component.onSubmit();

      expect(mockDialog.open).not.toHaveBeenCalled();
      expect(mockProjectApiService.updateProject).toHaveBeenCalledWith(
        dummyProject.id,
        expect.objectContaining({
          name: 'Updated Project Name',
          budgetCap: 25000000,
        })
      );
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should prompt discard confirmation when cancelling with a dirty form', () => {
      component.form.get('name')?.setValue('Draft Proposal');
      component.form.markAsDirty();

      mockDialog.open.mockReturnValue({
        afterClosed: () => of(true),
      } as any);

      component.onCancel();

      expect(mockDialog.open).toHaveBeenCalledWith(
        ConfirmDialogComponent,
        expect.objectContaining({
          data: expect.objectContaining({ confirmColor: 'warn' }),
        })
      );
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should close dialog immediately when cancelling a pristine form without prompting', () => {
      component.onCancel();

      expect(mockDialog.open).not.toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });
});