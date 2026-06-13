// firebase-user.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { AuthUserRepository } from '@school-expense-ecosystem/backend/auth/data-access';
import { UserInDb } from '@school-expense-ecosystem/backend/auth/data-access';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAuthRepository implements AuthUserRepository {
    constructor(
        @Inject('FIRESTORE_INSTANCE') private readonly db: admin.firestore.Firestore
    ) { }

    async findByUid(uid: string): Promise<UserInDb | null> {
        const doc = await this.db.collection('users').doc(uid).get();
        if (!doc.exists) return null;

        const data = doc.data();
        if (!data) return null;

        const cleanedCreatedAt = data['createdAt'] instanceof admin.firestore.Timestamp
            ? data['createdAt'].toDate()
            : (data['createdAt'] ? new Date(data['createdAt']) : new Date());

        return {
            ...data,
            uid: data['uid'] || doc.id,
            createdAt: cleanedCreatedAt
        } as unknown as UserInDb;
    }

    async createUser(userData: UserInDb): Promise<UserInDb> {
        const nativeDate = userData.createdAt ? new Date(userData.createdAt) : new Date();

        const firestorePayload = {
            ...userData,
            createdAt: admin.firestore.Timestamp.fromDate(nativeDate) // Lưu xuống DB dạng Timestamp xịn
        };

        await this.db.collection('users').doc(userData.uid).set(firestorePayload);
        return userData;
    }

    async updateUser(uid: string, updateData: Partial<UserInDb>): Promise<UserInDb> {
        const docRef = this.db.collection('users').doc(uid);

        const firestoreUpdateData: Record<string, any> = { ...updateData };

        if (updateData.createdAt) {
            firestoreUpdateData['createdAt'] = admin.firestore.Timestamp.fromDate(new Date(updateData.createdAt));
        }

        await docRef.update(firestoreUpdateData);

        const updatedUser = await this.findByUid(uid);
        if (!updatedUser) {
            throw new Error(`Failed to fetch updated user record for identifier: ${uid}`);
        }

        return updatedUser;
    }
}