import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FacultyId, OnboardingData, UserType } from '@school-expense-ecosystem/auth/types';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService, AuthSignalStore } from '@school-expense-ecosystem/auth/data-access';
import { catchError, tap, throwError } from 'rxjs';

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
    MatProgressSpinnerModule],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class OnboardingComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router)
  private readonly authStore = inject(AuthSignalStore)

  loading = false;
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

  onSubmit(): void {
    if (this.onboardingForm.invalid) {
      this.onboardingForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    const formData : OnboardingData = { ...this.onboardingForm.value };

    this.authService.completeOnboarding(formData)
      .pipe(
        tap((response) => {
          this.loading = false;

          this.authStore.updateAuthState(response.token)
          
          this.router.navigate(['/auth/waiting-approval']);
        }),
        catchError((err) => {
          this.loading = false;
          console.error('Onboarding submission handling failed:', err);
          return throwError(() => err);
        })
      )
      .subscribe();
  }
}
