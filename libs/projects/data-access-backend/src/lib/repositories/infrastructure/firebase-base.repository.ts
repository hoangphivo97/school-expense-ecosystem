import { Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { UserStatus, UserType } from '@school-expense-ecosystem/shared/types';
import { JoinConfig, StudentSummary } from '@school-expense-ecosystem/projects/types';
import { EntityNotFoundException, InvalidJoinCodeException, JoinCapacityReachedException, JoinCodeExpiredException, JoinCodeNotStartedException, StudentAlreadyEnrolledException } from '../../exceptions/join-code.exception';

export interface JoinableBaseEntity {
  id: string;
  joinedStudentIds?: string[];
  joinConfig?: JoinConfig | null;
  [key: string]: any;
}

export abstract class FirebaseBaseRepository<T extends JoinableBaseEntity> {
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

  protected abstract mapDoc(doc: admin.firestore.DocumentSnapshot): T;

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

  async enrollStudentViaCode(id: string, studentId: string): Promise<T> {
    const docRef = this.collection.doc(id);

    return this.db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);
      if (!doc.exists) {
        throw new EntityNotFoundException(this.collectionName, id);
      }

      const entity = this.mapDoc(doc);
      const joinConfig = entity.joinConfig;

      if (!joinConfig || !joinConfig.isActive) {
        throw new InvalidJoinCodeException();
      }

      const joinedStudentIds = entity.joinedStudentIds ?? [];
      if (joinedStudentIds.includes(studentId)) {
        throw new StudentAlreadyEnrolledException(studentId);
      }

      const now = new Date();
      if (joinConfig.startsAt && now < new Date(joinConfig.startsAt)) {
        throw new JoinCodeNotStartedException(joinConfig.startsAt);
      }
      if (joinConfig.expiresAt && now > new Date(joinConfig.expiresAt)) {
        throw new JoinCodeExpiredException();
      }
      if (joinConfig.maxUses && (joinConfig.usedCount ?? joinedStudentIds.length) >= joinConfig.maxUses) {
        throw new JoinCapacityReachedException();
      }

      // Atomically append student ID and increment quota usage
      transaction.update(docRef, {
        joinedStudentIds: admin.firestore.FieldValue.arrayUnion(studentId),
        'joinConfig.usedCount': admin.firestore.FieldValue.increment(1),
        updatedAt: new Date().toISOString(),
      });

      return {
        ...entity,
        joinedStudentIds: [...joinedStudentIds, studentId],
        joinConfig: {
          ...joinConfig,
          usedCount: (joinConfig.usedCount ?? joinedStudentIds.length) + 1,
        },
      };
    });
  }
}