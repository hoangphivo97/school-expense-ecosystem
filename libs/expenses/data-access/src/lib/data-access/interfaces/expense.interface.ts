import { Timestamp } from '@angular/fire/firestore';
import { DropdownList } from '@school-expense-ecosystem/shared/types';

export interface ExpenseList {
  id: string;
  date: Date | Timestamp;
  description: string;
  purpose: string;
  paid: PaidMethodEnum;
  for?: string;
  amount: number;
  createdAt: Date | Timestamp;
}

export enum PaidMethodEnum {
  CASH,
  CREDIT_CARD,
  BANK_TRANSFER,
}

export type CreateExpense = Omit<ExpenseList, 'id'>;

export type EditExpense = ExpenseList;

export type PaidMethodDropdownList = DropdownList<PaidMethodEnum>;
