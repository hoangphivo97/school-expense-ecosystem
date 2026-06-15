import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, DecimalPipe } from '@angular/common';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ExpenseService } from '@school-expense-ecosystem/expenses/data-access';
import { CustomDateAdapter } from '@school-expense-ecosystem/shared/utils';
import { DialogActionEnum, DialogData } from '@school-expense-ecosystem/shared/types';
import { 
  ExpenseList, 
  CreateExpenseInput, 
  UpdateExpenseInput, 
  PaidMethod 
} from '@school-expense-ecosystem/expenses/types';

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
  readonly dialogData = inject<DialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly expenseService = inject(ExpenseService);
  private readonly decimalPipe = inject(DecimalPipe);
  private readonly destroyRef = inject(DestroyRef);

  // Constants & Enums
  readonly Action = DialogActionEnum;
  readonly PaidMethods = [
    { label: 'Cash (Tiền mặt)', value: PaidMethod.CASH },
    { label: 'Bank Transfer (Chuyển khoản)', value: PaidMethod.BANK_TRANSFER },
  ];

  // Form definition với Strong Typing
  readonly expenseForm = this.fb.nonNullable.group({
    date: [new Date(), [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(5)]],
    purpose: ['', [Validators.required]],
    paidMethod: [PaidMethod.CASH, [Validators.required]],
    amount: [0 as number, [Validators.required, Validators.min(1000)]],
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
      paidMethod: data.paidMethod,
      amount: data.amount,
      date: new Date(data.date),
    });
  }

  onSave() {
    if (this.expenseForm.invalid) return;

    const formValue = this.expenseForm.getRawValue();
    // Map DTO chuẩn theo Interface CreateExpenseInput
    const payload: CreateExpenseInput = {
      amount: formValue.amount,
      purpose: formValue.purpose,
      description: formValue.description,
      proofUrls: (this.dialogData.data as ExpenseList)?.proofUrls || [],
    };

    if (this.dialogData.action === this.Action.Create) {
      this.executeCreate(payload);
    } else {
      this.executeEdit((this.dialogData.data as ExpenseList).id, payload);
    }
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
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/,/g, '');
    const numericValue = Number(value);

    if (!isNaN(numericValue)) {
      this.expenseForm.controls.amount.setValue(numericValue, { emitEvent: false });
      input.value = this.decimalPipe.transform(numericValue, '1.0-0') || '';
    }
  }

  closeDialog(isSuccess: boolean) {
    this.dialogRef.close({ ...this.dialogData, isSuccess });
  }
}