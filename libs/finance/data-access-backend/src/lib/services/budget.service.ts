import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { AdjustDepartmentFundPayload, AuditableBudgetPayload, BudgetAuditActor, BudgetReferenceDocType, BudgetTransactionType, DeductDepartmentFundPayload, DepartmentFund, DepartmentFundStatus, InitializeDepartmentFundPayload, TopUpDepartmentFundPayload } from "@school-expense-ecosystem/finance/types";
import { AuthenticatedUser, Role } from "@school-expense-ecosystem/shared/types";
import { DepartmentFundRepository } from "../repositories/abstracts/department-fund.repository";
import { FacultyRepository } from "../repositories/abstracts/faculty.repository";


@Injectable()

export class BudgetBackendService {
  constructor(
    private readonly departmentFundRepo: DepartmentFundRepository,
    private readonly facultyRepo: FacultyRepository
  ) { }

  async initializeDepartmentFund(
    user: AuthenticatedUser,
    payload: InitializeDepartmentFundPayload
  ): Promise<DepartmentFund> {
    this.assertFinanceRole(user);

    if (payload.totalBudget <= 0) {
      throw new BadRequestException('Total budget allocation must be greater than 0.');
    }

    this.validateAuditMetadata(payload);

    const faculty = await this.facultyRepo.findById(payload.facultyId);
    if (!faculty) {
      throw new BadRequestException(
        `Faculty "${payload.facultyId}" does not exist in the institution directory.`
      );
    }

    const fundId = `${payload.facultyId.toUpperCase()}_DEPT_${payload.year}`;
    const timestampIso = new Date().toISOString();

    return this.departmentFundRepo.createFund(
      {
        fundId,
        facultyId: payload.facultyId,
        year: payload.year,
        totalBudget: payload.totalBudget,
        allocatedBudget: 0,
        remainingBudget: payload.totalBudget,
        status: DepartmentFundStatus.ACTIVE,
        createdAt: timestampIso,
        updatedAt: timestampIso,
      },
      {
        referenceDocType: payload.referenceDocType,
        referenceDocNo: payload.referenceDocNo.trim(),
        reason: payload.reason.trim(),
      },
      this.extractActor(user)
    );
  }

  async topUpDepartmentFund(
    user: AuthenticatedUser,
    fundId: string,
    payload: TopUpDepartmentFundPayload
  ): Promise<DepartmentFund> {
    return this.executeFundAdjustment(
      user,
      fundId,
      BudgetTransactionType.TOP_UP,
      payload
    );
  }

  async getAnnualDepartmentFundsOverview(
    user: AuthenticatedUser,
    year?: number
  ): Promise<DepartmentFund[]> {
    this.assertFinanceRole(user);

    const targetYear = year && !isNaN(year) ? Number(year) : new Date().getFullYear();
    return this.departmentFundRepo.findAllByYear(targetYear);
  }

  private assertFinanceRole(user: AuthenticatedUser): void {
    if (user.role !== Role.LEVEL_1_FINANCE) {
      throw new ForbiddenException('Only Finance officers possess authority to manage institutional funds.');
    }
  }

  /**
 * Deducts or reclaims institutional budget allocation for a specific faculty.
 */
  async deductDepartmentFund(
    user: AuthenticatedUser,
    fundId: string,
    payload: DeductDepartmentFundPayload
  ): Promise<DepartmentFund> {
    return this.executeFundAdjustment(
      user,
      fundId,
      BudgetTransactionType.DEDUCTION,
      payload
    );
  }

  private async executeFundAdjustment(
    user: AuthenticatedUser,
    fundId: string,
    type: BudgetTransactionType.TOP_UP | BudgetTransactionType.DEDUCTION,
    payload: AdjustDepartmentFundPayload
  ): Promise<DepartmentFund> {
    this.assertFinanceRole(user);

    const normalizedFundId = fundId?.trim().toUpperCase();
    if (!normalizedFundId) {
      throw new BadRequestException('Department fund ID is required.');
    }

    if (payload.amount <= 0) {
      const actionLabel = type === BudgetTransactionType.TOP_UP ? 'Top-up' : 'Deduction';
      throw new BadRequestException(`${actionLabel} amount must be strictly greater than 0.`);
    }

    this.validateAuditMetadata(payload);

    return this.departmentFundRepo.adjustFundBalance(
      normalizedFundId,
      type,
      {
        amount: payload.amount,
        referenceDocType: payload.referenceDocType,
        referenceDocNo: payload.referenceDocNo.trim(),
        reason: payload.reason.trim(),
      },
      this.extractActor(user)
    );
  }

  private validateAuditMetadata(audit: AuditableBudgetPayload): void {
    if (!Object.values(BudgetReferenceDocType).includes(audit.referenceDocType)) {
      throw new BadRequestException('Valid audit reference document type is required.');
    }

    if (!audit.referenceDocNo || audit.referenceDocNo.trim().length < 3) {
      throw new BadRequestException(
        'Audit reference document number must be at least 3 characters long.'
      );
    }

    if (!audit.reason || audit.reason.trim().length < 5) {
      throw new BadRequestException('Audit reason must be at least 5 characters long.');
    }
  }

  private extractActor(user: AuthenticatedUser): BudgetAuditActor {
    return {
      uid: user.uid,
      email: user.email ?? '',
    };
  }
}