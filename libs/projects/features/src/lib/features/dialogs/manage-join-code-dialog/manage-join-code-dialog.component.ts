import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { ProjectApiService } from '@school-expense-ecosystem/projects/data-access';
import { GenerateJoinCodePayload, ProjectItem, JoinConfig, StudentSummary, JoinCodeStatus } from '@school-expense-ecosystem/projects/types';
import { CopyToClipboardDirective, FormErrorPipe } from '@school-expense-ecosystem/shared/ui';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { toDebouncedSignal } from '@school-expense-ecosystem/shared/utils-frontend';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { of } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface ManageJoinCodeDialogData {
  project: ProjectItem;
}

export interface ManageJoinCodeDialogResult {
  joinedStudentIds: string[];
  joinConfig: JoinConfig | null;
}

@Component({
  selector: 'lib-manage-join-code-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatTabsModule,
    ReactiveFormsModule,
    TranslocoModule,
    FormErrorPipe,
    CopyToClipboardDirective,
    DatePipe,
    MatAutocompleteModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './manage-join-code-dialog.component.html',
  styleUrl: './manage-join-code-dialog.component.scss',
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    { provide: TRANSLOCO_SCOPE, useValue: 'project' },
  ],
})
export class ManageJoinCodeDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ManageJoinCodeDialogComponent, ManageJoinCodeDialogResult>);
  private readonly projectApiService = inject(ProjectApiService);
  readonly data = inject<ManageJoinCodeDialogData>(MAT_DIALOG_DATA);
  readonly searchRawQuery = signal<string>('');
  readonly debouncedQuery = toDebouncedSignal(this.searchRawQuery, 300);

  readonly isSubmitting = signal<boolean>(false);
  readonly isMemberMutating = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedStudent = signal<StudentSummary | null>(null);
  readonly isLoadingRoster = signal<boolean>(true);
  private readonly hasMutated = signal<boolean>(false);

  // State Signals
  readonly joinedStudents = signal<StudentSummary[]>([]);

  readonly joinConfig = signal<JoinConfig | null>(this.data.project.joinConfig ?? null);
  readonly isCreatingNew = signal<boolean>(!this.data.project.joinConfig);

  readonly minStartDate = new Date();
  readonly maxEndDate = new Date(this.data.project.endDate);

  readonly studentsResource = rxResource({
    params: () => this.debouncedQuery().trim(),
    stream: ({ params: query }) => {
      if (!query || query.length < 2) {
        return of([]);
      }
      return this.projectApiService.searchStudents(query);
    },
    defaultValue: [] as StudentSummary[],
  });

  readonly codeStatus = computed<JoinCodeStatus | null>(() => {
    const config = this.joinConfig();
    if (!config || !config.isActive) return null;

    const now = new Date();

    if (config.startsAt && now < new Date(config.startsAt)) {
      return JoinCodeStatus.SCHEDULED;
    }

    if (config.expiresAt && now > new Date(config.expiresAt)) {
      return JoinCodeStatus.EXPIRED;
    }

    if (config.maxUses && (config.usedCount ?? this.joinedStudents().length) >= config.maxUses) {
      return JoinCodeStatus.FULL;
    }

    return JoinCodeStatus.ACTIVE;
  });


  readonly isExpired = computed(() => this.codeStatus() === JoinCodeStatus.EXPIRED);

  readonly isFullCapacity = computed(() => this.codeStatus() === JoinCodeStatus.FULL);

  readonly capacityPercentage = computed(() => {
    const config = this.joinConfig();
    if (!config?.maxUses || config.maxUses === 0) return 0;

    const currentUsed = config.usedCount ?? this.joinedStudents().length;
    return Math.min(Math.round((currentUsed / config.maxUses) * 100), 100);
  });

  // Forms
  readonly studentForm: FormGroup = this.fb.group({
    studentId: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
  });

  readonly createCodeForm: FormGroup = this.fb.group({
    maxUses: [30, [Validators.required, Validators.min(1)]],
    startsAt: [new Date(), [Validators.required]],
    expiresAt: [this.getDefaultExpiryDate(), [Validators.required]],
  });

  ngOnInit(): void {
    this.loadProjectRoster();
  }

  private loadProjectRoster(): void {
    const studentIds = this.data.project.joinedStudentIds ?? [];

    if (studentIds.length === 0) {
      this.joinedStudents.set([]);
      this.isLoadingRoster.set(false);
      return;
    }

    this.isLoadingRoster.set(true);
    this.projectApiService.getProjectStudents(this.data.project.id).subscribe({
      next: (students) => {
        this.joinedStudents.set(students);
        this.isLoadingRoster.set(false);
      },
      error: () => {
        this.isLoadingRoster.set(false);
      },
    });
  }

  private getDefaultExpiryDate(): Date {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek > this.maxEndDate ? this.maxEndDate : nextWeek;
  }

  // Member Management Operations
  onAddStudent(): void {
    const student = this.selectedStudent();
    if (!student || this.isMemberMutating()) return;

    if (this.joinedStudents().some((s) => s.id === student.id)) {
      this.errorMessage.set('Student is already enrolled in this project.');
      return;
    }

    this.isMemberMutating.set(true);
    this.errorMessage.set(null);

    this.projectApiService.addStudents(this.data.project.id, [student.id]).subscribe({
      next: () => {
        this.isMemberMutating.set(false);
        this.joinedStudents.update((list) => [student, ...list]);
        this.hasMutated.set(true);
        this.searchRawQuery.set('');
        this.selectedStudent.set(null);
      },
      error: (err) => {
        this.isMemberMutating.set(false);
        this.errorMessage.set(err?.error?.errorMsg || err?.error?.message || 'Failed to add student.');
      },
    });
  }

  displayStudentFn(student: StudentSummary | string | null): string {
    if (!student) return '';
    if (typeof student === 'string') return student;
    return student.studentCode ? `${student.fullName} (${student.studentCode})` : student.fullName;
  }

  onStudentSelected(event: MatAutocompleteSelectedEvent): void {
    const student = event.option.value as StudentSummary;
    this.selectedStudent.set(student);
  }

  onRemoveStudent(studentId: string): void {
    if (this.isMemberMutating()) return;

    this.isMemberMutating.set(true);
    this.errorMessage.set(null);

    this.projectApiService.removeStudent(this.data.project.id, studentId).subscribe({
      next: () => {
        this.isMemberMutating.set(false);
        this.joinedStudents.update((list) => list.filter((s) => s.id !== studentId));
        this.hasMutated.set(true); // Mark as dirty
      },
      error: (err) => {
        this.isMemberMutating.set(false);
        this.errorMessage.set(err?.error?.errorMsg || err?.error?.message || 'Failed to remove student.');
      },
    });
  }

  // Join Code Operations
  toggleCreateMode(isCreating: boolean): void {
    this.isCreatingNew.set(isCreating);
    this.errorMessage.set(null);
  }

  onSubmitCode(): void {
    if (this.createCodeForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload: GenerateJoinCodePayload = {
      maxUses: Number(this.createCodeForm.get('maxUses')?.value),
      startsAt: new Date(this.createCodeForm.get('startsAt')?.value).toISOString(),
      expiresAt: new Date(this.createCodeForm.get('expiresAt')?.value).toISOString(),
    };

    this.projectApiService.generateJoinCode(this.data.project.id, payload).subscribe({
      next: (newConfig) => {
        this.isSubmitting.set(false);
        this.joinConfig.set(newConfig);
        this.isCreatingNew.set(false);
        this.hasMutated.set(true); // Mark as dirty
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.errorMsg || err?.error?.message || 'Failed to generate invitation code.');
      },
    });
  }

  onClose(): void {
    if (this.hasMutated()) {
      this.dialogRef.close({
        joinedStudentIds: this.joinedStudents().map((s) => s.id),
        joinConfig: this.joinConfig(),
      });
    } else {
      this.dialogRef.close(); // Returns undefined/void -> No reload triggered
    }
  }
}