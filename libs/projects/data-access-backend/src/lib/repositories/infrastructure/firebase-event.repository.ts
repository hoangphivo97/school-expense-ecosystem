import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import {
  EventItem,
  EventQueryPayload,
  PaginatedEventResult,
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

  async findWithQuery(query: EventQueryPayload): Promise<PaginatedEventResult> {
    let baseQuery: admin.firestore.Query = this.collection;

    if (query.facultyId) baseQuery = baseQuery.where('facultyId', '==', query.facultyId);
    if (query.status) baseQuery = baseQuery.where('status', '==', query.status);
    if (query.projectId) baseQuery = baseQuery.where('projectId', '==', query.projectId);
    if (query.organizerId) baseQuery = baseQuery.where('organizerId', '==', query.organizerId);
    if (query.studentId) baseQuery = baseQuery.where('joinedStudentIds', 'array-contains', query.studentId);

    // Push search filter and index sorting down to database level
    if (query.search) {
      const term = query.search.trim();
      const isIdSearch = /^PRJ/i.test(term);

      const searchField = isIdSearch ? admin.firestore.FieldPath.documentId() : 'name';
      const normalizedTerm = isIdSearch ? term.toUpperCase() : term;

      baseQuery = this.applyPrefixSearch(baseQuery, searchField, normalizedTerm);
    } else {
      baseQuery = baseQuery.orderBy('createdAt', 'desc');
    }

    const countQuery = baseQuery;

    if (query.pageToken) {
      const startDoc = await this.collection.doc(query.pageToken).get();
      if (startDoc.exists) {
        baseQuery = baseQuery.startAfter(startDoc);
      }
    }

    const safeLimit = Math.min(100, Math.max(1, parseInt(String(query.limit), 10) || 10));

    const [snapshot, countSnapshot] = await Promise.all([
      baseQuery.limit(safeLimit).get(),
      countQuery.count().get(),
    ]);


    const items = snapshot.docs.map((doc) => this.mapDoc(doc));
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const nextPageToken = lastDoc ? lastDoc.id : null;
    const totalItems = countSnapshot.data().count;

    return { items, nextPageToken, totalItems };
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