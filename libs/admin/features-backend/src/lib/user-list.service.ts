import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Role, UserBase, UserStatus } from '@school-expense-ecosystem/auth/types';
import { UserRepository } from './repository/user.repository';
import { CreateUserDto, UpdateUserDto } from 'admin-data-access-backend';
import { AdminActionType, CreateUserResult, IAdminExecutor, IAuditLogChanges } from '@school-expense-ecosystem/admin/types';
import { IAdminAuditLogRepository } from './repository/audit-log.repository';

@Injectable()
export class UserListService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly auditLogRepository: IAdminAuditLogRepository
    ) { }

    async getUsersForAdmin(requester: UserBase, limit: number, pageToken?: string) {
        const facultyIdFilter = requester.role === Role.LEVEL_2_DEAN ? requester.facultyId : undefined;

        return this.userRepository.findPaginated({
            facultyId: facultyIdFilter,
            limit,
            pageToken
        });
    }

    async provisionNewUserByAdmin(executor: IAdminExecutor, dto: CreateUserDto): Promise<CreateUserResult> {
        const hasConflict = await this.userRepository.checkIdentityConflict(dto.email, dto.userCode);
        if (hasConflict) {
            throw new ConflictException('Identity conflict: Email or User Code is already registered.');
        }

        if (dto.role === Role.LEVEL_0_ADMIN || dto.role === Role.LEVEL_1_FINANCE) {
            dto.facultyId = undefined;
        }

        try {
            const uid = await this.userRepository.createAuthAccount(dto.email, dto.fullName, dto.password);

            const userPayload: any = {
                email: dto.email,
                role: dto.role,
                userType: dto.userType,
                fullName: dto.fullName,
                userCode: dto.userCode,
                createdBy: executor.uid,
                username: dto.email.split('@')[0]
            };
            if (dto.facultyId) userPayload.facultyId = dto.facultyId;

            const result = await this.userRepository.createUserRecord(uid, userPayload);

            await this.auditLogRepository.saveAdminActivityLog({
                actorUid: executor.uid,
                actorEmail: executor.email,
                action: AdminActionType.USER_CREATE,
                targetIds: [uid]
            });

            return result;
        } catch (error: any) {
            if (error instanceof ConflictException) throw error;
            throw new InternalServerErrorException('Account provisioning failed due to infrastructure error.');
        }
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

    private async validateAndGetTargetUser(targetUid: string, executorUid: string): Promise<any> {
        if (targetUid === executorUid) {
            throw new ForbiddenException(
                'Administrative safety policy violation: Self-mutation of operational roles or status within the management pool is strictly prohibited.'
            );
        }

        const targetUser = await this.userRepository.findById(targetUid);
        if (!targetUser) {
            throw new NotFoundException('Target user record does not exist.');
        }

        if (targetUser.createdBy && targetUser.createdBy !== executorUid && targetUser.role === Role.LEVEL_0_ADMIN) {
            throw new ForbiddenException('Security violation: Peer Protection active. You cannot modify an elite Administrator.');
        }

        return targetUser;
    }
}