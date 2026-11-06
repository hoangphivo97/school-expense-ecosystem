import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { InitializeDepartmentFundPayload, TopUpDepartmentFundPayload } from "@school-expense-ecosystem/finance/types";
import { AuthenticatedUser, DepartmentFundBalanceResult, Role } from "@school-expense-ecosystem/shared/types";
import { DepartmentFundRepository } from "../repositories/abstracts/department-fund.repository";
import { FacultyRepository } from "../repositories/abstracts/faculty.repository";


@Injectable()

export class BudgetBackendService {
  constructor(
    private readonly departmentFundRepo: DepartmentFundRepository,
    private readonly facultyRepo: FacultyRepository
  ) {}

  /**
   * Khởi tạo hạn mức ngân sách đầu năm cho Khoa (系所分配款)
   */
  async initializeDepartmentFund(
    user: AuthenticatedUser,
    payload: InitializeDepartmentFundPayload
  ): Promise<DepartmentFundBalanceResult> {
    this.assertFinanceRole(user);

    if (payload.totalBudget <= 0) {
      throw new BadRequestException('Total budget allocation must be greater than 0.');
    }

    const faculty = await this.facultyRepo.findById(payload.facultyId);
    if (!faculty) {
      throw new BadRequestException(`Faculty "${payload.facultyId}" does not exist in the institution directory.`);
    }

    const fundId = `${payload.facultyId.toUpperCase()}_DEPT_${payload.year}`;
    const timestampIso = new Date().toISOString();

    return this.departmentFundRepo.createFund({
      fundId,
      facultyId: payload.facultyId,
      year: payload.year,
      totalBudget: payload.totalBudget,
      allocatedBudget: 0,
      remainingBudget: payload.totalBudget,
      createdAt: timestampIso,
      updatedAt: timestampIso,
    });
  }

  /**
   * Nạp thêm / Bổ sung kinh phí cho Khoa (追加預算)
   */
  async topUpDepartmentFund(
    user: AuthenticatedUser,
    fundId: string,
    payload: TopUpDepartmentFundPayload
  ): Promise<DepartmentFundBalanceResult> {
    this.assertFinanceRole(user);

    if (payload.amount <= 0) {
      throw new BadRequestException('Top-up amount must be strictly greater than 0.');
    }

    return this.departmentFundRepo.topUpFund(fundId, payload.amount);
  }

  /**
   * Báo cáo tổng quan ngân sách tất cả các khoa trong năm tài chính
   */
  async getAnnualDepartmentFundsOverview(
    user: AuthenticatedUser,
    year?: number
  ): Promise<DepartmentFundBalanceResult[]> {
    this.assertFinanceRole(user);

    const targetYear = year && !isNaN(year) ? Number(year) : new Date().getFullYear();
    return this.departmentFundRepo.findAllByYear(targetYear);
  }

  private assertFinanceRole(user: AuthenticatedUser): void {
    if (user.role !== Role.LEVEL_1_FINANCE) {
      throw new ForbiddenException('Only Finance officers possess authority to manage institutional funds.');
    }
  }
}