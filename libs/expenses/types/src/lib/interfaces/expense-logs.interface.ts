import { ExpenseStatus, FacultyId, Role, UserType } from "@school-expense-ecosystem/shared/types";
import { AuditAction } from "../enums/expense.enum";

export interface ExpenseAuditLogDocument {
    id: string;              // Unique log document ID (Firestore auto-generated)
    expenseId: string;       // Foreign key pointing to the target expenses/{id}
    expenseCode: string;     // Cached business code: EXP-[FACULTY]-[MMYY]-[CRYPTO] for fast UI rendering
    actorId: string;         // uid of the user performing the action
    actorName: string;       // Full name of the actor for static snapshot reference
    actorRole: Role;         // Role at the time of action (e.g., LEVEL_2_DEAN)
    actorType: UserType;     // User type context (e.g., TEACHER)
    actorCode: string;
    facultyId: FacultyId;
    action: AuditAction;     // Action triggered (SUBMIT, RESUBMIT, APPROVE, REJECT, DISBURSE)
    status: ExpenseStatus;   // The next resulting workflow state
    createdAt: string; // Cryptographically accurate execution time
    rejectReason?: string;   // Contextual input field mandatory during REJECT operations
}