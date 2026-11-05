import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import {
  ActivityType,
  EnrolledActivityOption,
  EventItem,
  EventQueryPayload,
  PaginatedEventResult,
} from '@school-expense-ecosystem/projects/types';
import { EventRepository } from '../abstracts/event.repository';
import { FirebaseBaseRepository } from './firebase-base.repository';

@Injectable()
export class FirebaseEventRepository
  extends FirebaseBaseRepository<EventItem>
  implements EventRepository {
  constructor(
    @Inject('FIRESTORE_INSTANCE') db: admin.firestore.Firestore
  ) {
    super(db, 'events');
  }

  async findWithQuery(query: EventQueryPayload): Promise<PaginatedEventResult> {
    let baseQuery: admin.firestore.Query = this.collection;

    if (query.facultyId) baseQuery = baseQuery.where('facultyId', '==', query.facultyId);
    if (query.status) baseQuery = baseQuery.where('status', '==', query.status);
    if (query.projectId) baseQuery = baseQuery.where('projectId', '==', query.projectId);
    if (query.organizerId) baseQuery = baseQuery.where('organizerId', '==', query.organizerId);
    if (query.type) baseQuery = baseQuery.where('type', '==', query.type);

    const hasStudentFilter = Boolean(query.studentId);
    if (hasStudentFilter) {
      baseQuery = baseQuery.where('joinedStudentIds', 'array-contains', query.studentId);
    } else if (query.year) {
      baseQuery = baseQuery.where('years', 'array-contains', Number(query.year));
    }

    // Push search filter and index sorting down to database level
    if (query.search) {
      const term = query.search.trim();
      const isIdSearch = /^EVT/i.test(term);

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

    let items = snapshot.docs.map((doc) => this.mapDoc(doc));
    let totalItems = countSnapshot.data().count;

    if (hasStudentFilter && query.year) {
      const selectedYear = Number(query.year);
      items = items.filter((item) => item.years?.includes(selectedYear));
      totalItems = items.length;
    }

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const nextPageToken = lastDoc ? lastDoc.id : null;

    return { items, nextPageToken, totalItems };
  }

  async findActiveSummariesForUser(userId: string): Promise<EnrolledActivityOption[]> {
    // Query events where user is either an enrolled student or organizer
    const [studentSnap, organizerSnap] = await Promise.all([
      this.collection
        .where('joinedStudentIds', 'array-contains', userId)
        .select('name', 'budgetCap', 'currentSpent', 'pendingSpent', 'status', 'endDate')
        .get(),
      this.collection
        .where('organizerId', '==', userId)
        .select('name', 'budgetCap', 'currentSpent', 'pendingSpent', 'status', 'endDate')
        .get(),
    ]);

    const docsMap = new Map<string, admin.firestore.DocumentSnapshot>();
    [...studentSnap.docs, ...organizerSnap.docs].forEach((doc) => docsMap.set(doc.id, doc));

    const options: EnrolledActivityOption[] = [];

    docsMap.forEach((doc) => {
      const data = doc.data();
      if (!data) return;

      const status = data['status'];
      if (status === 'REJECTED' || status === 'ARCHIVED') return;

      const budgetCap = Number(data['budgetCap']) || 0;
      const currentSpent = Number(data['currentSpent']) || 0;
      const pendingSpent = Number(data['pendingSpent']) || 0;
      const availableBudget = Math.max(0, budgetCap - (currentSpent + pendingSpent));

      options.push({
        id: doc.id,
        name: String(data['name'] || ''),
        type: ActivityType.EVENT,
        availableBudget,
      });
    });

    return options;
  }

  protected mapDoc(doc: admin.firestore.DocumentSnapshot): EventItem {
    return this.mapBaseFields(doc) as unknown as EventItem;
  }
}