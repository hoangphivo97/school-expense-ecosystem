import { Injectable, Inject } from '@nestjs/common';
import { UserBase } from '@school-expense-ecosystem/auth/types';

@Injectable()
export class UserListService {
    constructor(
        @Inject('FIRESTORE_INSTANCE') private readonly firestore: any,
    ) { }

    async findAllUsers(): Promise<UserBase[]> {
        const snapshot = await this.firestore.collection('users').get();
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