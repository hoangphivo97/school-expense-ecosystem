import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, DecimalPipe } from '@angular/common';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ExpenseService } from '@school-expense-ecosystem/expenses/data-access';
import { compressImage, CustomDateAdapter } from '@school-expense-ecosystem/shared/utils-frontend';
import { ConfirmDialogData, DialogActionEnum, DialogData } from '@school-expense-ecosystem/shared/types';
import {
  ExpenseList,
  CreateExpenseInput,
  UpdateExpenseInput,
  PaidMethod
} from '@school-expense-ecosystem/expenses/types';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ConfirmDialogComponent } from '@school-expense-ecosystem/shared/ui';

export const MY_DATE_FORMATS = {
  parse: { dateInput: 'DD/MM/YYYY' },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'lib-create-expense-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    DecimalPipe,
  ],
  templateUrl: './create-expense-modal.component.html',
  styleUrl: './create-expense-modal.component.scss',
})
export class CreateExpenseModalComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<CreateExpenseModalComponent>);
  private readonly dialog = inject(MatDialog);
  readonly dialogData = inject<DialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly expenseService = inject(ExpenseService);
  private readonly decimalPipe = inject(DecimalPipe);
  private readonly destroyRef = inject(DestroyRef);

  //Upload Feature
  readonly MAX_FILE_SIZE_BYTE = 5 * 1024 * 1024; // 5MB per file
  readonly uploadErrors = signal<string[]>([]);
  readonly isUploading = signal<boolean>(false);
  readonly ALLOWED_EXTENSIONS = ['application/pdf', 'image/png', 'image/jpeg'];

  // Constants & Enums
  readonly Action = DialogActionEnum;
  readonly PaidMethods = [
    { label: 'Cash', value: PaidMethod.CASH }
  ];

  // Form definition với Strong Typing
  readonly expenseForm = this.fb.nonNullable.group({
    date: [new Date(), [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(5)]],
    purpose: ['', [Validators.required]],
    paidoutMethod: [PaidMethod.CASH, [Validators.required]],
    amount: [0 as number, [Validators.required, Validators.min(1000), Validators.max(2000)]],
    proofUrls: [[] as string[], Validators.required]
  });

  ngOnInit(): void {
    if (this.dialogData.action === this.Action.Edit) {
      this.patchFormValue();
    }
  }

  private patchFormValue() {
    const data = this.dialogData.data as ExpenseList;
    this.expenseForm.patchValue({
      description: data.description,
      purpose: data.purpose,
      paidoutMethod: data.paidMethod,
      amount: data.amount,
      date: new Date(data.date),
    });
  }

  onSave() {
    if (this.expenseForm.invalid) return;

    const formValue = this.expenseForm.getRawValue();

    const payload: CreateExpenseInput = {
      amount: formValue.amount,
      purpose: formValue.purpose,
      description: formValue.description,
      proofUrls: formValue.proofUrls || [],
      paidMethod: formValue.paidoutMethod
    };

    // if (this.dialogData.action === this.Action.Create) {
    //   this.executeCreate(payload);
    // } else {
    //   this.executeEdit((this.dialogData.data as ExpenseList).id, payload);
    // }
    this.executeCreate(payload);
  }

  private executeCreate(payload: CreateExpenseInput) {
    this.expenseService.createExpense(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.closeDialog(true));
  }

  private executeEdit(id: string, payload: UpdateExpenseInput) {
    this.expenseService.editExpense(id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.closeDialog(true));
  }

  onInputAmount(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const rawValue = inputElement.value.replace(/,/g, '');
    const numericValue = parseFloat(rawValue);

    // Update the form control with raw numeric value
    if (!isNaN(numericValue)) {
      this.expenseForm
        .get('amount')
        ?.setValue(numericValue, { emitEvent: false });
    } else {
      this.expenseForm
        .get('amount')
        ?.setValue(0, { emitEvent: false });
    }

    // Format the display value
    const formattedValue =
      this.decimalPipe.transform(numericValue, '1.0-2') || '';
    inputElement.value = formattedValue;
  }

  closeDialog(isSuccess: boolean) {
    this.dialogRef.close({ ...this.dialogData, isSuccess });
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    const errors: string[] = [];
    this.uploadErrors.set([]);

    for (const file of files) {
      // 1. Structural type verification boundary
      if (!this.ALLOWED_EXTENSIONS.includes(file.type)) {
        errors.push(`File "${file.name}" has an invalid extension. Only PDF, PNG, or JPG are accepted.`);
        continue;
      }

      this.isUploading.set(true);
      let processedFile = file;

      // 2. Intercept and optimize image payloads dynamically
      if (file.type.startsWith('image/')) {
        try {
          // Downscale to Full HD box max bounds, dropping quality down to 80%
          processedFile = await compressImage(file, 1920, 1080, 0.8);
          console.log(`[Compression Engine] Saved size from ${file.size / 1024}KB down to ${processedFile.size / 1024}KB`);
        } catch (compressionError) {
          console.error('Image pre-processing failed, falling back to raw file upload.', compressionError);
          // Fallback mechanism: if the canvas breaks, upload raw file instead of crashing the system
          processedFile = file;
        }
      }

      // 3. Post-processing threshold evaluation (Final security line before uploading)
      if (processedFile.size > this.MAX_FILE_SIZE_BYTE) {
        errors.push(`File "${processedFile.name}" exceeds the maximum allowed payload constraint (5MB).`);
        this.isUploading.set(false);
        continue;
      }

      // 4. Dispatch the optimized payload to the remote HTTP cloud node
      this.expenseService.uploadProof(processedFile)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            const currentUrls = this.expenseForm.controls.proofUrls.value;
            this.expenseForm.controls.proofUrls.setValue([...currentUrls, response.url]);
            this.expenseForm.controls.proofUrls.markAsDirty();
            this.isUploading.set(false);
          },
          error: () => {
            errors.push(`Network infrastructure rejected upload execution for "${processedFile.name}".`);
            this.isUploading.set(false);
            this.uploadErrors.set(errors);
          }
        });
    }

    if (errors.length > 0) {
      this.uploadErrors.set(errors);
    }
    input.value = ''; // Reset the input field stream
  }

  removeFile(indexToRemove: number): void {
    const currentUrls = this.expenseForm.controls.proofUrls.value;
    this.expenseForm.controls.proofUrls.setValue(
      currentUrls.filter((_, index) => index !== indexToRemove)
    );
    this.expenseForm.controls.proofUrls.markAsDirty();
  }

  onCancel(): void {
    if (this.expenseForm.dirty) {
      // Configure tailored parameters specifically for discarding expense data
      const dialogConfig: ConfirmDialogData = {
        title: 'Unsaved Expense Details',
        message: 'You have entered transaction data or attached document links in this form. Leaving now will permanently lose this progress.',
        confirmText: 'Discard Changes',
        cancelText: 'Keep Editing',
        confirmColor: 'warn', // Red button emphasizing data loss warning
        icon: 'warning'
      };

      // Open the global confirmation modal layer
      const confirmRef = this.dialog.open(ConfirmDialogComponent, {
        width: '420px',
        disableClose: true, // Forces an explicit response button choice
        data: dialogConfig  // Injects the customized configuration package
      });

      // Capture the user action resolve stream cleanly
      confirmRef.afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((shouldDiscard: boolean) => {
          if (shouldDiscard) {
            this.closeDialog(false); // Closes the main Create Expense modal without saving
          }
        });
    } else {
      // Form is untouched/pristine, bypass warning entirely and close immediately
      this.closeDialog(false);
    }
  }
}