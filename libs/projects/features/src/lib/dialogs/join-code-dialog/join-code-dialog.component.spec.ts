import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JoinCodeDialogComponent } from './join-code-dialog.component';
import { JoinCodeDialogData, JoinCodeDialogResult } from '@school-expense-ecosystem/projects/types';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EventApiService, ProjectApiService } from '@school-expense-ecosystem/projects/data-access';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

describe('JoinCodeDialogComponent', () => {
  let component: JoinCodeDialogComponent;
  let fixture: ComponentFixture<JoinCodeDialogComponent>;

  const mockDialogRef = {
    close: jest.fn(),
  };

  const mockProjectApiService = {
    joinProjectByCode: jest.fn(),
  };

  const mockEventApiService = {
    joinByCode: jest.fn(),
  };

  const defaultDialogData: JoinCodeDialogData = {
    context: 'PROJECT',
  };

  const configureTestBed = async (dialogData: JoinCodeDialogData = defaultDialogData) => {
    jest.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [
        JoinCodeDialogComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { defaultLang: 'en', availableLangs: ['en'] },
        }),
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: ProjectApiService, useValue: mockProjectApiService },
        { provide: EventApiService, useValue: mockEventApiService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JoinCodeDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  };

  describe('Initialization & Display Context', () => {
    it('should create component instance successfully', async () => {
      await configureTestBed();
      expect(component).toBeTruthy();
    });

    it('should configure metadata for PROJECT context', async () => {
      await configureTestBed({ context: 'PROJECT' });
      expect(component.contextMeta()).toEqual({
        icon: 'folder_special',
        translocoKey: 'shared.joinDialog.project',
      });
    });

    it('should configure metadata for EVENT context', async () => {
      await configureTestBed({ context: 'EVENT' });
      expect(component.contextMeta()).toEqual({
        icon: 'event_available',
        translocoKey: 'shared.joinDialog.event',
      });
    });
  });

  describe('Signal Form Interaction & Validation', () => {
    beforeEach(async () => {
      await configureTestBed();
    });

    it('should sanitize input by uppercasing and stripping whitespace', () => {
      const mockEvent = {
        target: { value: ' prj- 9821 ' },
      } as unknown as Event;

      component.onCodeInput(mockEvent);

      expect(component.joinForm.code().value()).toBe('PRJ-9821');
    });

    it('should report invalid form when code is empty or under 6 characters', () => {
      component.joinForm.code().value.set('');
      expect(component.joinForm().invalid()).toBe(true);

      component.joinForm.code().value.set('12345');
      expect(component.joinForm().invalid()).toBe(true);
    });

    it('should report valid form when code satisfies length constraints (6 - 12 chars)', () => {
      component.joinForm.code().value.set('VALID123');
      expect(component.joinForm().valid()).toBe(true);
    });
  });

  describe('Dialog Actions & API Delegation', () => {
    it('should close dialog with success: false on cancel', async () => {
      await configureTestBed({ context: 'PROJECT' });

      component.onCancel();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        success: false,
        context: 'PROJECT',
      });
    });

    it('should not trigger API if form is invalid or already submitting', async () => {
      await configureTestBed();
      component.joinForm.code().value.set(''); // Invalid code

      component.onSubmit();

      expect(mockProjectApiService.joinProjectByCode).not.toHaveBeenCalled();
      expect(mockEventApiService.joinByCode).not.toHaveBeenCalled();
    });

    it('should call ProjectApiService and close dialog on PROJECT success', async () => {
      await configureTestBed({ context: 'PROJECT' });
      const mockProject = { id: 'prj-uuid-123' };
      mockProjectApiService.joinProjectByCode.mockReturnValue(of(mockProject));

      component.joinForm.code().value.set('PRJ-9821');
      component.onSubmit();

      expect(component.isSubmitting()).toBe(false);
      expect(mockProjectApiService.joinProjectByCode).toHaveBeenCalledWith({ code: 'PRJ-9821' });
      expect(mockDialogRef.close).toHaveBeenCalledWith<[JoinCodeDialogResult]>({
        success: true,
        context: 'PROJECT',
        entityId: 'prj-uuid-123',
      });
    });

    it('should call EventApiService and close dialog on EVENT success', async () => {
      await configureTestBed({ context: 'EVENT' });
      const mockEvent = { id: 'evt-uuid-456' };
      mockEventApiService.joinByCode.mockReturnValue(of(mockEvent));

      component.joinForm.code().value.set('EVT-5566');
      component.onSubmit();

      expect(component.isSubmitting()).toBe(false);
      expect(mockEventApiService.joinByCode).toHaveBeenCalledWith({ code: 'EVT-5566' });
      expect(mockDialogRef.close).toHaveBeenCalledWith<[JoinCodeDialogResult]>({
        success: true,
        context: 'EVENT',
        entityId: 'evt-uuid-456',
      });
    });

    it('should set errorMessage and stop loading when API returns an HttpErrorResponse', async () => {
      await configureTestBed({ context: 'PROJECT' });
      const errorResponse = new HttpErrorResponse({
        error: { errorMsg: 'Join code has expired' },
        status: 400,
        statusText: 'Bad Request',
      });
      mockProjectApiService.joinProjectByCode.mockReturnValue(throwError(() => errorResponse));

      component.joinForm.code().value.set('EXPIRED-CODE');
      component.onSubmit();

      expect(component.isSubmitting()).toBe(false);
      expect(component.errorMessage()).toBe('Join code has expired');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });
});
