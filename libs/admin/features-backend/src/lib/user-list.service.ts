import { Injectable } from '@nestjs/common';
import { UserBase, } from '@school-expense-ecosystem/shared/types';
import { UserRepository } from './repository/user.repository';
import { AdminIdentityConflictException, AdminInvalidDeletionStatusException, AdminPeerProtectionException, AdminSecurityThreatException, AdminSelfMutationException, AdminUserNotFoundException, CreateUserDto, DeleteUserDto, UpdateUserDto } from '@school-expense-ecosystem/admin/data-access-backend';
import { AdminActionType, CreateUserInput, CreateUserResult, DeleteReasonType, IAdminExecutor, IAuditLogChanges, UserQueryPayload } from '@school-expense-ecosystem/admin/types';
import { IAdminAuditLogRepository } from './repository/audit-log.repository';
import { UserStatus, Role } from '@school-expense-ecosystem/shared/types';

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

    async provisionNewUserByAdmin(executor: IAdminExecutor, dto: CreateUserDto): Promise<CreateUserResult> {
        const hasConflict = await this.userRepository.checkIdentityConflict(dto.email, dto.userCode);
        if (hasConflict) {
            throw new AdminIdentityConflictException();
        }

        if (dto.role === Role.LEVEL_0_ADMIN || dto.role === Role.LEVEL_1_FINANCE) {
            dto.facultyId = undefined;
        }

        const uid = await this.userRepository.createAuthAccount(dto.email, dto.fullName, dto.password);

        const userPayload: CreateUserInput & { username: string } = {
            email: dto.email,
            role: dto.role,
            userType: dto.userType,
            fullName: dto.fullName,
            userCode: dto.userCode,
            createdBy: executor.uid,
            username: dto.email.split('@')[0],
            ...(dto.facultyId && { facultyId: dto.facultyId })
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

    async updateUserByAdmin(targetUid: string, executor: IAdminExecutor, dto: UpdateUserDto): Promise<{ success: boolean }> {
        const targetUser = await this.validateAndGetTargetUser(targetUid, executor.uid);

        if (dto.role === Role.LEVEL_0_ADMIN || dto.role === Role.LEVEL_1_FINANCE) {
            dto.facultyId = undefined;
        }

        const changes: IAuditLogChanges = {};

        if (dto.role !== undefined && dto.role !== targetUser.role) {
            changes['role'] = { old: targetUser.role || null, new: dto.role };
        }

        if (dto.facultyId !== undefined && dto.facultyId !== targetUser.facultyId) {
            changes['facultyId'] = { old: targetUser.facultyId || null, new: dto.facultyId };
        }

        await this.userRepository.updateUserFields(targetUid, dto);

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

    async deleteUserByAdmin(targetUid: string, executor: IAdminExecutor, dto: DeleteUserDto): Promise<{ success: boolean }> {
        const targetUser = await this.validateAndGetTargetUser(targetUid, executor.uid);

        if (targetUser.status !== UserStatus.REJECTED) {
            throw new AdminInvalidDeletionStatusException();
        }

        if (dto.reasonType === DeleteReasonType.INPUT_ERROR) {
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

        if (dto.reasonType === DeleteReasonType.SECURITY_THREAT) {
            throw new AdminSecurityThreatException();
        }

        return { success: false };
    }
}