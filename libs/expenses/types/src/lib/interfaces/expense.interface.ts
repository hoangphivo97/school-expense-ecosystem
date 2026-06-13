export interface ExpenseList {
  id: string;
  userId: string;      
  date: string;         
  description: string;
  purpose: string;
  paid: PaidMethodEnum;
  for?: string;
  amount: number;
  createdAt: string;   
}

export enum PaidMethodEnum {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export type CreateExpenseDto = Omit<ExpenseList, 'id' | 'createdAt'>;

export type UpdateExpenseDto = Partial<CreateExpenseDto>;

