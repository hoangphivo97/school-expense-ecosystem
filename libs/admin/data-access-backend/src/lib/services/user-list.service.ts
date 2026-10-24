import { Injectable } from '@nestjs/common';
import { UserBase, } from '@school-expense-ecosystem/shared/types';
import { AdminActionType, CreateUserInput, CreateUserPayload, CreateUserResult, DeleteReasonType, DeleteUserPayload, IAdminExecutor, IAuditLogChanges, UpdateUserPayload, UserQueryPayload } from '@school-expense-ecosystem/admin/types';
import { UserStatus, Role } from '@school-expense-ecosystem/shared/types';
import { UserRepository } from '../repository/user.repository';
import { IAdminAuditLogRepository } from '../repository/audit-log.repository';
import { AdminIdentityConflictException, AdminInvalidDeletionStatusException, AdminPeerProtectionException, AdminSecurityThreatException, AdminSelfMutationException, AdminUserNotFoundException } from '../exceptions/admin.exception';

@Injectable()
export class UserListBackendService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly auditLogRepository: IAdminAuditLogRepository
    ) { }

    async getUsersForManagement(requester: UserBase, query: UserQueryPayload) {
        const facultyIdFilter = requester.role === Role.LEVEL_2_DEAN ? requester.facultyId : undefined;
        const limit = query.limit ? Number(query.limit) : 10;

        return this.userRepository.findPaginated({
            ...query,
            limit,
            facultyId: facultyIdFilter,
        });
    }

    async provisionNewUserByAdmin(executor: IAdminExecutor, payload: CreateUserPayload): Promise<CreateUserResult> {
        const hasConflict = await this.userRepository.checkIdentityConflict(payload.email, payload.userCode);
        if (hasConflict) {
            throw new AdminIdentityConflictException();
        }

        const isGlobalRole = payload.role === Role.LEVEL_0_ADMIN || payload.role === Role.LEVEL_1_FINANCE;
        const resolvedFacultyId = isGlobalRole ? null : (payload.facultyId ?? null);
        const uid = await this.userRepository.createAuthAccount(payload.email, payload.fullName, payload.password);

        const userPayload: CreateUserInput & { username: string } = {
            email: payload.email,
            role: payload.role,
            userType: payload.userType,
            fullName: payload.fullName,
            userCode: payload.userCode,
            createdBy: executor.uid,
            username: payload.email.split('@')[0],
            facultyId: resolvedFacultyId
        };

        const result = await this.userRepository.createUserRecord(uid, userPayload);

        await this.auditLogRepository.saveAdminActivityLog({
            actorUid: executor.uid,
            actorEmail: executor.email,
            action: AdminActionType.USER_CREATE,
            targetIds: [uid]
        });

        return result;
    }

    async updateUserByAdmin(targetUid: string, executor: IAdminExecutor, payload: UpdateUserPayload): Promise<{ success: boolean }> {
        const targetUser = await this.validateAndGetTargetUser(targetUid, executor.uid);

        if (payload.role === Role.LEVEL_0_ADMIN || payload.role === Role.LEVEL_1_FINANCE) {
            payload.facultyId = null;
        }

        const changes: IAuditLogChanges = {};

        if (payload.role !== undefined && payload.role !== targetUser.role) {
            changes['role'] = { old: targetUser.role || null, new: payload.role };
        }

        if (payload.facultyId !== undefined && payload.facultyId !== targetUser.facultyId) {
            changes['facultyId'] = { old: targetUser.facultyId || null, new: payload.facultyId };
        }

        await this.userRepository.updateUserFields(targetUid, payload);

        if (Object.keys(changes).length > 0) {
            const action = 'role' in changes
                ? AdminActionType.USER_ROLE_CHANGE
                : AdminActionType.USER_FACULTY_CHANGE;

            await this.auditLogRepository.saveAdminActivityLog({
                actorUid: executor.uid,
                actorEmail: executor.email,
                action,
                targetIds: [targetUid],
                changes
            });
        }

        return { success: true };
    }

    async updateUserStatusByAdmin(targetUid: string, executor: IAdminExecutor, status: UserStatus, reason?: string): Promise<{ success: boolean }> {
        const targetUser = await this.validateAndGetTargetUser(targetUid, executor.uid);

        if (status === targetUser.status) {
            return { success: true };
        }

        const changes: IAuditLogChanges = {
            status: { old: targetUser.status || null, new: status }
        };

        await this.userRepository.updateStatus(targetUid, status, reason);

        await this.auditLogRepository.saveAdminActivityLog({
            actorUid: executor.uid,
            actorEmail: executor.email,
            action: AdminActionType.USER_STATUS_CHANGE,
            targetIds: [targetUid],
            changes,
            ...(reason ? { reason } : {})
        });

        return { success: true };
    }

    private async validateAndGetTargetUser(targetUid: string, executorUid: string): Promise<UserBase> {
        if (targetUid === executorUid) {
            throw new AdminSelfMutationException();
        }

        const targetUser = await this.userRepository.findById(targetUid);
        if (!targetUser) {
            throw new AdminUserNotFoundException();
        }

        if (targetUser.role === Role.LEVEL_0_ADMIN) {
            throw new AdminPeerProtectionException();
        }

        return targetUser;
    }

    async deleteUserByAdmin(targetUid: string, executor: IAdminExecutor, payload: DeleteUserPayload): Promise<{ success: boolean }> {
        const targetUser = await this.validateAndGetTargetUser(targetUid, executor.uid);

        if (targetUser.status !== UserStatus.REJECTED) {
            throw new AdminInvalidDeletionStatusException();
        }

        if (payload.reasonType === DeleteReasonType.INPUT_ERROR) {
            await this.userRepository.deleteAuthAccount(targetUid);
            await this.userRepository.deleteUserRecord(targetUid);

            await this.auditLogRepository.saveAdminActivityLog({
                actorUid: executor.uid,
                actorEmail: executor.email,
                action: AdminActionType.USER_DELETE,
                targetIds: [targetUid],
                changes: {
                    deletionReason: { old: null, new: DeleteReasonType.INPUT_ERROR }
                }
            });

            return { success: true };
        }

        if (payload.reasonType === DeleteReasonType.SECURITY_THREAT) {
            throw new AdminSecurityThreatException();
        }

        return { success: false };
    }
}