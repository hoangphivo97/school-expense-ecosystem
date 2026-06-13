import { Injectable, Inject } from '@nestjs/common';
import { UserRepository, PaginatedUserResult } from '../user.repository';
import { UserBase } from '@school-expense-ecosystem/auth/types';
import * as admin from 'firebase-admin';

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
}