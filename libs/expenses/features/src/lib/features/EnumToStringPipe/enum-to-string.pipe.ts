import { Pipe, PipeTransform } from '@angular/core';
import { PaidMethod } from '@school-expense-ecosystem/expenses/types';

@Pipe({
  name: 'enumToString',
  standalone: true,
})
export class EnumToStringPipe implements PipeTransform {
  transform(value: PaidMethod): string {
    const mapping = {
      [PaidMethod.CASH]: 'Cash',
      [PaidMethod.BANK_TRANSFER]: 'Bank transfer',
    };
    return mapping[value];
  }
}
