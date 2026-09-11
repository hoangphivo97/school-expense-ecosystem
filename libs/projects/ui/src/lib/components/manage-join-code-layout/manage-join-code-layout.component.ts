import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { CopyToClipboardDirective, FormErrorPipe } from '@school-expense-ecosystem/shared/ui';
import {
  GenerateJoinCodePayload,
  JoinCodeStatus,
  JoinConfig,
  StudentSummary,
} from '@school-expense-ecosystem/projects/types';

@Component({
  selector: 'lib-manage-join-code-layout',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatTabsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    TranslocoModule,
    CopyToClipboardDirective,
    FormErrorPipe,
  ],
  templateUrl: './manage-join-code-layout.component.html',
  styleUrl: './manage-join-code-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'project' }],
})
export class ManageJoinCodeLayoutComponent {
  private readonly fb = inject(FormBuilder);

  // Inputs
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly maxEndDate = input.required<Date>();
  readonly joinConfig = input<JoinConfig | null>(null);
  readonly joinedStudents = input<StudentSummary[]>([]);
  readonly searchResults = input<StudentSummary[]>([]);
  readonly isSearching = input<boolean>(false);
  readonly isLoadingRoster = input<boolean>(false);
  readonly isMemberMutating = input<boolean>(false);
  readonly isSubmitting = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);

  // Outputs
  readonly searchRawQueryChange = output<string>();
  readonly studentAdded = output<StudentSummary>();
  readonly studentRemoved = output<string>();
  readonly codeGenerated = output<GenerateJoinCodePayload>();
  readonly closed = output<void>();

  // Internal Form & Local Signals
  readonly searchRawQuery = signal<string>('');
  readonly selectedStudent = signal<StudentSummary | null>(null);
  readonly isCreatingNew = signal<boolean>(false);
  readonly minStartDate = new Date();

  readonly codeStatus = computed<JoinCodeStatus | null>(() => {
    const config = this.joinConfig();
    if (!config || !config.isActive) return null;

    const now = new Date();
    if (config.startsAt && now < new Date(config.startsAt)) return JoinCodeStatus.SCHEDULED;
    if (config.expiresAt && now > new Date(config.expiresAt)) return JoinCodeStatus.EXPIRED;
    if (config.maxUses && (config.usedCount ?? this.joinedStudents().length) >= config.maxUses) {
      return JoinCodeStatus.FULL;
    }
    return JoinCodeStatus.ACTIVE;
  });

  readonly capacityPercentage = computed(() => {
    const config = this.joinConfig();
    if (!config?.maxUses) return 0;
    const currentUsed = config.usedCount ?? this.joinedStudents().length;
    return Math.min(Math.round((currentUsed / config.maxUses) * 100), 100);
  });

  readonly createCodeForm: FormGroup = this.fb.group({
    maxUses: [30, [Validators.required, Validators.min(1)]],
    startsAt: [new Date(), [Validators.required]],
    expiresAt: [new Date(), [Validators.required]],
  });

  onSearchInput(value: string): void {
    this.searchRawQuery.set(value);
    this.searchRawQueryChange.emit(value);
  }

  onStudentSelected(event: MatAutocompleteSelectedEvent): void {
    this.selectedStudent.set(event.option.value as StudentSummary);
  }

  onAddStudent(): void {
    const student = this.selectedStudent();
    if (!student) return;
    this.studentAdded.emit(student);
    this.searchRawQuery.set('');
    this.selectedStudent.set(null);
  }

  onSubmitCode(): void {
    if (this.createCodeForm.invalid) return;

    this.codeGenerated.emit({
      maxUses: Number(this.createCodeForm.get('maxUses')?.value),
      startsAt: new Date(this.createCodeForm.get('startsAt')?.value).toISOString(),
      expiresAt: new Date(this.createCodeForm.get('expiresAt')?.value).toISOString(),
    });
  }

  displayStudentFn(student: StudentSummary | string | null): string {
    if (!student) return '';
    if (typeof student === 'string') return student;
    return student.studentCode ? `${student.fullName} (${student.studentCode})` : student.fullName;
  }
}