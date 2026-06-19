import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Role, UserBase, UserStatus } from '@school-expense-ecosystem/auth/types';
import { UserRepository } from './repository/user.repository';
import { CreateUserDto, UpdateUserDto } from 'admin-data-access-backend';
import { AdminActionType, CreateUserResult, IAuditLogChanges } from '@school-expense-ecosystem/admin/types';
import { IAdminAuditLogRepository } from './repository/audit-log.repository';

@Injectable()
export class UserListService {
    constructor(
        private readonly userRepo: UserRepository,
        private readonly auditLogRepo: IAdminAuditLogRepository
    ) { }

    async getUsersForAdmin(requester: UserBase, limit: number, pageToken?: string) {
        const facultyIdFilter = requester.role === Role.LEVEL_2_DEAN ? requester.facultyId : undefined;

        return this.userRepo.findPaginated({
            facultyId: facultyIdFilter,
            limit,
            pageToken
        });
    }

    async provisionNewUserByAdmin(executorUid: string, executorEmail: string, dto: CreateUserDto): Promise<CreateUserResult> {
        const hasConflict = await this.userRepo.checkIdentityConflict(dto.email, dto.userCode);
        if (hasConflict) {
            throw new ConflictException('Identity conflict: Email or User Code is already registered.');
        }

        if (dto.role === Role.LEVEL_0_ADMIN || dto.role === Role.LEVEL_1_FINANCE) {
            dto.facultyId = undefined;
        }

        try {
            const uid = await this.userRepo.createAuthAccount(dto.email, dto.fullName, dto.password);

            const userPayload: any = {
                email: dto.email,
                role: dto.role,
                userType: dto.userType,
                fullName: dto.fullName,
                userCode: dto.userCode,
                createdBy: executorUid,
                username: dto.email.split('@')[0]
            };
            if (dto.facultyId) userPayload.facultyId = dto.facultyId;

            const result = await this.userRepo.createUserRecord(uid, userPayload);

            await this.auditLogRepo.saveAdminActivityLog({
                actorUid: executorUid,
                actorEmail: executorEmail,
                action: AdminActionType.USER_CREATE,
                targetIds: [uid]
            });

            return result;
        } catch (error: any) {
            if (error instanceof ConflictException) throw error;
            throw new InternalServerErrorException('Account provisioning failed due to infrastructure error.');
        }
    }

    async updateUserByAdmin(targetUid: string, executorUid: string, executorEmail: string, dto: UpdateUserDto): Promise<{ success: boolean }> {
        const targetUser = await this.userRepo.findById(targetUid);
        if (targetUid === executorUid) {
            throw new ForbiddenException(
                'Administrative safety policy violation: Self-mutation of operational roles or status within the management pool is strictly prohibited.'
            );
        }

        if (!targetUser) {
            throw new NotFoundException('Target user record does not exist.');
        }

        if (targetUser.createdBy && targetUser.createdBy !== executorUid && targetUser.role === Role.LEVEL_0_ADMIN) {
            throw new ForbiddenException('Security violation: Peer Protection active. You cannot modify an elite Administrator.');
        }

        if (dto.role === Role.LEVEL_0_ADMIN || dto.role === Role.LEVEL_1_FINANCE) {
            dto.facultyId = undefined;
        }

        const changes: IAuditLogChanges = {};
        let determinedAction: AdminActionType | null = null;

        if (dto.role !== undefined && dto.role !== targetUser.role) {
            changes['role'] = { old: targetUser.role || null, new: dto.role };
            determinedAction = AdminActionType.ROLE_CHANGE; // Escalates action classification
        }
        if (dto.facultyId !== undefined && dto.facultyId !== targetUser.facultyId) {
            changes['facultyId'] = { old: targetUser.facultyId || null, new: dto.facultyId };
            determinedAction = AdminActionType.FACULTY_ASSIGNMENT_CHANGE;
        }
        if (dto.status !== undefined && dto.status !== targetUser.status) {
            changes['status'] = { old: targetUser.status || null, new: dto.status };
            determinedAction = dto.status === UserStatus.ACTIVE ? AdminActionType.USER_ACTIVATE : AdminActionType.USER_DEACTIVATE;
        }

        // Execute the database mutation state overwrite
        await this.userRepo.updateUserFields(targetUid, dto);

        // 🚀 AUDIT TRAIL: Dispatch activity logs strictly if actionable mutations occurred
        if (Object.keys(changes).length > 0) {
            await this.auditLogRepo.saveAdminActivityLog({
                actorUid: executorUid,
                actorEmail: executorEmail,
                action: this.determineAdminAction(changes, dto.status), // 🌟 Clean abstraction call
                targetIds: [targetUid],
                changes
            });
        }

        return { success: true };
    }

    private determineAdminAction(changes: IAuditLogChanges, status?: UserStatus): AdminActionType {
        if ('role' in changes) return AdminActionType.ROLE_CHANGE;
        if ('facultyId' in changes) return AdminActionType.FACULTY_ASSIGNMENT_CHANGE;
        
        return status === UserStatus.ACTIVE
            ? AdminActionType.USER_ACTIVATE 
            : AdminActionType.USER_DEACTIVATE;
    }
}