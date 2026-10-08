import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ProjectRepository } from '../abstracts/project.repository';
import { PaginatedProjectResult, ProjectItem, ProjectQueryPayload } from '@school-expense-ecosystem/projects/types';
import { FirebaseBaseRepository } from './firebase-base.repository';

@Injectable()
export class FirestoreProjectRepository
  extends FirebaseBaseRepository<ProjectItem>
  implements ProjectRepository {
  constructor(
    @Inject('FIRESTORE_INSTANCE') db: admin.firestore.Firestore
  ) {
    super(db, 'projects');
  }

  async findWithQuery(query: ProjectQueryPayload): Promise<PaginatedProjectResult> {
    let baseQuery: admin.firestore.Query = this.collection;

    if (query.facultyId) baseQuery = baseQuery.where('facultyId', '==', query.facultyId);
    if (query.status) baseQuery = baseQuery.where('status', '==', query.status);
    if (query.mentorId) baseQuery = baseQuery.where('mentorId', '==', query.mentorId);
    if (query.type) baseQuery = baseQuery.where('type', '==', query.type);

    const hasStudentFilter = Boolean(query.studentId);
    if (hasStudentFilter) {
      baseQuery = baseQuery.where('joinedStudentIds', 'array-contains', query.studentId);
    } else if (query.year) {
      // Query single year against the materialized array field in Firestore
      baseQuery = baseQuery.where('years', 'array-contains', Number(query.year));
    }

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

  async findProjectsByMentorId(mentorUid: string): Promise<ProjectItem[]> {
    const snapshot = await this.collection.where('mentorId', '==', mentorUid).get();
    return snapshot.docs.map((doc) => this.mapDoc(doc));
  }

  protected mapDoc(doc: admin.firestore.DocumentSnapshot): ProjectItem {
    return this.mapBaseFields(doc) as ProjectItem;
  }
}