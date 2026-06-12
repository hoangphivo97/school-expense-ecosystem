import { Injectable, Inject } from '@nestjs/common';
import { Role, UserBase } from '@school-expense-ecosystem/auth/types';
import * as admin from 'firebase-admin';

@Injectable()
export class UserListService {
    constructor(
        @Inject('FIRESTORE_INSTANCE') private readonly firestore: any,
    ) { }

    async findAllUsers(requester: UserBase): Promise<UserBase[]> {
        let userQuery: admin.firestore.Query = this.firestore.collection('users');

        if (requester.role === Role.LEVEL_2_DEAN) {
            userQuery = userQuery.where('facultyId', '==', requester.facultyId);
        }
        const snapshot = await userQuery.get();
        const users: UserBase[] = [];

        snapshot.forEach((doc: any) => {
            users.push({
                id: doc.id,
                ...doc.data()
            } as UserBase);
        });

        return users;
    }
}