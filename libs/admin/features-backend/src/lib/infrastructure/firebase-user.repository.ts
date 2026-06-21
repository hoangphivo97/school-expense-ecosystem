import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';
import { UserBase } from '@school-expense-ecosystem/auth/types';
import * as admin from 'firebase-admin';
import { CreateUserInput, CreateUserResult, PaginatedUserResult, UpdateUserInput } from '@school-expense-ecosystem/admin/types';

@Injectable()
export class FirebaseUserRepository implements UserRepository {
  constructor(@Inject('FIRESTORE_INSTANCE') private readonly db: admin.firestore.Firestore) { }

  async findPaginated(filters: { facultyId?: string; limit: number; pageToken?: string }): Promise<PaginatedUserResult> {
    let query: admin.firestore.Query = this.db.collection('users').orderBy('createdAt', 'desc');

    if (filters.facultyId) {
      query = query.where('facultyId', '==', filters.facultyId);
    }

    if (filters.pageToken) {
      const startDoc = await this.db.collection('users').doc(filters.pageToken).get();
      if (startDoc.exists) {
        query = query.startAfter(startDoc);
      }
    }

    const snapshot = await query.limit(filters.limit).get();
    const users: UserBase[] = [];

    snapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      const data = doc.data();

      const cleanedCreatedAt = data['createdAt'] instanceof admin.firestore.Timestamp
        ? data['createdAt'].toDate()
        : (data['createdAt'] ? new Date(data['createdAt']) : null);

      users.push({
        id: doc.id,
        ...data,
        createdAt: cleanedCreatedAt
      } as unknown as UserBase);
    });

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const nextPageToken = lastDoc ? lastDoc.id : null;

    const countSnapshot = await this.db.collection('users').count().get();
    const totalItems = countSnapshot.data().count;

    return {
      users,
      nextPageToken,
      totalItems
    };
  }

  async findById(uid: string): Promise<any | null> {
    const doc = await this.db.collection('users').doc(uid).get();
    return doc.exists ? doc.data() : null;
  }

  async updateUserFields(uid: string, updateData: UpdateUserInput): Promise<void> {
    const cleanedData = { ...updateData, updatedAt: new Date() };
    await this.db.collection('users').doc(uid).update(cleanedData);
  }

  async checkIdentityConflict(email: string, userCode: string): Promise<boolean> {
    const emailSnap = await this.db.collection('users').where('email', '==', email).limit(1).get();
    if (!emailSnap.empty) return true;
    const codeSnap = await this.db.collection('users').where('userCode', '==', userCode).limit(1).get();
    return !codeSnap.empty;
  }

  async createUserRecord(uid: string, userData: CreateUserInput): Promise<CreateUserResult> {
    await this.db.collection('users').doc(uid).set({
      ...userData,
      uid,
      status: 'active',
      createdAt: new Date()
    });
    return { id: uid, success: true };
  }

  async createAuthAccount(email: string, fullName: string, password?: string): Promise<string> {
    try {
      const config: admin.auth.CreateRequest = {
        email,
        displayName: fullName,
        disabled: false,
        emailVerified: true
      };
      if (password) config.password = password;

      const authRecord = await admin.auth().createUser(config);
      return authRecord.uid;
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        throw new ConflictException('The email address is already in use by another account.');
      }
      throw error;
    }
  }
}