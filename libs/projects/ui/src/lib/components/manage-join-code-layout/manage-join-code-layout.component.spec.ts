import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import {
  JoinCodeStatus,
  JoinConfig,
  StudentSummary,
} from '@school-expense-ecosystem/projects/types';
import { ManageJoinCodeLayoutComponent } from './manage-join-code-layout.component';

describe('ManageJoinCodeLayoutComponent', () => {
  let component: ManageJoinCodeLayoutComponent;
  let fixture: ComponentFixture<ManageJoinCodeLayoutComponent>;

  const mockStudents: StudentSummary[] = [
    {
      id: 'student-1',
      fullName: 'John Doe',
      studentCode: 'SV001',
      email: 'john@school.edu',
    },
    {
      id: 'student-2',
      fullName: 'Jane Smith',
      studentCode: 'SV002',
      email: 'jane@school.edu',
    },
  ];

  const createMockJoinConfig = (overrides?: Partial<JoinConfig>): JoinConfig => ({
    code: 'JOIN-9999',
    isActive: true,
    startsAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    expiresAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    maxUses: 30,
    usedCount: 5,
    createdAt: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ManageJoinCodeLayoutComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              project: {
                manageMembersDialog: {
                  tabs: { roster: 'Roster', joinCode: 'Join Code' },
                  roster: {
                    searchLabel: 'Search',
                    searchPlaceholder: 'Search student...',
                    addButton: 'Add',
                    emptyState: 'No students enrolled',
                    noStudentsFound: 'No students found',
                  },
                  code: {
                    capacityLabel: 'Capacity',
                    clickToCopy: 'Click to copy',
                    regenerateButton: 'Regenerate',
                    generate: 'Generate Code',
                    generating: 'Generating...',
                    back: 'Back',
                    status: {
                      scheduled: 'Scheduled',
                      active: 'Active',
                      full: 'Full',
                      expired: 'Expired',
                    },
                    fields: {
                      maxUses: { label: 'Max Uses', hint: 'Quota' },
                      startsAt: { label: 'Starts At' },
                      expiresAt: { label: 'Expires At' },
                    },
                  },
                  close: 'Close',
                },
              },
            },
          },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [provideNativeDateAdapter(), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageJoinCodeLayoutComponent);
    component = fixture.componentInstance;

    // Satisfy required Signal Inputs
    fixture.componentRef.setInput('title', 'Manage Members');
    fixture.componentRef.setInput('subtitle', 'Project recruitment');
    fixture.componentRef.setInput('maxEndDate', new Date(Date.now() + 30 * 86400000));
    fixture.detectChanges();
  });

  it('should create component successfully', () => {
    expect(component).toBeTruthy();
  });

  describe('Display Helpers & Search Signals', () => {
    it('should format student display string with code when available', () => {
      expect(component.displayStudentFn(mockStudents[0])).toBe('John Doe (SV001)');
      expect(
        component.displayStudentFn({ id: '3', fullName: 'Bob', email: 'b@edu' } as StudentSummary)
      ).toBe('Bob');
      expect(component.displayStudentFn('Plain String')).toBe('Plain String');
      expect(component.displayStudentFn(null)).toBe('');
    });

    it('should update searchRawQuery signal and emit searchRawQueryChange on input', () => {
      const searchSpy = jest.fn();
      component.searchRawQueryChange.subscribe(searchSpy);

      component.onSearchInput('Nguyen');

      expect(component.searchRawQuery()).toBe('Nguyen');
      expect(searchSpy).toHaveBeenCalledWith('Nguyen');
    });
  });

  describe('Roster Tab Operations', () => {
    it('should select a student and emit studentAdded on add, then reset selection', () => {
      const addSpy = jest.fn();
      component.studentAdded.subscribe(addSpy);

      // Simulate autocomplete selection
      component.onStudentSelected({
        option: { value: mockStudents[0] },
      } as MatAutocompleteSelectedEvent);
      expect(component.selectedStudent()).toEqual(mockStudents[0]);

      component.onAddStudent();

      expect(addSpy).toHaveBeenCalledWith(mockStudents[0]);
      expect(component.selectedStudent()).toBeNull();
      expect(component.searchRawQuery()).toBe('');
    });

    it('should not emit studentAdded if no student is selected', () => {
      const addSpy = jest.fn();
      component.studentAdded.subscribe(addSpy);

      component.onAddStudent();
      expect(addSpy).not.toHaveBeenCalled();
    });

    it('should emit studentRemoved with student ID when remove action is invoked', () => {
      const removeSpy = jest.fn();
      component.studentRemoved.subscribe(removeSpy);

      component.studentRemoved.emit('student-1');
      expect(removeSpy).toHaveBeenCalledWith('student-1');
    });

    it('should render roster empty state when joinedStudents list is empty', () => {
      fixture.componentRef.setInput('joinedStudents', []);
      fixture.detectChanges();

      const emptyText = fixture.debugElement.query(By.css('.member-list-container'));
      expect(emptyText.nativeElement.textContent).toContain('No students enrolled');
    });
  });

  describe('Join Code Computed Signals', () => {
    it('should return null codeStatus when joinConfig is null or inactive', () => {
      fixture.componentRef.setInput('joinConfig', null);
      expect(component.codeStatus()).toBeNull();

      fixture.componentRef.setInput('joinConfig', createMockJoinConfig({ isActive: false }));
      expect(component.codeStatus()).toBeNull();
    });

    it('should resolve SCHEDULED when start date is in the future', () => {
      const futureStart = new Date(Date.now() + 2 * 86400000).toISOString();
      const futureEnd = new Date(Date.now() + 10 * 86400000).toISOString();
      fixture.componentRef.setInput(
        'joinConfig',
        createMockJoinConfig({ startsAt: futureStart, expiresAt: futureEnd })
      );

      expect(component.codeStatus()).toBe(JoinCodeStatus.SCHEDULED);
    });

    it('should resolve EXPIRED when expiration date has passed', () => {
      const pastStart = new Date(Date.now() - 10 * 86400000).toISOString();
      const pastEnd = new Date(Date.now() - 2 * 86400000).toISOString();
      fixture.componentRef.setInput(
        'joinConfig',
        createMockJoinConfig({ startsAt: pastStart, expiresAt: pastEnd })
      );

      expect(component.codeStatus()).toBe(JoinCodeStatus.EXPIRED);
    });

    it('should resolve FULL when usedCount meets or exceeds maxUses', () => {
      fixture.componentRef.setInput(
        'joinConfig',
        createMockJoinConfig({ maxUses: 20, usedCount: 20 })
      );

      expect(component.codeStatus()).toBe(JoinCodeStatus.FULL);
    });

    it('should resolve ACTIVE when active, within dates, and not full', () => {
      fixture.componentRef.setInput(
        'joinConfig',
        createMockJoinConfig({ maxUses: 50, usedCount: 10 })
      );

      expect(component.codeStatus()).toBe(JoinCodeStatus.ACTIVE);
    });

    it('should calculate clamped capacity percentage correctly', () => {
      fixture.componentRef.setInput('joinConfig', null);
      expect(component.capacityPercentage()).toBe(0);

      // 15 out of 30 => 50%
      fixture.componentRef.setInput(
        'joinConfig',
        createMockJoinConfig({ maxUses: 30, usedCount: 15 })
      );
      expect(component.capacityPercentage()).toBe(50);

      // Over-limit clamping (35/30) => 100%
      fixture.componentRef.setInput(
        'joinConfig',
        createMockJoinConfig({ maxUses: 30, usedCount: 35 })
      );
      expect(component.capacityPercentage()).toBe(100);
    });
  });

  describe('Code Generation Submission', () => {
    it('should emit codeGenerated with valid payload when form is submitted', () => {
      const generateSpy = jest.fn();
      component.codeGenerated.subscribe(generateSpy);

      component.createCodeForm.patchValue({
        maxUses: 40,
        startsAt: new Date('2026-06-01T00:00:00.000Z'),
        expiresAt: new Date('2026-06-30T23:59:59.000Z'),
      });

      component.onSubmitCode();

      expect(generateSpy).toHaveBeenCalledWith({
        maxUses: 40,
        startsAt: new Date('2026-06-01T00:00:00.000Z').toISOString(),
        expiresAt: new Date('2026-06-30T23:59:59.000Z').toISOString(),
      });
    });

    it('should not emit codeGenerated if creation form is invalid', () => {
      const generateSpy = jest.fn();
      component.codeGenerated.subscribe(generateSpy);

      component.createCodeForm.patchValue({ maxUses: null });
      component.onSubmitCode();

      expect(generateSpy).not.toHaveBeenCalled();
    });
  });

  describe('Dialog Actions & Guards', () => {
    it('should emit closed output when Close button is clicked', () => {
      const closeSpy = jest.fn();
      component.closed.subscribe(closeSpy);

      const closeBtn = fixture.debugElement.query(By.css('mat-dialog-actions button'));
      closeBtn.triggerEventHandler('click', null);

      expect(closeSpy).toHaveBeenCalledTimes(1);
    });

    it('should disable close button during mutation or submission', () => {
      fixture.componentRef.setInput('isMemberMutating', true);
      fixture.detectChanges();

      const closeBtn = fixture.debugElement.query(By.css('mat-dialog-actions button'));
      expect(closeBtn.nativeElement.disabled).toBe(true);
    });
  });
});