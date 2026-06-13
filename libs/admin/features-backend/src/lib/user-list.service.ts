import { Injectable, Inject } from '@nestjs/common';
import { Role, UserBase } from '@school-expense-ecosystem/auth/types';
import * as admin from 'firebase-admin';
import { UserRepository } from './user.repository';

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
}