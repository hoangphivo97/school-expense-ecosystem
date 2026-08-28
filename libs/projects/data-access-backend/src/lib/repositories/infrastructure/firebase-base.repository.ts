import { Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { UserStatus, UserType } from '@school-expense-ecosystem/shared/types';
import { StudentSummary } from '@school-expense-ecosystem/projects/types';

export abstract class FirebaseBaseRepository<T> {
  constructor(
    @Inject('FIRESTORE_INSTANCE') protected readonly db: admin.firestore.Firestore,
    protected readonly collectionName: string
  ) {}

  protected get collection() {
    return this.db.collection(this.collectionName);
  }

  protected get usersCollection() {
    return this.db.collection('users');
  }

  /**
   * Search active student users across the entire ecosystem
   */
  async searchStudents(query: string, limitCount = 20): Promise<StudentSummary[]> {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    const snapshot = await this.usersCollection
      .where('userType', '==', UserType.STUDENT)
      .where('status', '==', UserStatus.ACTIVE)
      .limit(100)
      .get();

    const matchedStudents: StudentSummary[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const userCode = String(data['userCode'] || '').trim();
      const fullName = String(data['fullName'] || '').trim();
      const email = String(data['email'] || '').trim();

      if (
        fullName.toLowerCase().includes(normalizedQuery) ||
        userCode.toLowerCase().includes(normalizedQuery) ||
        email.toLowerCase().includes(normalizedQuery)
      ) {
        matchedStudents.push({
          id: doc.id,
          studentCode: userCode,
          fullName: fullName,
          email: email,
        });

        if (matchedStudents.length >= limitCount) break;
      }
    }

    return matchedStudents;
  }

  /**
   * Atomically append array of student IDs to a document
   */
  async addStudentsBulk(id: string, studentIds: string[]): Promise<void> {
    await this.collection.doc(id).update({
      joinedStudentIds: admin.firestore.FieldValue.arrayUnion(...studentIds),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Atomically remove a single student ID from a document
   */
  async removeStudent(id: string, studentUid: string): Promise<void> {
    await this.collection.doc(id).update({
      joinedStudentIds: admin.firestore.FieldValue.arrayRemove(studentUid),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Universal date formatter for Firestore Timestamp / Date / string
   */
  protected formatDate(dateVal: any): string {
    if (!dateVal) return new Date().toISOString();
    if (typeof dateVal === 'string') return dateVal;
    if (dateVal.toDate && typeof dateVal.toDate === 'function') {
      return dateVal.toDate().toISOString();
    }
    if (dateVal instanceof Date) return dateVal.toISOString();
    return new Date(dateVal).toISOString();
  }
}