import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import {
  Event,
  EventQueryPayload,
} from '@school-expense-ecosystem/projects/types';
import { EventRepository } from '../abstracts/event.repository';
import { FirebaseBaseRepository } from './firebase-base.repository';
import {
  EventInitialSpentExceedsCapException,
  EventNotFoundException,
} from '../../exceptions/event.exception';

@Injectable()
export class FirebaseEventRepository
  extends FirebaseBaseRepository<Event>
  implements EventRepository {
  constructor(
    @Inject('FIRESTORE_INSTANCE') db: admin.firestore.Firestore
  ) {
    super(db, 'events');
  }

  private get departmentFundsCollection() {
    return this.db.collection('department_funds');
  }

  async create(event: Event): Promise<Event> {
    await this.collection.doc(event.id).set(event);
    return event;
  }

  async findById(id: string): Promise<Event | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.mapDoc(doc);
  }

  async findByJoinCode(code: string): Promise<Event | null> {
    const snapshot = await this.collection
      .where('joinConfig.code', '==', code)
      .where('joinConfig.isActive', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return this.mapDoc(snapshot.docs[0]);
  }

  async update(id: string, data: Partial<Event>): Promise<void> {
    await this.collection.doc(id).update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  async updateSpentCounters(
    id: string,
    deltas: { pendingSpentDelta?: number; currentSpentDelta?: number }
  ): Promise<void> {
    const updatePayload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (deltas.pendingSpentDelta !== undefined && deltas.pendingSpentDelta !== 0) {
      updatePayload['pendingSpent'] = admin.firestore.FieldValue.increment(deltas.pendingSpentDelta);
    }

    if (deltas.currentSpentDelta !== undefined && deltas.currentSpentDelta !== 0) {
      updatePayload['currentSpent'] = admin.firestore.FieldValue.increment(deltas.currentSpentDelta);
    }

    await this.collection.doc(id).update(updatePayload);
  }

  async findWithQuery(query: EventQueryPayload): Promise<{ items: Event[]; total: number }> {
    let baseQuery: admin.firestore.Query = this.collection;

    if (query.facultyId) baseQuery = baseQuery.where('facultyId', '==', query.facultyId);
    if (query.status) baseQuery = baseQuery.where('status', '==', query.status);
    if (query.projectId) baseQuery = baseQuery.where('projectId', '==', query.projectId);
    if (query.organizerId) baseQuery = baseQuery.where('organizerId', '==', query.organizerId);
    if (query.studentId) baseQuery = baseQuery.where('joinedStudentIds', 'array-contains', query.studentId);

    const snapshot = await baseQuery.get();
    let items = snapshot.docs.map((d) => this.mapDoc(d));

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      items = items.filter((item) => item.name.toLowerCase().includes(searchLower));
    }

    const total = items.length;
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    return { items: paginatedItems, total };
  }

  async updateJoinConfig(id: string, config: Event['joinConfig']): Promise<void> {
    await this.collection.doc(id).update({
      joinConfig: config,
      updatedAt: new Date().toISOString(),
    });
  }

  async createWithFacultyFund(event: Event, departmentFundId: string): Promise<Event> {
    const fundRef = this.departmentFundsCollection.doc(departmentFundId);
    const eventRef = this.collection.doc(event.id);

    return this.db.runTransaction(async (transaction) => {
      const fundDoc = await transaction.get(fundRef);
      if (!fundDoc.exists) {
        throw new EventNotFoundException(`Department fund ${departmentFundId} not found`);
      }

      const fundData = fundDoc.data()!;
      const remainingBudget = Number(fundData['remainingBudget'] || 0);

      if (remainingBudget < event.budgetCap) {
        throw new EventInitialSpentExceedsCapException();
      }

      transaction.update(fundRef, {
        remainingBudget: admin.firestore.FieldValue.increment(-event.budgetCap),
        updatedAt: new Date().toISOString(),
      });

      transaction.set(eventRef, event);
      return event;
    });
  }

  protected mapDoc(doc: admin.firestore.DocumentSnapshot): Event {
    const data = doc.data()!;
    return {
      ...data,
      id: doc.id,
      startDate: this.formatDate(data['startDate']),
      endDate: this.formatDate(data['endDate']),
      createdAt: this.formatDate(data['createdAt']),
      updatedAt: this.formatDate(data['updatedAt']),
      joinConfig: data['joinConfig']
        ? {
          ...data['joinConfig'],
          startsAt: this.formatDate(data['joinConfig'].startsAt),
          expiresAt: this.formatDate(data['joinConfig'].expiresAt),
          createdAt: this.formatDate(data['joinConfig'].createdAt),
        }
        : null,
    } as Event;
  }
}