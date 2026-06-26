import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ExpenseRepository } from './expense.repository';
import { ExpenseList, PaginatedExpensesResponse, ExpenseAnalyticsDto, ExpenseStatus, AuditAction, AuditLogEntry, PaidMethod, ExpenseFilters, AnalyticsFilters, CreateExpenseInput, UpdateExpenseInput } from '@school-expense-ecosystem/expenses/types';
import { AuthenticatedUser} from '@school-expense-ecosystem/shared/types';

@Injectable()
export class ExpenseBackendService {
  constructor(private readonly expenseRepo: ExpenseRepository) { }

  async getPaginatedExpenses(
    userId: string,
    filters: Omit<ExpenseFilters, 'userId'>
  ): Promise<PaginatedExpensesResponse> {
    return this.expenseRepo.findPaginated({ userId, ...filters });
  }

  async createExpense(user: AuthenticatedUser, dto: CreateExpenseInput): Promise<ExpenseList> {
    const initialStatus = ExpenseStatus.PENDING_TEACHER_REVIEW;

    const submitLog: AuditLogEntry = {
      actorId: user.uid,
      actorName: user.fullName,
      actorType: user.userType,
      action: AuditAction.SUBMIT,
      status: initialStatus,
      createdAt: new Date().toISOString(),
      actorRole: user.role,
      actorCode: user.userCode,
      proofUrls: dto.proofUrls,
      facultyId: user.facultyId
    };

    const fullExpenseData: Omit<ExpenseList, 'id'> = {
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
      paidMethod: PaidMethod.CASH,
      date: new Date().toISOString(),
      createdAt: '',
      updatedAt: '',
      history: [submitLog]
    };

    return this.expenseRepo.create(fullExpenseData);
  }

  async updateExpense(id: string, userId: string, user: AuthenticatedUser, dto: UpdateExpenseInput): Promise<ExpenseList> {
    const existing = await this.expenseRepo.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException(`Expense listing with security ID ${id} not found.`);
    }

    if (existing.status !== ExpenseStatus.REJECTED) {
      throw new BadRequestException('Operation Locked: Only rejected expense claims can be modified.');
    }

    const nextStatus = ExpenseStatus.PENDING_TEACHER_REVIEW;
    const finalProofUrls = dto.proofUrls || existing.proofUrls;

    // Tạo dòng log tái sinh đơn
    const resubmitLog = {
      actorId: user.uid,
      actorName: user.fullName,
      actorType: user.userType,
      action: AuditAction.RESUBMIT,
      status: nextStatus,
      createdAt: new Date().toISOString(),
      actorRole: user.role,
      actorCode: user.userCode,
      proofUrls: finalProofUrls
    };

    return this.expenseRepo.update(id, {
      ...dto,
      status: nextStatus,
      logEntry: resubmitLog
    });
  }

  async reviewExpense(id: string, user: AuthenticatedUser, action: AuditAction, reason?: string): Promise<ExpenseList> {
    const expense = await this.expenseRepo.findById(id);
    if (!expense) throw new NotFoundException(`Expense claim with ID ${id} does not exist.`);

    let nextStatus: ExpenseStatus;

    if (action === AuditAction.REJECT) {
      if (!reason || reason.trim() === '') {
        throw new BadRequestException('Compliance Failure: A specific reason is strictly mandatory when rejecting a claim.');
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
          if (action !== AuditAction.DISBURSE) throw new BadRequestException('Invalid action. Only Finance Staff can disburse funds.');
          nextStatus = ExpenseStatus.DISBURSED;
          break;
        default:
          throw new BadRequestException('Workflow Locked: This claim has already reached its final terminal state.');
      }
    }

    const reviewLog: AuditLogEntry = {
      actorId: user.uid,
      actorName: user.fullName,
      actorRole: user.role,
      actorCode: user.userCode,
      actorType: user.userType,
      action,
      status: nextStatus,
      createdAt: new Date().toISOString(),
      proofUrls: expense.proofUrls,
      facultyId: user.facultyId,
      ...(action === AuditAction.REJECT && { rejectReason: reason })
    };

    return this.expenseRepo.update(id, {
      status: nextStatus,
      logEntry: reviewLog,
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