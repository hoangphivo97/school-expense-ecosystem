import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FacultyId, OnboardingData, UserType } from '@school-expense-ecosystem/auth/types';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinner, MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService, AuthSignalStore } from '@school-expense-ecosystem/auth/data-access';
import { ErrorModalService } from '@school-expense-ecosystem/shared/ui';

@Component({
  selector: 'lib-onboarding',
  imports: [ReactiveFormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatProgressSpinner
  ],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class OnboardingComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router)
  private readonly authStore = inject(AuthSignalStore)
  private readonly errorModalService = inject(ErrorModalService)
  
  onboardingForm!: FormGroup;

  faculties = Object.values(FacultyId);
  userTypes = Object.values(UserType);

  facultyLabels: Record<FacultyId, string> = {
    [FacultyId.FIT]: 'Faculty of Information Technology (FIT)',
    [FacultyId.FBE]: 'Faculty of Business Administration (FBE)',
    [FacultyId.FLL]: 'Faculty of Foreign Languages (FLL)',
  };

  userTypeLabels: Record<UserType, string> = {
    [UserType.STUDENT]: 'Student',
    [UserType.TEACHER]: 'Teacher',
    [UserType.STAFF]: 'School Staff',
  };

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.onboardingForm = this.fb.group({
      fullName: [
        '',
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(12),
          Validators.pattern(/^[a-zA-Z\u4e00-\u9fff\s]*$/)
        ]
      ],
      facultyId: ['', Validators.required],
      userType: ['', Validators.required],
      userCode: ['', Validators.required],
      dateOfBirth: ['', Validators.required]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.onboardingForm.invalid) {
      this.onboardingForm.markAllAsTouched();
      return;
    }
    const formData: OnboardingData = { ...this.onboardingForm.getRawValue() };

    try {
      const response = await this.authService.completeOnboarding(formData);
      this.authStore.updateAuthState(response.token, response.user);
      this.router.navigate(['/auth/waiting-approval']);
    } catch (err: any) {
      console.error('Onboarding operational database mutation failure:', err);
      this.errorModalService.openErrorModal(err);
    }
  }
}
