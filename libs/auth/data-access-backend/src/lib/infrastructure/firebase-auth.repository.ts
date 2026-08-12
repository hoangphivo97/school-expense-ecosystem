import { Injectable, Inject } from '@nestjs/common';
import { AuthUserRepository } from '../auth-user.repository';
import * as admin from 'firebase-admin';
import { ConflictReason, IAuthIdentityCheck, IConflictResolution } from '@school-expense-ecosystem/auth/types';
import { UserBase, UserStatus } from '@school-expense-ecosystem/shared/types';

@Injectable()
export class FirebaseAuthRepository implements AuthUserRepository {
    constructor(
        @Inject('FIRESTORE_INSTANCE') private readonly db: admin.firestore.Firestore
    ) { }

    async findByUid(uid: string): Promise<UserBase | null> {
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
        } as UserBase;
    }

    async createUser(userData: UserBase): Promise<UserBase> {
        const nativeDate = userData.createdAt ? new Date(userData.createdAt) : new Date();

        const firestorePayload = {
            ...userData,
            createdAt: admin.firestore.Timestamp.fromDate(nativeDate)
        };

        await this.db.collection('users').doc(userData.uid).set(firestorePayload);
        return userData;
    }

    async updateUser(uid: string, updateData: Partial<UserBase>): Promise<UserBase> {
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

    async validateIdentityConflict(check: IAuthIdentityCheck): Promise<IConflictResolution> {
        // Perform a highly optimized targeted query to locate an existing profile using the provided userCode
        const codeSnap = await this.db
            .collection('users')
            .where('userCode', '==', check.userCode)
            .limit(1)
            .get();

        // Scenario 1: The designated userCode is completely clean and unclaimed
        if (codeSnap.empty) {
            return { isConflict: false, reason: ConflictReason.NONE, shouldLinkPreCreatedAccount: false };
        }

        const existingUser = codeSnap.docs[0].data();

        // Scenario 2: Idempotent operation - The duplicate code belongs to the current user (Re-submission)
        if (existingUser['uid'] === check.uid) {
            return { isConflict: false, reason: ConflictReason.NONE, shouldLinkPreCreatedAccount: false };
        }

        // Scenario 3: Pre-allocated match - The record was pre-created by Admin via Excel and email matches exactly
        if (!existingUser['uid'] && existingUser['email'] === check.email) {
            return { isConflict: false, reason: ConflictReason.NONE, shouldLinkPreCreatedAccount: true };
        }

        // Scenario 4: Identity Collision - The code is already explicitly claimed and linked to a different Firebase UID
        if (existingUser['uid'] && existingUser['uid'] !== check.uid) {
            return { isConflict: true, reason: ConflictReason.CAD, shouldLinkPreCreatedAccount: false };
        }

        // Scenario 5: Security Anomaly - The code is pre-created but the registering email does not match the Admin record
        if (!existingUser['uid'] && existingUser['email'] !== check.email) {
            return { isConflict: true, reason: ConflictReason.EMWP, shouldLinkPreCreatedAccount: false };
        }

        return { isConflict: true, reason: ConflictReason.CAD, shouldLinkPreCreatedAccount: false };
    }

    async executeOnboarding(uid: string, data: any, shouldLink: boolean): Promise<void> {
        // Utilize Firestore Transactions to isolate the mutation and guard against parallel write race conditions
        await this.db.runTransaction(async (transaction) => {
            if (shouldLink) {
                // Locate the target pre-created administrative skeleton entry
                const userCodeQuery = await this.db
                    .collection('users')
                    .where('userCode', '==', data.userCode)
                    .limit(1)
                    .get();

                const targetDocRef = userCodeQuery.docs[0].ref;

                // Link the active Firebase identity into the pre-created slot
                transaction.update(targetDocRef, {
                    uid: uid,
                    status: UserStatus.PENDING, // Transition state to await ultimate approval clearance
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                // Purge the temporary shell record generated during the initial handshake step
                const tempDocRef = this.db.collection('users').doc(uid);
                transaction.delete(tempDocRef);
            } else {
                // Standard flow: Mutate the current active document context via structured merge operation
                const userRef = this.db.collection('users').doc(uid);
                transaction.set(userRef, {
                    ...data,
                    uid: uid,
                    status: UserStatus.PENDING, // Commit state into the standard verification queue
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }
        });
    }
}