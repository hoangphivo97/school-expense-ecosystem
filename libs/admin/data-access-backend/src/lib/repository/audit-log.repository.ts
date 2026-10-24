import { IAuditLogInput } from "@school-expense-ecosystem/admin/types";

export abstract class IAdminAuditLogRepository {
    abstract saveAdminActivityLog(logInput: IAuditLogInput): Promise<void>;
}