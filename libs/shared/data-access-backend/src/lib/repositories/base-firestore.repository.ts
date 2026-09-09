import { Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConcurrencyConflictException } from '../exceptions/concurrency.exception';

export interface BaseEntity {
  id: string;
  updatedAt?: string;
  version?: number;
  [key: string]: any;
}

export abstract class BaseFirestoreRepository<T extends BaseEntity> {
  constructor(
    @Inject('FIRESTORE_INSTANCE') protected readonly db: admin.firestore.Firestore,
    protected readonly collectionName: string
  ) { }

  protected get collection() {
    return this.db.collection(this.collectionName);
  }

  protected abstract mapDoc(doc: admin.firestore.DocumentSnapshot): T;

  async create(entity: T): Promise<T> {
    await this.collection.doc(entity.id).set(entity);
    return entity;
  }

  async findById(id: string): Promise<T | null> {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? this.mapDoc(doc) : null;
  }

  /**
   * Global Optimistic Locking: Generic for all entities (Events, Projects, Expenses)
   */
  async updateWithOptimisticLock(
    id: string,
    data: Partial<T>,
    expectedUpdatedAt: string
  ): Promise<T> {
    const docRef = this.collection.doc(id);

    return this.db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);
      if (!doc.exists) {
        throw new Error(`Document with ID ${id} in ${this.collectionName} does not exist.`);
      }

      const current = this.mapDoc(doc);
      if (current.updatedAt && current.updatedAt !== expectedUpdatedAt) {
        throw new ConcurrencyConflictException(
          `Conflict on ${this.collectionName}: Record has been modified by another user.`
        );
      }

      const updatedPayload: Record<string, any> = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      transaction.update(docRef, updatedPayload);
      return { ...current, ...updatedPayload };
    });
  }

  /**
   * Global State Machine Transition: Guards workflow approvals atomically
   */
  async transitionStatus(
    id: string,
    targetStatus: string,
    allowedCurrentStatuses: string[],
    additionalData: Record<string, any> = {}
  ): Promise<T> {
    const docRef = this.collection.doc(id);

    return this.db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);
      if (!doc.exists) {
        throw new Error(`Document with ID ${id} in ${this.collectionName} does not exist.`);
      }

      const current = this.mapDoc(doc);
      if (!allowedCurrentStatuses.includes(current['status'])) {
        throw new ConcurrencyConflictException(
          `Cannot transition to "${targetStatus}". Current status "${current['status']}" is invalid.`
        );
      }

      const updatePayload: Record<string, any> = {
        ...additionalData,
        status: targetStatus,
        updatedAt: new Date().toISOString(),
      };

      transaction.update(docRef, updatePayload);
      return { ...current, ...updatePayload };
    });
  }
}