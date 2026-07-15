import { Injectable } from '@nestjs/common';
import { ExpenseRepository } from './expense.repository';
import { ExpenseList, PaginatedExpensesResponse, ExpenseAnalyticsDto, AuditAction, ExpenseAuditLogDocument, PersonalExpenseRequestFilters, AnalyticsFilters, CreateExpenseInput, ReviewerExpenseRequestFilters } from '@school-expense-ecosystem/expenses/types';
import { AuthenticatedUser, Role, UserType } from '@school-expense-ecosystem/shared/types';
import { ExpenseStatus } from '@school-expense-ecosystem/shared/types';
import { ExpenseAmountLimitExceededException, ExpenseInvalidDisbursementActionException, ExpenseMissingRejectionReasonException, ExpenseNotFoundException, ExpenseWorkflowLockedException } from './exceptions/expense.exception';
import { randomBytes } from 'crypto';

@Injectable()
export class ExpenseBackendService {
  constructor(private readonly expenseRepo: ExpenseRepository) { }

  async getPersonalPaginatedExpenses(
    userId: string,
    filters: Omit<PersonalExpenseRequestFilters, 'userId'>
  ): Promise<PaginatedExpensesResponse> {
    return this.expenseRepo.findPersonalExpensePaginated({ userId, ...filters });
  }

  async getReviewerExpenses(
    user: AuthenticatedUser,
    filters: ReviewerExpenseRequestFilters
  ): Promise<PaginatedExpensesResponse> {
    // Route processing directly into the specialized reviewer repository pipeline
    return this.expenseRepo.findReviewerExpensesPaginated(user, filters);
  }

  async createExpense(user: AuthenticatedUser, dto: CreateExpenseInput): Promise<ExpenseList> {
    const initialStatus = ExpenseStatus.PENDING_TEACHER_REVIEW;
    const amount = dto.amount;
    const userType = user.userType;
    const userRole = user.role;

    // Generate cryptographically secure expense code matching template: EXP-[FACULTY]-[MMYY]-[CRYPTO]
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const cryptoToken = randomBytes(3).toString('hex').toUpperCase(); // Generates 6 secure hex characters for collision avoidance
    const expenseCode = `EXP-${user.facultyId || 'GEN'}-${mm}${yy}-${cryptoToken}`;

    if (userRole === Role.LEVEL_3_USER) {
      if (userType === UserType.STUDENT && amount > 2000) {
        throw new ExpenseAmountLimitExceededException(UserType.STUDENT, 2000);
      }

      if ((userType === UserType.TEACHER || userType === UserType.STAFF) && amount > 10000) {
        throw new ExpenseAmountLimitExceededException(userType, 10000);
      }
    }

    const fullExpenseData: Omit<ExpenseList, 'id'> = {
      expenseCode: expenseCode,
      amount: dto.amount,
      purpose: dto.purpose,
      description: dto.description,
      proofUrls: dto.proofUrls,
      userId: user.uid,
      requesterCode: user.userCode || '',
      requesterName: user.fullName || '',
      requesterType: user.userType,
      facultyId: user.facultyId,
      status: initialStatus,
      paidMethod: dto.paidMethod,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const freshExpense = await this.expenseRepo.create(fullExpenseData);

    const submitLog: Omit<ExpenseAuditLogDocument, 'id'> = {
      expenseId: freshExpense.id,
      expenseCode,
      actorId: user.uid,
      actorName: user.fullName,
      actorRole: user.role,
      actorType: user.userType,
      actorCode: user.userCode,
      facultyId: user.facultyId,
      action: AuditAction.SUBMIT,
      status: initialStatus,
      createdAt: new Date().toISOString()
    };

    await this.expenseRepo.createAuditLog(submitLog);

    return freshExpense;
  }

  // async updateExpense(id: string, userId: string, user: AuthenticatedUser, dto: UpdateExpenseInput): Promise<ExpenseList> {
  //   const existing = await this.expenseRepo.findById(id);
  //   if (!existing || existing.userId !== userId) {
  //     throw new ExpenseNotFoundException(id);
  //   }

  //   if (existing.status !== ExpenseStatus.REJECTED) {
  //     throw new ExpenseModificationLockedException();
  //   }

  //   const nextStatus = ExpenseStatus.PENDING_TEACHER_REVIEW;
  //   const finalProofUrls = dto.proofUrls || existing.proofUrls;

  //   const resubmitLog = {
  //     actorId: user.uid,
  //     actorName: user.fullName,
  //     actorType: user.userType,
  //     action: AuditAction.RESUBMIT,
  //     status: nextStatus,
  //     createdAt: new Date().toISOString(),
  //     actorRole: user.role,
  //     actorCode: user.userCode,
  //     proofUrls: finalProofUrls
  //   };

  //   return this.expenseRepo.update(id, {
  //     ...dto,
  //     status: nextStatus,
  //     logEntry: resubmitLog
  //   });
  // }

  async reviewExpense(id: string, user: AuthenticatedUser, action: AuditAction, reason?: string): Promise<ExpenseList> {
    const expense = await this.expenseRepo.findById(id);
    if (!expense) throw new ExpenseNotFoundException(id);

    let nextStatus: ExpenseStatus;

    if (action === AuditAction.REJECT) {
      if (!reason || reason.trim() === '') {
        throw new ExpenseMissingRejectionReasonException();
      }
      nextStatus = ExpenseStatus.REJECTED;
    } else {
      switch (expense.status) {
        case ExpenseStatus.PENDING_TEACHER_REVIEW:
          nextStatus = ExpenseStatus.PENDING_DEAN_APPROVAL;
          break;
        case ExpenseStatus.PENDING_DEAN_APPROVAL:
          nextStatus = ExpenseStatus.PENDING_DISBURSEMENT;
          break;
        case ExpenseStatus.PENDING_DISBURSEMENT:
          if (action !== AuditAction.DISBURSE) throw new ExpenseInvalidDisbursementActionException();
          nextStatus = ExpenseStatus.DISBURSED;
          break;
        default:
          throw new ExpenseWorkflowLockedException();
      }
    }

    const reviewLog: Omit<ExpenseAuditLogDocument, 'id'> = {
      expenseId: expense.id,
      expenseCode: expense.expenseCode,
      actorId: user.uid,
      actorName: user.fullName,
      actorRole: user.role,
      actorCode: user.userCode,
      actorType: user.userType,
      facultyId: user.facultyId,
      action,
      status: nextStatus,
      createdAt: new Date().toISOString(),
      ...(action === AuditAction.REJECT && { rejectReason: reason })
    };

    await this.expenseRepo.createAuditLog(reviewLog);

    return this.expenseRepo.update(id, {
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      ...(action === AuditAction.REJECT && { rejectReason: reason })
    });
  }

  async getUserAvailableYears(userId: string): Promise<number[]> {
    return this.expenseRepo.findAvailableYears(userId);
  }

  async getExpenseAnalytics(filter: AnalyticsFilters): Promise<ExpenseAnalyticsDto> {
    return this.expenseRepo.getAnalytics(filter);
  }
}