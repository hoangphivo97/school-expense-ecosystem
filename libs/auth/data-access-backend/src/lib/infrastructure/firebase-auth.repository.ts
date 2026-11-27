import { Injectable, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConflictReason, IAuthIdentityCheck, IConflictResolution, OnboardingData } from '@school-expense-ecosystem/auth/types';
import { UserBase, UserStatus } from '@school-expense-ecosystem/shared/types';
import { AuthUserRepository, StatusTransitionResult } from './auth-user.repository';

@Injectable()
export class FirebaseAuthRepository implements AuthUserRepository {
    constructor(
        @Inject('FIRESTORE_INSTANCE') private readonly db: admin.firestore.Firestore
    ) { }

    protected get userCollection() {
        return this.db.collection('users');
    }

    private dateToTimestamp(date: Date) {
        return admin.firestore.Timestamp.fromDate(date)
    }

    private mapToUserBase(docId: string, data: admin.firestore.DocumentData): UserBase {
        const parseTimestamp = (value: unknown, fallback?: Date): Date | undefined => {
            if (value instanceof admin.firestore.Timestamp) {
                return value.toDate();
            }
            return value ? new Date(value as string | number | Date) : fallback;
        };

        return {
            ...data,
            uid: data['uid'] || docId,
            createdAt: parseTimestamp(data['createdAt'], new Date()),
            ...(data['updatedAt'] ? { updatedAt: parseTimestamp(data['updatedAt']) } : {}),
        } as UserBase;
    }

    async findByUid(uid: string): Promise<UserBase | null> {
        const doc = await this.userCollection.doc(uid).get();
        if (!doc.exists) return null;

        const data = doc.data();
        if (!data) return null;

        return this.mapToUserBase(doc.id, data);
    }

    async createUser(userData: UserBase): Promise<UserBase> {
        const nativeDate = userData.createdAt ? new Date(userData.createdAt) : new Date();

        const firestorePayload = {
            ...userData,
            createdAt: this.dateToTimestamp(nativeDate)
        };

        await this.userCollection.doc(userData.uid).set(firestorePayload);
        return userData;
    }

    async updateUser(uid: string, updateData: Partial<UserBase>): Promise<UserBase> {
        const docRef = this.userCollection.doc(uid);

        const firestoreUpdateData: Record<string, unknown> = { ...updateData };

        if (updateData.createdAt) {
            firestoreUpdateData['createdAt'] = this.dateToTimestamp(new Date(updateData.createdAt));
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

    async executeOnboarding(uid: string, data: OnboardingData, shouldLink: boolean): Promise<void> {
        // Utilize Firestore Transactions to isolate the mutation and guard against parallel write race conditions
        await this.db.runTransaction(async (transaction) => {
            if (shouldLink) {
                // Locate the target pre-created administrative skeleton entry
                const userCodeQuery = await this.userCollection
                .where('userCode', '==', data.userCode)
                .limit(1);

                const querySnap = await transaction.get(userCodeQuery);

                const targetDocRef = querySnap.docs[0].ref;

                // Link the active Firebase identity into the pre-created slot
                transaction.update(targetDocRef, {
                    ...data,
                    uid,
                    status: UserStatus.PENDING, // Transition state to await ultimate approval clearance
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                // Purge the temporary shell record generated during the initial handshake step
                if(targetDocRef.id !== uid){
                    const tempDocRef = this.userCollection.doc(uid);
                    transaction.delete(tempDocRef);
                }
            } else {
                // Standard flow: Read current document state under transaction lock before merging
                const userRef = this.userCollection.doc(uid);
                const userDoc = await transaction.get(userRef);
                const existingData = userDoc.data();

                const payload: Record<string, unknown> = {
                    ...data,
                    uid,
                    status: UserStatus.PENDING, // Commit state into the standard verification queue
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                };

                // Preserve original creation timestamp across draft re-submissions
                if (!existingData?.['createdAt']) {
                    payload['createdAt'] = admin.firestore.FieldValue.serverTimestamp();
                }

                transaction.set(userRef, payload, { merge: true });
            }
        });
    }

    async transitionStatusAtomic(
        uid: string,
        allowedCurrentStatuses: UserStatus[],
        nextStatus: UserStatus
    ): Promise<StatusTransitionResult> {
        const userRef = this.userCollection.doc(uid);

        return this.db.runTransaction<StatusTransitionResult>(async (transaction) => {
            // Read document under pessimistic lock to prevent concurrent state overwrite
            const doc = await transaction.get(userRef);

            if (!doc.exists) {
                return { outcome: 'NOT_FOUND' };
            }

            const rawData = doc.data() as admin.firestore.DocumentData;
            const currentStatus = rawData['status'] as UserStatus;

            if (!allowedCurrentStatuses.includes(currentStatus)) {
                return { outcome: 'STATUS_MISMATCH', currentStatus };
            }

            transaction.update(userRef, {
                status: nextStatus,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            const normalizedUser = this.mapToUserBase(uid, {
                ...rawData,
                status: nextStatus,
                updatedAt: new Date(),
            });

            return { outcome: 'SUCCESS', user: normalizedUser };
        });
    }
}