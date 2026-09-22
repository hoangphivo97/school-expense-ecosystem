import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { EventApiService, ProjectApiService } from '@school-expense-ecosystem/projects/data-access';
import {
  EventFundingType,
  EventItem,
  EventStatus,
  GenerateJoinCodePayload,
  JoinConfig,
  ProjectFundingType,
  ProjectItem,
  ProjectStatus,
  StudentSummary,
} from '@school-expense-ecosystem/projects/types';
import { FacultyId } from '@school-expense-ecosystem/shared/types';
import {
  ManageJoinCodeDialogComponent,
  ManageJoinCodeDialogData,
  ManageJoinCodeDialogResult,
} from './manage-join-code-dialog.component';

describe('ManageJoinCodeDialogComponent', () => {
  let component: ManageJoinCodeDialogComponent;
  let fixture: ComponentFixture<ManageJoinCodeDialogComponent>;

  let mockDialogRef: jest.Mocked<Partial<MatDialogRef<ManageJoinCodeDialogComponent, ManageJoinCodeDialogResult>>>;
  let mockProjectApiService: { [K in keyof ProjectApiService]?: jest.Mock };
  let mockEventApiService: { [K in keyof EventApiService]?: jest.Mock };

  const dummyStudent1: StudentSummary = {
    id: 'stu-001',
    studentCode: 'B18DCCN001',
    fullName: 'Nguyen Van A',
    email: 'a.nguyen@school.edu',
  };

  const dummyStudent2: StudentSummary = {
    id: 'stu-002',
    studentCode: 'B18DCCN002',
    fullName: 'Tran Thi B',
    email: 'b.tran@school.edu',
  };

  const dummyProject: ProjectItem = {
    id: 'PRJ-FIT-001',
    name: 'AI Research Platform',
    type: ProjectFundingType.FACULTY,
    status: ProjectStatus.ACTIVE,
    facultyId: FacultyId.FIT,
    budgetCap: 20000000,
    initialSpent: 0,
    currentSpent: 0,
    mentorId: 'mentor-01',
    joinedStudentIds: ['stu-001'],
    startDate: new Date('2026-11-01').toISOString(),
    endDate: new Date('2026-11-30').toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    joinConfig: null,
  };

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
      getProjectStudents: jest.fn().mockReturnValue(of([dummyStudent1])),
      addStudents: jest.fn().mockReturnValue(of({ success: true })),
      removeStudent: jest.fn().mockReturnValue(of({ success: true })),
      generateJoinCode: jest.fn().mockReturnValue(of(dummyGeneratedConfig)),
      searchStudents: jest.fn().mockReturnValue(of([])),
    };

    mockEventApiService = {
      getEventStudents: jest.fn().mockReturnValue(of([dummyStudent1])),
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
      expect(component.joinedStudents()).toEqual([dummyStudent1]);
      expect(component.isLoadingRoster()).toBe(false);
    });

    describe('Member Roster Mutation', () => {
      it('should add a student and update joinedStudents signal', () => {
        component.handleAddStudent(dummyStudent2);

        expect(mockProjectApiService.addStudents).toHaveBeenCalledWith(dummyProject.id, [dummyStudent2.id]);
        expect(component.joinedStudents()).toEqual([dummyStudent2, dummyStudent1]);
        expect(component.isMemberMutating()).toBe(false);
        expect(component.errorMessage()).toBeNull();
      });

      it('should guard against adding already enrolled student', () => {
        component.handleAddStudent(dummyStudent1);

        expect(mockProjectApiService.addStudents).not.toHaveBeenCalled();
        expect(component.errorMessage()).toBe('Student is already enrolled.');
      });

      it('should remove a student and update joinedStudents signal', () => {
        component.handleRemoveStudent(dummyStudent1.id);

        expect(mockProjectApiService.removeStudent).toHaveBeenCalledWith(dummyProject.id, dummyStudent1.id);
        expect(component.joinedStudents()).toEqual([]);
        expect(component.isMemberMutating()).toBe(false);
      });

      it('should prevent concurrent member mutations while mutating', () => {
        component.isMemberMutating.set(true);

        component.handleRemoveStudent(dummyStudent1.id);

        expect(mockProjectApiService.removeStudent).not.toHaveBeenCalled();
      });

      it('should display error message when adding student API fails', () => {
        mockProjectApiService.addStudents?.mockReturnValue(
          throwError(() => ({ error: { message: 'Capacity exceeded' } }))
        );

        component.handleAddStudent(dummyStudent2);

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
        component.handleAddStudent(dummyStudent2);

        component.handleClose();

        expect(mockDialogRef.close).toHaveBeenCalledWith({
          joinedStudentIds: ['stu-002', 'stu-001'],
          joinConfig: null,
        });
      });
    });
  });

  describe('Event Context Flow (Polymorphic Routing)', () => {
    const dummyEvent: EventItem = {
      id: 'EVT-FIT-001',
      name: 'Hackathon 2026',
      type: EventFundingType.FACULTY,
      status: EventStatus.UPCOMING,
      facultyId: FacultyId.FIT,
      budgetCap: 5000000,
      initialSpent: 0,
      currentSpent: 0,
      organizerId: 'teacher-01',
      joinedStudentIds: ['stu-001'],
      startDate: new Date('2026-11-01').toISOString(),
      endDate: new Date('2026-11-02').toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      joinConfig: null,
    };

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
      component.handleAddStudent(dummyStudent2);

      expect(mockEventApiService.addStudents).toHaveBeenCalledWith(dummyEvent.id, [dummyStudent2.id]);
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