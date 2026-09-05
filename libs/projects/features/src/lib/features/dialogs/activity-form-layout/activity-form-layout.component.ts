import { Component, input, Input, output, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@ngneat/transloco';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormErrorPipe } from '@school-expense-ecosystem/shared/ui';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FacultyId } from '@school-expense-ecosystem/shared/types';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';

export interface FacultyOption {
  id: FacultyId;
  name: string;
}

@Component({
  selector: 'lib-activity-form-layout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatSlideToggleModule, MatIconModule, TranslocoModule, MatFormFieldModule, FormErrorPipe, MatDatepickerModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './activity-form-layout.component.html',
  styleUrl: './activity-form-layout.component.scss',
  providers: [FormErrorPipe,
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
  ]
})
export class ActivityFormLayoutComponent {
  // Required and optional Signal Inputs
  readonly form = input.required<FormGroup>();
  readonly faculties = input<FacultyOption[]>([]);
  readonly isFacultiesLoading = input<boolean>(false);
  readonly isSubmitting = input<boolean>(false);
  readonly isDetailMode = input<boolean>(false);
  readonly isEditMode = input<boolean>(false);
  readonly isImmediatelyActive = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);

  // TemplateRef slots for domain extension
  readonly fundingTypeSlot = input<TemplateRef<unknown>>();
  readonly extraFieldsSlot = input<TemplateRef<unknown>>();

  // Transloco scope configuration
  readonly translocoScope = input<string>('project.createDialog');

  // Modern output functions
  readonly submitForm = output<void>();
  readonly cancelForm = output<void>();
  readonly amountInput = output<{ event: Event; controlName: 'budgetCap' | 'initialSpent' }>();

  onAmountChange(event: Event, controlName: 'budgetCap' | 'initialSpent'): void {
    this.amountInput.emit({ event, controlName });
  }
}