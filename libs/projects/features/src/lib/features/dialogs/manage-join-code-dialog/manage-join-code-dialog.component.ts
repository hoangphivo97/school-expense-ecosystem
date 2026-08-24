import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { ProjectApiService } from '@school-expense-ecosystem/projects/data-access';
import { GenerateJoinCodePayload, Project, ProjectJoinConfig, StudentSummary } from '@school-expense-ecosystem/projects/types';
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
import {MatAutocompleteModule, MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import { of } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface ManageJoinCodeDialogData {
  project: Project;
}

export interface ManageJoinCodeDialogResult {
  joinedStudentIds: string[];
  joinConfig: ProjectJoinConfig | null;
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
export class ManageJoinCodeDialogComponent implements OnInit{
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

  // State Signals
  readonly joinedStudents = signal<StudentSummary[]>([]);

  readonly joinConfig = signal<ProjectJoinConfig | null>(this.data.project.joinConfig ?? null);
  readonly isCreatingNew = signal<boolean>(!this.data.project.joinConfig);

  readonly minDate = new Date();
  readonly maxDate = new Date(this.data.project.endDate);

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


  readonly isExpired = computed(() => {
    const config = this.joinConfig();
    return config ? new Date(config.expiresAt) < new Date() : false;
  });

  readonly isFullCapacity = computed(() => {
    const config = this.joinConfig();
    return config ? this.joinedStudents().length >= config.maxUses : false;
  });

  readonly capacityPercentage = computed(() => {
    const config = this.joinConfig();
    if (!config || config.maxUses === 0) return 0;
    return Math.min(Math.round((this.joinedStudents().length / config.maxUses) * 100), 100);
  });

  // Forms
  readonly studentForm: FormGroup = this.fb.group({
    studentId: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
  });

  readonly form: FormGroup = this.fb.group({
    maxUses: [30, [Validators.required, Validators.min(1), Validators.max(200)]],
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
    return nextWeek > this.maxDate ? this.maxDate : nextWeek;
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
        // Prepend or append full StudentSummary object into local state
        this.joinedStudents.update((list) => [student, ...list]);
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
    if (this.form.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload: GenerateJoinCodePayload = {
      maxUses: Number(this.form.get('maxUses')?.value),
      expiresAt: new Date(this.form.get('expiresAt')?.value).toISOString(),
    };

    this.projectApiService.generateJoinCode(this.data.project.id, payload).subscribe({
      next: (newConfig) => {
        this.isSubmitting.set(false);
        this.joinConfig.set(newConfig);
        this.isCreatingNew.set(false);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.errorMsg || err?.error?.message || 'Failed to generate invitation code.');
      },
    });
  }

  onClose(): void {
    this.dialogRef.close({
      joinedStudentIds: this.joinedStudents(),
      joinConfig: this.joinConfig(),
    });
  }
}