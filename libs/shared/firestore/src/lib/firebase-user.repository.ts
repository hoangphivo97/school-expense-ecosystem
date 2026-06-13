import { Injectable, Inject } from '@nestjs/common';
import { UserRepository, PaginatedUserResult } from '@school-expense-ecosystem/admin/features-backend';
import { UserBase } from '@school-expense-ecosystem/auth/types';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseUserRepository implements UserRepository {
  constructor(@Inject('FIRESTORE_INSTANCE') private readonly firestore: any) { }

  async findPaginated(filters: { facultyId?: string; limit: number; pageToken?: string }): Promise<PaginatedUserResult> {
    let query = this.firestore.collection('users').orderBy('createdAt', 'desc');

    if (filters.facultyId) {
      query = query.where('facultyId', '==', filters.facultyId);
    }

    const countSnapshot = await query.count().get();
    const totalItems = countSnapshot.data().count;

    if (filters.pageToken) {
      const decodedCursorValue = Buffer.from(filters.pageToken, 'base64').toString('utf-8');
      query = query.startAfter(decodedCursorValue);
    }

    const snapshot = await query.limit(filters.limit).get();

    const users: UserBase[] = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();

      const cleanedCreateAt = data.createdAt instanceof admin.firestore.Timestamp
        ? data.createdAt.toDate()
        : (data.createdAt ? new Date(data.createdAt) : null);

      users.push({
        id: doc.id,
        ...data,
        createdAt: cleanedCreateAt // Đè đống _seconds/_nanoseconds bằng Date sạch
      } as unknown as UserBase);
    });

    let nextPageToken: string | null = null;
    if (users.length === filters.limit) {
      const lastUser = users[users.length - 1];
      nextPageToken = Buffer.from((lastUser as any).createdAt).toString('base64');
    }

    return {
      users,
      nextPageToken,
      totalItems
    };
  }
}