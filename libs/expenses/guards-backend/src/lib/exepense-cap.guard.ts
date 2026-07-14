import { Role, UserBase, UserType } from '@school-expense-ecosystem/shared/types';
import { ExpenseAmountLimitExceededException } from '@school-expense-ecosystem/expenses/data-access-backend';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CreateExpenseInput } from '@school-expense-ecosystem/expenses/types';

const EXPENSE_LIMITS: Record<UserType, number> = {
    [UserType.STUDENT]: 2000,
    [UserType.TEACHER]: 10000,
    [UserType.STAFF]: 10000
};

@Injectable()
export class ExpenseCapGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user: UserBase = request.user;
        const body: CreateExpenseInput = request.body;

        if (!user || user.role !== Role.LEVEL_3_USER || !user.userType) {
            return true;
        }

        // Resolve dynamic limit based on authenticated user type mapping context
        const maxAllowedLimit = EXPENSE_LIMITS[user.userType];

        if (maxAllowedLimit !== undefined && body.amount > maxAllowedLimit) {
            throw new ExpenseAmountLimitExceededException(user.userType, maxAllowedLimit);
        }

        return true;
    }
}