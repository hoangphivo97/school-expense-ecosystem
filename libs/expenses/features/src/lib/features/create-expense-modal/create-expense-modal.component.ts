// libs/expenses/features/src/lib/features/create-expense-modal/create-expense-modal.component.ts
import {
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatFormField } from '@angular/material/form-field';
import { MatLabel } from '@angular/material/form-field';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { ExpenseService } from '@school-expense-ecosystem/expenses/data-access';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MatDateFormats,
  MatOption,
} from '@angular/material/core';
import { CustomDateAdapter } from '@school-expense-ecosystem/shared/utils';
import {
  DialogActionEnum, DialogData
} from '@school-expense-ecosystem/shared/types';
import { DecimalPipe } from '@angular/common';
import { MatSelect } from '@angular/material/select';
import { PaidMethodStringValue } from '@school-expense-ecosystem/shared/constants';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ExpenseList,
  CreateExpenseDto,
  UpdateExpenseDto,
  PaidMethodEnum
} from '@school-expense-ecosystem/expenses/types'; // 👈 Imported pristine domain interfaces

export interface PaidMethodDropdownItem {
  name: string;
  value: PaidMethodEnum;
}

export const MY_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'DD/MM/YYYY', // Format for input parsing
  },
  display: {
    dateInput: 'DD/MM/YYYY', // Format displayed in the input field
    monthYearLabel: 'MMM YYYY', // Format for the month-year view
    dateA11yLabel: 'LL', // Accessibility format for date
    monthYearA11yLabel: 'MMMM YYYY', // Accessibility format for month-year
  },
};

@Component({
  selector: 'lib-create-expense-modal',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatFormField,
    MatLabel,
    ReactiveFormsModule,
    MatInputModule,
    MatButton,
    MatDatepickerModule,
    MatSelect,
    MatOption,
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
  readonly dialogRef = inject(MatDialogRef<CreateExpenseModalComponent>);
  readonly dialogData = inject<DialogData>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(FormBuilder);
  readonly expenseService = inject(ExpenseService);
  private readonly decimalPipe = inject(DecimalPipe);
  private readonly destroyRef = inject(DestroyRef);

  formattedValue = '';
  dialogActionEnum = DialogActionEnum;
  paidMethodCurrVal: PaidMethodEnum = PaidMethodEnum.CASH;

  paidMethodDropdownList: PaidMethodDropdownItem[] = [
    { name: PaidMethodStringValue.CASH, value: PaidMethodEnum.CASH },
    {
      name: PaidMethodStringValue.CREDIT_CARD,
      value: PaidMethodEnum.CREDIT_CARD,
    },
    {
      name: PaidMethodStringValue.BANK_TRANSFER,
      value: PaidMethodEnum.BANK_TRANSFER,
    },
  ];

  createExpenseForm = this.formBuilder.group({
    date: [new Date() as Date | null, Validators.required],
    description: ['', Validators.required],
    purpose: ['', Validators.required],
    paid: [PaidMethodEnum.CASH, Validators.required], // Initialized with typed Enum value safely
    for: [''],
    amount: [0 as number | null, Validators.required],
  });

  async ngOnInit(): Promise<void> {
    await this.patchValue();
  }

  /**
   * Hydrates the reactive form context when modal is opened in Edit state mode
   */
  patchValue() {
    if (this.dialogData.action !== this.dialogActionEnum.Edit) return;
    const dataFromApi = this.dialogData.data as ExpenseList;

    this.createExpenseForm.patchValue({
      description: dataFromApi.description,
      purpose: dataFromApi.purpose,
      paid: dataFromApi.paid,
      for: dataFromApi.for,
      amount: dataFromApi.amount,
      // Converts clean ISO string back to native JavaScript Date object for MatDatepicker context mapping
      date: dataFromApi.date ? new Date(dataFromApi.date) : new Date(),
    });
  }

  /**
   * Validates form boundaries and dispatches mutations towards data access layers
   */
  onSave() {
    if (!this.createExpenseForm.valid) return;
    const { action, data } = this.dialogData;
    const formValue = this.createExpenseForm.value;

    // Normalizes native Date instances back into standard ISO 8601 strings for API transmission strings
    const isoPayload: CreateExpenseDto = {
      description: formValue.description ?? '',
      purpose: formValue.purpose ?? '',
      paid: formValue.paid as PaidMethodEnum,
      for: formValue.for ?? '',
      amount: formValue.amount ?? 0,
      userId: (data as ExpenseList)?.userId ?? '', // Preserves contextual user ownership mapping safely
      date: formValue.date ? new Date(formValue.date).toISOString() : new Date().toISOString(),
    };

    if (action === this.dialogActionEnum.Create) {
      this.createExpense(isoPayload);
    } else if (action === this.dialogActionEnum.Edit && data) {
      this.editExpense((data as ExpenseList).id, isoPayload as UpdateExpenseDto);
    }
  }

  /**
   * Invokes network gateway requests to provision a fresh record mapping
   */
  createExpense(payload: CreateExpenseDto) {
    this.expenseService
      .createExpense(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (err) => {
          console.error('Failed to create new expense transaction payload allocation:', err);
        },
        complete: () =>
          this.dialogRef.close({
            title: 'Create new Expense',
            action: this.dialogActionEnum.Create,
            isSuccess: true,
          } as DialogData),
      });
  }

  /**
   * Invokes target endpoint update mutations for modification mappings
   */
  editExpense(id: string, payload: UpdateExpenseDto) {
    this.expenseService
      .editExpense(id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (err) => {
          console.error('Failed to update specified expense modification transaction index:', err);
        },
        complete: () =>
          this.dialogRef.close({
            title: 'Edit Expense',
            action: this.dialogActionEnum.Edit,
            isSuccess: true,
          } as DialogData),
      });
  }

  onCancel() {
    this.dialogRef.close({
      title: 'Create new Expense',
      action: this.dialogActionEnum.Create,
      isSuccess: false,
    } as DialogData);
  }

  /**
   * Automatically formats user keyboard currency inputs dynamically with comma separations
   */
  onInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const rawValue = inputElement.value.replace(/,/g, ''); // Remove commas
    const numericValue = parseFloat(rawValue); // Parse as float

    // Update the form control with raw numeric value
    if (!isNaN(numericValue)) {
      this.createExpenseForm
        .get('amount')
        ?.setValue(numericValue, { emitEvent: false }); // Don't emit value changes
    } else {
      this.createExpenseForm
        .get('amount')
        ?.setValue(null, { emitEvent: false });
    }

    // Format the display value instantly for smooth UX
    const formattedValue = this.decimalPipe.transform(numericValue, '1.0-2') || '';
    inputElement.value = formattedValue; 
  }

  get ExpenseFormIsValid(): boolean {
    return this.createExpenseForm.valid;
  }
}