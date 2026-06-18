import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Role, UserBase } from '@school-expense-ecosystem/auth/types';
import { UserRepository } from './user.repository';
import { CreateUserDto, UpdateUserDto } from 'admin-data-access-backend';
import { CreateUserResult } from '@school-expense-ecosystem/admin/types';

@Injectable()
export class UserListService {
    constructor(
        private readonly userRepo: UserRepository
    ) { }

    async getUsersForAdmin(requester: UserBase, limit: number, pageToken?: string) {
        const facultyIdFilter = requester.role === Role.LEVEL_2_DEAN ? requester.facultyId : undefined;

        return this.userRepo.findPaginated({
            facultyId: facultyIdFilter,
            limit,
            pageToken
        });
    }

    async provisionNewUserByAdmin(executorUid: string, dto: CreateUserDto): Promise<CreateUserResult> {
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

            return await this.userRepo.createUserRecord(uid, userPayload);
        } catch (error: any) {
            if (error instanceof ConflictException) throw error;
            throw new InternalServerErrorException('Account provisioning failed due to infrastructure error.');
        }
    }

    async updateUserByAdmin(targetUid: string, executorUid: string, dto: UpdateUserDto): Promise<{ success: boolean }> {
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

        await this.userRepo.updateUserFields(targetUid, dto);
        return { success: true };
    }
}