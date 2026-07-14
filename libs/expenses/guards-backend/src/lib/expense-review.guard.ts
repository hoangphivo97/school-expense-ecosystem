import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Role, UserBase, UserType } from '@school-expense-ecosystem/shared/types';

@Injectable()
export class ExpenseReviewGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: UserBase = request.user;

    // Reject students and low-level roles from participating in the review workflow
    if (!user || user.role === Role.LEVEL_3_USER || user.userType === UserType.STUDENT) {
      throw new ForbiddenException('Access Denied: Students are not authorized to review expense claims.');
    }

    return true;
  }
}