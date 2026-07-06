export class BaseExpenseException extends Error {
    constructor(
        public readonly errorCode: string,
        public override readonly message: string,
        public readonly extraData?: Record<string, any>
    ) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class ExpenseNotFoundException extends BaseExpenseException {
    constructor(id: string) {
        super('EXPENSE_NOT_FOUND', `Expense claim resource with security ID ${id} could not be found or access is unauthorized.`, { id });
    }
}

export class ExpenseModificationLockedException extends BaseExpenseException {
    constructor() {
        super('EXPENSE_MODIFICATION_LOCKED', 'Operation Locked: Only rejected expense claims are eligible to be modified.');
    }
}

export class ExpenseMissingRejectionReasonException extends BaseExpenseException {
    constructor() {
        super('EXPENSE_REJECTION_REASON_MANDATORY', 'Compliance Failure: A specific reason is strictly mandatory when rejecting an expense claim.');
    }
}

export class ExpenseInvalidDisbursementActionException extends BaseExpenseException {
    constructor() {
        super('EXPENSE_INVALID_DISBURSEMENT_ACTION', 'Authorization Failure: Invalid action. Only Finance Staff can disburse funds at this stage.');
    }
}

export class ExpenseWorkflowLockedException extends BaseExpenseException {
    constructor() {
        super('EXPENSE_WORKFLOW_LOCKED', 'Workflow Locked: This expense claim has already reached its final terminal state and cannot be modified.');
    }
}

export class ExpenseAmountLimitExceededException extends BaseExpenseException {
    constructor(userType: string, limit: number) {
        super(
            'EXPENSE_AMOUNT_LIMIT_EXCEEDED',
            `Compliance Failure: Expense amount exceeds the maximum allowed limit of ${limit} TWD for ${userType} accounts.`,
            { limit, userType }
        );
    }
}