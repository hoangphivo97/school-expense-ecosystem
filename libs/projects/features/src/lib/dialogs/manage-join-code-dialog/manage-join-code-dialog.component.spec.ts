import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { EventApiService, ProjectApiService } from '@school-expense-ecosystem/projects/data-access';
import {
  EventFundingType,
  EventStatus,
  GenerateJoinCodePayload,
  JoinConfig,
  ProjectFundingType,
  ProjectStatus,
  StudentSummary,
} from '@school-expense-ecosystem/projects/types';
import {
  ManageJoinCodeDialogComponent,
  ManageJoinCodeDialogData,
  ManageJoinCodeDialogResult,
} from './manage-join-code-dialog.component';
import { createMockEventItem, createMockProjectItem } from '@school-expense-ecosystem/projects/test-utils';

describe('ManageJoinCodeDialogComponent', () => {
  let component: ManageJoinCodeDialogComponent;
  let fixture: ComponentFixture<ManageJoinCodeDialogComponent>;

  let mockDialogRef: jest.Mocked<Partial<MatDialogRef<ManageJoinCodeDialogComponent, ManageJoinCodeDialogResult>>>;
  let mockProjectApiService: { [K in keyof ProjectApiService]?: jest.Mock };
  let mockEventApiService: { [K in keyof EventApiService]?: jest.Mock };

  const dummyStudents: StudentSummary[] = [
    {
      id: 'stu-001',
      studentCode: 'B18DCCN001',
      fullName: 'Nguyen Van A',
      email: 'a.nguyen@school.edu',
    },
    {
      id: 'stu-002',
      studentCode: 'B18DCCN002',
      fullName: 'Tran Thi B',
      email: 'b.tran@school.edu',
    },
    {
      id: 'stu-003',
      studentCode: 'B18DCCN003',
      fullName: 'Le Van C',
      email: 'c.le@school.edu',
    },
  ];

  const dummyProject = createMockProjectItem({
    joinedStudentIds: ['stu-001'],
    startDate: new Date('2026-11-01').toISOString(),
    endDate: new Date('2026-11-30').toISOString(),
    type: ProjectFundingType.FACULTY,
    status: ProjectStatus.ACTIVE,
  })

  const dummyGeneratedConfig: JoinConfig = {
    code: 'INVITE-2026',
    isActive: true,
    maxUses: 50,
    usedCount: 0,
    startsAt: new Date().toISOString(),
    expiresAt: new Date('2026-11-30').toISOString(),
    createdAt: new Date().toISOString(),
  };

  const setupTestBed = async (dialogData: ManageJoinCodeDialogData) => {
    mockDialogRef = {
      close: jest.fn(),
    };

    mockProjectApiService = {
      getProjectStudents: jest.fn().mockReturnValue(of([dummyStudents[0]])),
      addStudents: jest.fn().mockReturnValue(of({ success: true })),
      removeStudent: jest.fn().mockReturnValue(of({ success: true })),
      generateJoinCode: jest.fn().mockReturnValue(of(dummyGeneratedConfig)),
      searchStudents: jest.fn().mockReturnValue(of([])),
    };

    mockEventApiService = {
      getEventStudents: jest.fn().mockReturnValue(of([dummyStudents[0]])),
      addStudents: jest.fn().mockReturnValue(of({ success: true })),
      removeStudent: jest.fn().mockReturnValue(of({ success: true })),
      generateJoinCode: jest.fn().mockReturnValue(of(dummyGeneratedConfig)),
      searchStudents: jest.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [
        ManageJoinCodeDialogComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ProjectApiService, useValue: mockProjectApiService },
        { provide: EventApiService, useValue: mockEventApiService },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageJoinCodeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  describe('Project Context Flow', () => {
    beforeEach(async () => {
      await setupTestBed({
        entity: dummyProject,
        type: 'PROJECT',
      });
    });

    it('should initialize and fetch enrolled students roster for project', () => {
      expect(component).toBeTruthy();
      expect(mockProjectApiService.getProjectStudents).toHaveBeenCalledWith(dummyProject.id);
      expect(component.joinedStudents()).toEqual([dummyStudents[0]]);
      expect(component.isLoadingRoster()).toBe(false);
    });

    describe('Member Roster Mutation', () => {
      // Batch append multiple students and update joinedStudents signal
      it('should add multiple students and update joinedStudents signal', () => {
        const studentsToAdd = [dummyStudents[1], dummyStudents[2]];

        component.handleAddStudents(studentsToAdd);

        expect(mockProjectApiService.addStudents).toHaveBeenCalledWith(dummyProject.id, [
          dummyStudents[1].id,
          dummyStudents[2].id,
        ]);
        expect(component.joinedStudents()).toEqual([
          dummyStudents[1],
          dummyStudents[2],
          dummyStudents[0],
        ]);
        expect(component.isMemberMutating()).toBe(false);
        expect(component.errorMessage()).toBeNull();
      });

      // Filter already enrolled members and add only unregistered ones
      it('should filter out already enrolled students in a mixed batch', () => {
        const mixedBatch = [dummyStudents[0], dummyStudents[1]]; // stu-001 already enrolled

        component.handleAddStudents(mixedBatch);

        expect(mockProjectApiService.addStudents).toHaveBeenCalledWith(dummyProject.id, [dummyStudents[1].id]);
        expect(component.joinedStudents()).toEqual([dummyStudents[1], dummyStudents[0]]);
        expect(component.isMemberMutating()).toBe(false);
      });

      // Guard when all students in the batch are already enrolled
      it('should guard against adding when all batch students are already enrolled', () => {
        component.handleAddStudents([dummyStudents[0]]);

        expect(mockProjectApiService.addStudents).not.toHaveBeenCalled();
        expect(component.errorMessage()).toBe('Selected students are already enrolled.');
      });

      it('should remove a student and update joinedStudents signal', () => {
        component.handleRemoveStudent(dummyStudents[0].id);

        expect(mockProjectApiService.removeStudent).toHaveBeenCalledWith(dummyProject.id, dummyStudents[0].id);
        expect(component.joinedStudents()).toEqual([]);
        expect(component.isMemberMutating()).toBe(false);
      });

      it('should prevent concurrent member mutations while mutating', () => {
        component.isMemberMutating.set(true);

        component.handleRemoveStudent(dummyStudents[0].id);

        expect(mockProjectApiService.removeStudent).not.toHaveBeenCalled();
      });

      it('should display error message when adding student API fails', () => {
        mockProjectApiService.addStudents?.mockReturnValue(
          throwError(() => ({ error: { message: 'Capacity exceeded' } }))
        );

        component.handleAddStudents([dummyStudents[1]]);

        expect(component.isMemberMutating()).toBe(false);
        expect(component.errorMessage()).toBe('Capacity exceeded');
      });
    });

    describe('Join Code Generation', () => {
      it('should successfully generate and update joinConfig signal', () => {
        const payload: GenerateJoinCodePayload = {
          maxUses: 50,
          startsAt: new Date().toISOString(),
          expiresAt: new Date('2026-11-30').toISOString(),
        };

        component.handleGenerateCode(payload);

        expect(mockProjectApiService.generateJoinCode).toHaveBeenCalledWith(dummyProject.id, payload);
        expect(component.joinConfig()).toEqual(dummyGeneratedConfig);
        expect(component.isSubmitting()).toBe(false);
      });

      it('should set error message when code generation fails', () => {
        mockProjectApiService.generateJoinCode?.mockReturnValue(
          throwError(() => ({ error: { message: 'Failed to generate code.' } }))
        );

        component.handleGenerateCode({ maxUses: 30, startsAt: '', expiresAt: '' });

        expect(component.isSubmitting()).toBe(false);
        expect(component.errorMessage()).toBe('Failed to generate code.');
      });
    });

    describe('Modal Close Synchronization Contract', () => {
      it('should close dialog without payload when no mutations occurred', () => {
        component.handleClose();

        expect(mockDialogRef.close).toHaveBeenCalledWith();
      });

      it('should close dialog with synchronized payload when state was mutated', () => {
        component.handleAddStudents([dummyStudents[1], dummyStudents[2]]);

        component.handleClose();

        expect(mockDialogRef.close).toHaveBeenCalledWith({
          joinedStudentIds: ['stu-002', 'stu-003', 'stu-001'],
          joinConfig: null,
        });
      });
    });
  });

  describe('Event Context Flow (Polymorphic Routing)', () => {
    const dummyEvent = createMockEventItem({
      type: EventFundingType.FACULTY,
      status: EventStatus.UPCOMING,
      startDate: new Date('2026-11-01').toISOString(),
      endDate: new Date('2026-11-02').toISOString(),
    })

    beforeEach(async () => {
      await setupTestBed({
        entity: dummyEvent,
        type: 'EVENT',
      });
    });

    it('should route student roster requests to EventApiService', () => {
      expect(mockEventApiService.getEventStudents).toHaveBeenCalledWith(dummyEvent.id);
      expect(mockProjectApiService.getProjectStudents).not.toHaveBeenCalled();
    });

    it('should route add student call to EventApiService', () => {
      component.handleAddStudents([dummyStudents[1]]);

      expect(mockEventApiService.addStudents).toHaveBeenCalledWith(dummyEvent.id, [dummyStudents[1].id]);
      expect(mockProjectApiService.addStudents).not.toHaveBeenCalled();
    });

    it('should route generate code call to EventApiService', () => {
      const payload: GenerateJoinCodePayload = {
        maxUses: 100,
        startsAt: new Date().toISOString(),
        expiresAt: new Date('2026-11-02').toISOString(),
      };

      component.handleGenerateCode(payload);

      expect(mockEventApiService.generateJoinCode).toHaveBeenCalledWith(dummyEvent.id, payload);
      expect(mockProjectApiService.generateJoinCode).not.toHaveBeenCalled();
    });
  });
});