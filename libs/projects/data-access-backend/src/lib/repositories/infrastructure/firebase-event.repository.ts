import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import {
  ActivityType,
  EnrolledActivityOption,
  EventItem,
  EventQueryPayload,
  EventStatus,
  PaginatedEventResult,
  ProjectStatus,
} from '@school-expense-ecosystem/projects/types';
import { EventRepository } from '../abstracts/event.repository';
import { FirebaseBaseRepository } from './firebase-base.repository';
import { EventNotFoundException, EventOutsideParentProjectTimelineException, InvalidEventStateException } from '../../exceptions/event.exception';

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
      const availableBudget = budgetCap - (currentSpent + pendingSpent);

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

  async createSubEventWithProjectReservation(
    event: EventItem,
    projectId: string
  ): Promise<EventItem> {
    if (!Number.isFinite(event.budgetCap) || event.budgetCap <= 0) {
      throw new BadRequestException('Sub-event budgetCap must be a positive finite number.');
    }

    const projectRef = this.db.collection('projects').doc(projectId);
    const eventRef = this.collection.doc(event.id);

    return this.db.runTransaction(async (transaction) => {
      const [projectDoc, eventDoc] = await Promise.all([
        transaction.get(projectRef),
        transaction.get(eventRef),
      ]);

      if (eventDoc.exists) {
        throw new ConflictException(
          `Event with ID "${event.id}" already exists. Please retry creation.`
        );
      }

      if (!projectDoc.exists) {
        throw new NotFoundException(`Parent Project with ID ${projectId} not found.`);
      }

      const projectData = projectDoc.data() ?? {};
      if (projectData['status'] !== ProjectStatus.ACTIVE) {
        throw new BadRequestException('Cannot attach an event to an inactive project.');
      }

      if (projectData['facultyId'] !== event.facultyId) {
        throw new BadRequestException('EventItem faculty must match parent project faculty.');
      }

      const projectStartStr = this.formatDate(projectData['startDate']);
      const projectEndStr = this.formatDate(projectData['endDate']);
      const eventStart = new Date(event.startDate).setHours(0, 0, 0, 0);
      const eventEnd = new Date(event.endDate).setHours(23, 59, 59, 999);
      const projectStart = new Date(projectStartStr).setHours(0, 0, 0, 0);
      const projectEnd = new Date(projectEndStr).setHours(23, 59, 59, 999);

      if (eventStart < projectStart || eventEnd > projectEnd) {
        throw new EventOutsideParentProjectTimelineException(
          event.startDate,
          event.endDate,
          projectStartStr,
          projectEndStr
        );
      }

      const budgetCap = this.parseLedgerCounter(
        projectData['budgetCap'],
        'budgetCap',
        `Parent project "${projectId}"`
      );
      const currentSpent = this.parseLedgerCounter(
        projectData['currentSpent'],
        'currentSpent',
        `Parent project "${projectId}"`
      );
      const pendingSpent = this.parseLedgerCounter(
        projectData['pendingSpent'],
        'pendingSpent',
        `Parent project "${projectId}"`
      );

      const availableBudget = budgetCap - (currentSpent + pendingSpent);

      if (event.budgetCap > availableBudget) {
        throw new BadRequestException(
          `EventItem budget cap exceeds available project budget headroom (${availableBudget}).`
        );
      }

      const timestampIso = new Date().toISOString();

      transaction.update(projectRef, {
        pendingSpent: pendingSpent + event.budgetCap,
        updatedAt: timestampIso,
      });

      transaction.create(eventRef, {
        ...event,
        createdAt: timestampIso,
        updatedAt: timestampIso,
      });

      return {
        ...event,
        createdAt: timestampIso,
        updatedAt: timestampIso,
      };
    });
  }

  async rejectSubEventWithProjectRelease(
    id: string,
    allowedCurrentStatuses: EventStatus[],
    auditData: {
      rejectionReason: string;
      rejectedBy: string;
    }
  ): Promise<EventItem> {
    const eventRef = this.collection.doc(id);

    return this.db.runTransaction(async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists) {
        throw new EventNotFoundException(id);
      }

      const eventData = eventDoc.data() ?? {};
      const currentStatus = eventData['status'] as EventStatus;

      if (!allowedCurrentStatuses.includes(currentStatus)) {
        throw new InvalidEventStateException('reject', currentStatus);
      }

      const projectId = eventData['projectId'] as string | null | undefined;
      const budgetCap = Number(eventData['budgetCap']);
      const timestampIso = new Date().toISOString();

      if (projectId) {
        if (!Number.isFinite(budgetCap) || budgetCap <= 0) {
          throw new BadRequestException(
            `Invalid budgetCap (${eventData['budgetCap']}) on sub-event "${id}".`
          );
        }

        const projectRef = this.db.collection('projects').doc(projectId);
        const projectDoc = await transaction.get(projectRef);

        if (!projectDoc.exists) {
          throw new NotFoundException(`Parent Project with ID ${projectId} not found.`);
        }

        const projectData = projectDoc.data() ?? {};
        const currentPending = this.parseLedgerCounter(
          projectData['pendingSpent'],
          'pendingSpent',
          `Parent project "${projectId}"`
        );

        if (currentPending < budgetCap) {
          throw new ConflictException(
            `Ledger inconsistency: Parent project "${projectId}" pendingSpent (${currentPending}) is lower than sub-event reservation (${budgetCap}).`
          );
        }

        transaction.update(projectRef, {
          pendingSpent: currentPending - budgetCap,
          updatedAt: timestampIso,
        });
      }

      const updatePayload: Record<string, unknown> = {
        status: EventStatus.REJECTED,
        rejectionReason: auditData.rejectionReason,
        rejectedBy: auditData.rejectedBy,
        updatedAt: timestampIso,
      };

      transaction.update(eventRef, updatePayload);

      return this.mapDoc({
        ...eventDoc,
        data: () => ({ ...eventData, ...updatePayload }),
      } as admin.firestore.DocumentSnapshot);
    });
  }
}