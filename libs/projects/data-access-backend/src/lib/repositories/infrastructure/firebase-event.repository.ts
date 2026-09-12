import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import {
  EventItem,
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
  extends FirebaseBaseRepository<EventItem>
  implements EventRepository {
  constructor(
    @Inject('FIRESTORE_INSTANCE') db: admin.firestore.Firestore
  ) {
    super(db, 'events');
  }

  private get departmentFundsCollection() {
    return this.db.collection('department_funds');
  }

  async findWithQuery(query: EventQueryPayload): Promise<{ items: EventItem[]; total: number }> {
    let baseQuery: admin.firestore.Query = this.collection;

    if (query.facultyId) baseQuery = baseQuery.where('facultyId', '==', query.facultyId);
    if (query.status) baseQuery = baseQuery.where('status', '==', query.status);
    if (query.projectId) baseQuery = baseQuery.where('projectId', '==', query.projectId);
    if (query.organizerId) baseQuery = baseQuery.where('organizerId', '==', query.organizerId);
    if (query.studentId) baseQuery = baseQuery.where('joinedStudentIds', 'array-contains', query.studentId);

    // Push search filter and index sorting down to database level
    if (query.search) {
      const term = query.search.trim();
      baseQuery = baseQuery
        .where('name', '>=', term)
        .where('name', '<=', term + '\uf8ff')
        .orderBy('name');
    } else {
      baseQuery = baseQuery.orderBy('createdAt', 'desc');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    // Execute paginated slice and metadata count aggregation concurrently
    const [snapshot, countSnapshot] = await Promise.all([
      baseQuery.offset(offset).limit(limit).get(),
      baseQuery.count().get(),
    ]);

    const items = snapshot.docs.map((d) => this.mapDoc(d));
    const total = countSnapshot.data().count;

    return { items, total };
  }
  async createWithFacultyFund(event: EventItem, departmentFundId: string): Promise<EventItem> {
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

  protected mapDoc(doc: admin.firestore.DocumentSnapshot): EventItem {
    return this.mapBaseFields(doc) as EventItem;
  }
}