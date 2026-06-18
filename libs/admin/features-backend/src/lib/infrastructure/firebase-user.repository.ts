import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { UserRepository } from '../user.repository';
import { UserBase } from '@school-expense-ecosystem/auth/types';
import * as admin from 'firebase-admin';
import { CreateUserInput, CreateUserResult, PaginatedUserResult, UpdateUserInput, UpdateUserResult } from '@school-expense-ecosystem/admin/types';

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

  async updateUserRecord(uid: string, data: UpdateUserInput): Promise<UpdateUserResult> {
    const docRef = this.db.collection("users").doc(uid);

    const updateData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    await docRef.update(updateData);

    return { id: uid, success: true };
  }

  async checkIdentityConflict(email: string, userCode: string): Promise<boolean> {
    const emailSnap = await this.db.collection('users').where('email', '==', email).limit(1).get();
    if (!emailSnap.empty) return true;
    const codeSnap = await this.db.collection('users').where('userCode', '==', userCode).limit(1).get();
    return !codeSnap.empty;
  }

  async createUserRecord(uid: string, userData: CreateUserInput): Promise<CreateUserResult> {
    const docRef = this.db.collection('users').doc(uid);

    await docRef.set({
      ...userData,
      uid: uid,
      status: 'active',
      createdAt: new Date()
    });

    return {
      id: uid,
      success: true
    };
  }

  async createAuthAccount(email: string, fullName: string): Promise<string> {
    try {
      const authRecord = await admin.auth().createUser({
        email: email,
        displayName: fullName,
        disabled: false
      });
      
      return authRecord.uid; // Trả về chuỗi uid sạch sẽ cho tầng logic xài
    } catch (error: any) {
      if (error.code === "auth/email-already-exists") {
        throw new ConflictException("The email address is already in use by another authentication account.");
      }
      throw error;
    }
  }
}