import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

// 1. General & Access Exceptions
export class ProjectNotFoundException extends NotFoundException {
  constructor(projectId?: string) {
    super(projectId ? `Project with ID "${projectId}" not found.` : 'Project does not exist.');
  }
}

export class ProjectAccessForbiddenException extends ForbiddenException {
  constructor() {
    super('You do not have permission to access or modify this project.');
  }
}

export class ProjectStudentNotFoundException extends NotFoundException {
  constructor(missingIds: string[]) {
    super(
      `Unable to locate the specified student account(s) in the system directory (${missingIds.length} account(s) invalid).`
    );
  }
}

// 2. Lifecycle & Approval Exceptions
export class ProjectApprovalForbiddenException extends ForbiddenException {
  constructor() {
    super('Only the Faculty Dean or Finance officers have authority to approve or reject project proposals.');
  }
}

export class ProjectInvalidStatusTransitionException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}

export class ProjectAlreadyArchivedException extends ConflictException {
  constructor() {
    super('The project is already in archived status.');
  }
}

export class ProjectPendingExpensesArchiveException extends ConflictException {
  constructor() {
    super('Cannot archive project with pending expense requests in progress.');
  }
}

// 3. Financial Constraints
export class ProjectInitialSpentExceedsCapException extends BadRequestException {
  constructor() {
    super('Initial spent baseline cannot exceed project budget cap.');
  }
}

export class DepartmentFundNotFoundException extends NotFoundException {
  constructor(fundId: string) {
    super(`Department fund "${fundId}" was not found.`);
  }
}

export class InsufficientDepartmentFundException extends BadRequestException {
  constructor(remaining: number, requested: number) {
    super(`Insufficient department funds. Available: ${remaining}, Requested: ${requested}.`);
  }
}

export class ProjectActiveFinancialModificationException extends BadRequestException {
  constructor(field: 'initialSpent' | 'budgetCap') {
    super(`Cannot modify ${field} directly on an active project.`);
  }
}

// 4. Roster & Date Range Exceptions
export class ProjectInvalidDateRangeException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}

export class ProjectStudentAlreadyEnrolledException extends ConflictException {
  constructor(studentId: string) {
    super(`Student ${studentId} is already enrolled in this project.`);
  }
}

export class ProjectStudentNotEnrolledException extends NotFoundException {
  constructor(studentId: string) {
    super(`Student ${studentId} is not enrolled in this project.`);
  }
}

export class ProjectRosterLockedException extends ConflictException {
  constructor() {
    super('Cannot modify student roster while project approval is pending.');
  }
}