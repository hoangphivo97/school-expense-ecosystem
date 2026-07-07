import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OnboardingComponent } from './onboarding.component';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AuthService } from '@school-expense-ecosystem/auth/data-access';
import { ErrorModalService } from '@school-expense-ecosystem/shared/ui';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { FacultyId, UserType } from '@school-expense-ecosystem/shared/types';

describe('Onboarding', () => {
  let component: OnboardingComponent;
  let fixture: ComponentFixture<OnboardingComponent>;

  const mockRouter = {
    navigate: jest.fn()
  };

  const mockAuthService = {
    completeOnboarding: jest.fn<(formData: any) => Promise<any>>(),
    isOnboardingSubmitting: jest.fn(() => false)
  };

  const mockAuthStore = {
    updateAuthState: jest.fn()
  };

  const mockErrorModalService = {
    openErrorModal: jest.fn()
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [
        OnboardingComponent, 
        ReactiveFormsModule, 
        NoopAnimationsModule
      ],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService },
        { provide: AuthSignalStore, useValue: mockAuthStore },
        { provide: ErrorModalService, useValue: mockErrorModalService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); 
    await fixture.whenStable();
  });

  it('should create component and initialize form with empty values', () => {
    expect(component).toBeTruthy();
    expect(component.onboardingForm).toBeDefined();
    expect(component.onboardingForm.get('fullName')?.value).toBe('');
    expect(component.onboardingForm.invalid).toBe(true); 
  });

  describe('Form Validation Logic', () => {
    it('should validate fullName minLength and maxLength rules', () => {
      const fullNameControl = component.onboardingForm.get('fullName');

      fullNameControl?.setValue('');
      expect(fullNameControl?.hasError('required')).toBe(true);

      fullNameControl?.setValue('Phi');
      expect(fullNameControl?.hasError('minlength')).toBe(true);

      fullNameControl?.setValue('Nguyen Phi');
      expect(fullNameControl?.valid).toBe(true);

      fullNameControl?.setValue('Nguyen Hoang Phi Long');
      expect(fullNameControl?.hasError('maxlength')).toBe(true);
    });

    it('should validate fullName regex pattern (only English, unaccented Vietnamese, or Chinese characters)', () => {
      const fullNameControl = component.onboardingForm.get('fullName');

      fullNameControl?.setValue('Nguyễn Phi');
      expect(fullNameControl?.hasError('pattern')).toBe(true);

      fullNameControl?.setValue('Phi1997!');
      expect(fullNameControl?.hasError('pattern')).toBe(true);

      fullNameControl?.setValue('王伟');
      expect(fullNameControl?.hasError('pattern')).toBe(false);
    });

    it('should require all institutional fields', () => {
      const form = component.onboardingForm;
      
      expect(form.get('facultyId')?.hasError('required')).toBe(true);
      expect(form.get('userType')?.hasError('required')).toBe(true);
      expect(form.get('userCode')?.hasError('required')).toBe(true);
      expect(form.get('dateOfBirth')?.hasError('required')).toBe(true);
    });
  });

  describe('Form Submission Behavior', () => {
    const validFormData = {
      fullName: 'Hoang Phi',
      facultyId: FacultyId.FIT,
      userType: UserType.STUDENT,
      userCode: 'FIT97001',
      dateOfBirth: '1997-01-11'
    };

    it('should mark all fields as touched and stop submission if form is invalid', async () => {
      const spyMarkAllAsTouched = jest.spyOn(component.onboardingForm, 'markAllAsTouched');
      
      component.onboardingForm.setValue({
        fullName: '', // Invalid
        facultyId: '',
        userType: '',
        userCode: '',
        dateOfBirth: ''
      });

      await component.onSubmit();

      expect(spyMarkAllAsTouched).toHaveBeenCalled();
      expect(mockAuthService.completeOnboarding).not.toHaveBeenCalled();
    });

    it('should complete onboarding successfully, update auth store, and navigate away', async () => {
      const mockResponse = { token: 'mock-jwt-token', user: { id: '1', name: 'Hoang Phi' } };
      mockAuthService.completeOnboarding.mockResolvedValue(mockResponse);

      component.onboardingForm.setValue(validFormData);
      expect(component.onboardingForm.valid).toBe(true);

      await component.onSubmit();

      expect(mockAuthService.completeOnboarding).toHaveBeenCalledWith(validFormData);
      expect(mockAuthStore.updateAuthState).toHaveBeenCalledWith(mockResponse.token, mockResponse.user);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/waiting-approval']);
    });

    it('should catch operational mutation failures and open error modal', async () => {
      const mockError = new Error('Database connection timeout');
      mockAuthService.completeOnboarding.mockRejectedValue(mockError);

      component.onboardingForm.setValue(validFormData);

      await component.onSubmit();

      expect(mockAuthService.completeOnboarding).toHaveBeenCalled();
      expect(mockAuthStore.updateAuthState).not.toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(mockErrorModalService.openErrorModal).toHaveBeenCalledWith(mockError);
    });
  });
});