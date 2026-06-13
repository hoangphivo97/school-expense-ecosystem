import { Pipe, PipeTransform } from '@angular/core';
import { PaidMethodEnum } from '@school-expense-ecosystem/expenses/types';

@Pipe({
  name: 'enumToString',
  standalone: true,
})
export class EnumToStringPipe implements PipeTransform {
  transform(value: PaidMethodEnum): string {
    const mapping = {
      [PaidMethodEnum.CASH]: 'Cash',
      [PaidMethodEnum.CREDIT_CARD]: 'Credit card',
      [PaidMethodEnum.BANK_TRANSFER]: 'Bank transfer',
    };
    return mapping[value];
  }
}
