export class BaseProjectException extends Error {
  constructor(
    public readonly errorCode: string,
    public override readonly message: string,
    public readonly extraData?: Record<string, any>
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// 1. General & Access Control Exceptions
export class ProjectNotFoundException extends BaseProjectException {
  constructor(projectId?: string) {
    super(
      'PROJECT_NOT_FOUND',
      projectId ? `Project with ID ${projectId} not found.` : 'Project does not exist.'
    );
  }
}

export class ProjectAccessForbiddenException extends BaseProjectException {
  constructor() {
    super(
      'PROJECT_ACCESS_FORBIDDEN',
      'You do not have permission to access or modify this project.'
    );
  }
}

// 2. Lifecycle & Approval Exceptions
export class ProjectApprovalForbiddenException extends BaseProjectException {
  constructor() {
    super(
      'PROJECT_APPROVAL_FORBIDDEN',
      'Only the Faculty Dean or Finance officers have authority to approve or reject project proposals.'
    );
  }
}

export class ProjectInvalidStatusTransitionException extends BaseProjectException {
  constructor(message: string) {
    super('PROJECT_INVALID_STATUS_TRANSITION', message);
  }
}

export class ProjectAlreadyArchivedException extends BaseProjectException {
  constructor() {
    super('PROJECT_ALREADY_ARCHIVED', 'The project is already in archived status.');
  }
}

export class ProjectPendingExpensesArchiveException extends BaseProjectException {
  constructor() {
    super(
      'PROJECT_PENDING_EXPENSES_ARCHIVE_RESTRICTION',
      'Cannot archive project with pending expense requests in progress.'
    );
  }
}

// 3. Financial & Baseline Constraints
export class ProjectInitialSpentExceedsCapException extends BaseProjectException {
  constructor() {
    super(
      'PROJECT_INITIAL_SPENT_EXCEEDS_CAP',
      'Initial spent baseline cannot exceed project budget cap.'
    );
  }
}

export class ProjectActiveFinancialModificationException extends BaseProjectException {
  constructor(field: 'initialSpent' | 'budgetCap') {
    super(
      'PROJECT_ACTIVE_FINANCIAL_MODIFICATION_PROHIBITED',
      `Cannot modify ${field} directly on an active project.`
    );
  }
}

// 4. Invitation & Join Code Exceptions
export class ProjectInvalidJoinCodeException extends BaseProjectException {
  constructor() {
    super('PROJECT_INVALID_JOIN_CODE', 'Invalid invitation code or project does not exist.');
  }
}

export class ProjectJoinDisabledException extends BaseProjectException {
  constructor() {
    super('PROJECT_JOIN_DISABLED', 'Invitation joining is not configured or disabled for this project.');
  }
}

export class ProjectJoinNotStartedException extends BaseProjectException {
  constructor(startsAt: string) {
    super(
      'PROJECT_JOIN_NOT_STARTED',
      `This project invitation code will open on ${new Date(startsAt).toLocaleDateString('vi-VN')}.`
    );
  }
}

export class ProjectJoinCodeExpiredException extends BaseProjectException {
  constructor() {
    super('PROJECT_JOIN_CODE_EXPIRED', 'The project invitation code has expired.');
  }
}

export class ProjectJoinCapacityReachedException extends BaseProjectException {
  constructor() {
    super(
      'PROJECT_JOIN_CAPACITY_REACHED',
      'The maximum recruitment capacity for this code has been reached.'
    );
  }
}

export class ProjectInvalidDateRangeException extends BaseProjectException {
  constructor(message: string) {
    super('PROJECT_INVALID_DATE_RANGE', message);
  }
}

// 5. Roster & Enrollment Exceptions
export class ProjectStudentAlreadyEnrolledException extends BaseProjectException {
  constructor() {
    super('PROJECT_STUDENT_ALREADY_ENROLLED', 'You are already enrolled in this project.');
  }
}

export class ProjectStudentNotEnrolledException extends BaseProjectException {
  constructor(studentId: string) {
    super('PROJECT_STUDENT_NOT_ENROLLED', `Student ${studentId} is not enrolled in this project.`);
  }
}

export class ProjectRosterLockedException extends BaseProjectException {
  constructor() {
    super(
      'PROJECT_ROSTER_LOCKED_PENDING_APPROVAL',
      'Cannot modify student roster while project approval is pending.'
    );
  }
}