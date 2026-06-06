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
import { Timestamp } from '@angular/fire/firestore';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CreateExpense,
  EditExpense,
  PaidMethodDropdownList,
  PaidMethodEnum
} from '@school-expense-ecosystem/expenses/data-access';

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
  private formBuilder = inject(FormBuilder);
  readonly expenseService = inject(ExpenseService);
  private decimalPipe = inject(DecimalPipe);
  private destroyRef = inject(DestroyRef);

  formattedValue = '';
  dialogActionEnum = DialogActionEnum;

  paidMethodCurrVal: PaidMethodEnum = PaidMethodEnum.CASH;

  paidMethodDropdownList: PaidMethodDropdownList[] = [
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
    date: [new Date(), Validators.required],
    description: ['', Validators.required],
    purpose: ['', Validators.required],
    paid: [0, Validators.required],
    for: [''],
    amount: [0, Validators.required],
  });

  async ngOnInit(): Promise<void> {
    await this.patchValue();
  }

  patchValue() {
    if (this.dialogData.action !== this.dialogActionEnum.Edit) return;
    const dataFromApi = this.dialogData.data as EditExpense;

    this.createExpenseForm.patchValue({
      ...dataFromApi,
      date: (dataFromApi.date as Timestamp).toDate(),
    });
  }

  onSave() {
    if (!this.createExpenseForm.valid) return;
    const { action, data } = this.dialogData;
    const expenseData = this.createExpenseForm.value as CreateExpense;
    const payload = {
      ...expenseData,
      createdAt: new Date(),
    };

    if (action === this.dialogActionEnum.Create) {
      this.createExpense(payload as CreateExpense);
    } else if (action === this.dialogActionEnum.Edit) {
      this.editExpense((data as EditExpense).id, payload as EditExpense);
    }
  }

  createExpense(payload: CreateExpense) {
    this.expenseService
      .createExpense(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (e) => {
          console.log(e);
        },
        complete: () =>
          this.dialogRef.close({
            title: 'Create new Expense',
            action: this.dialogActionEnum.Create,
            isSuccess: true,
          } as DialogData),
      });
  }

  editExpense(id: string, payload: EditExpense) {
    this.expenseService
      .editExpense(id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (e) => {
          console.log(e);
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

    // Format the display value
    const formattedValue =
      this.decimalPipe.transform(numericValue, '1.0-2') || '';
    inputElement.value = formattedValue; // Update input value instantly
  }

  get ExpenseFormIsValid(): boolean {
    return this.createExpenseForm.valid;
  }
}
