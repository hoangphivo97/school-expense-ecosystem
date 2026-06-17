import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Role, UserBase } from '@school-expense-ecosystem/auth/types';
import { UserRepository } from './user.repository';
import { CreateUserDto } from 'admin-data-access-backend';
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

    async provisionNewUserByAdmin(dto: CreateUserDto): Promise<CreateUserResult> {
        const hasConflict = await this.userRepo.checkIdentityConflict(dto.email, dto.userCode);
        if (hasConflict) {
            throw new ConflictException("Identity conflict: Email or User Code is already registered in the directory.");
        }

        try {
            const uid = await this.userRepo.createAuthAccount(dto.email, dto.fullName);

            const userPayload = {
                fullName: dto.fullName,
                email: dto.email,
                userCode: dto.userCode,
                role: dto.role,
                userType: dto.userType,
                facultyId: dto.facultyId || null,
                username: dto.email.split("@")[0]
            };

            return await this.userRepo.createUserRecord(uid, userPayload);
        } catch (error: any) {
            if (error instanceof ConflictException) throw error;

            console.error("Infrastructure orchestration failure:", error);
            throw new InternalServerErrorException("Account provisioning failed due to infrastructure error.");
        }
    }
}