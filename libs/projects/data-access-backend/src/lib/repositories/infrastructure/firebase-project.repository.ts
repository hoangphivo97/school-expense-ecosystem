import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ProjectRepository } from '../abstracts/project.repository';
import { PaginatedProjectResult, ProjectItem, ProjectQueryPayload } from '@school-expense-ecosystem/projects/types';
import {
  ProjectInitialSpentExceedsCapException,
  ProjectNotFoundException,
} from '../../exceptions/project.exception';
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

  private get departmentFundsCollection() {
    return this.db.collection('department_funds');
  }

  private applyPrefixSearch(
    query: admin.firestore.Query,
    field: string | admin.firestore.FieldPath,
    term: string
  ): admin.firestore.Query {
    return query
      .where(field, '>=', term)
      .where(field, '<=', `${term}\uf8ff`)
      .orderBy(field);
  }

  async findWithQuery(query: ProjectQueryPayload): Promise<PaginatedProjectResult> {
    let baseQuery: admin.firestore.Query = this.collection;

    if (query.facultyId) baseQuery = baseQuery.where('facultyId', '==', query.facultyId);
    if (query.status) baseQuery = baseQuery.where('status', '==', query.status);
    if (query.mentorId) baseQuery = baseQuery.where('mentorId', '==', query.mentorId);
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

  async findProjectsByMentorId(mentorUid: string): Promise<ProjectItem[]> {
    const snapshot = await this.collection.where('mentorId', '==', mentorUid).get();
    return snapshot.docs.map((doc) => this.mapDoc(doc));
  }

  async createWithFacultyFund(project: ProjectItem, departmentFundId: string): Promise<ProjectItem> {
    const fundRef = this.departmentFundsCollection.doc(departmentFundId);
    const projectRef = this.collection.doc(project.id);

    return this.db.runTransaction(async (transaction) => {
      const fundDoc = await transaction.get(fundRef);
      if (!fundDoc.exists) {
        throw new ProjectNotFoundException(`Department fund ${departmentFundId} not found`);
      }

      const fundData = fundDoc.data()!;
      const remainingBudget = Number(fundData['remainingBudget'] || 0);

      if (remainingBudget < project.budgetCap) {
        throw new ProjectInitialSpentExceedsCapException();
      }

      transaction.update(fundRef, {
        remainingBudget: admin.firestore.FieldValue.increment(-project.budgetCap),
        updatedAt: new Date().toISOString(),
      });

      transaction.set(projectRef, project);
      return project;
    });
  }

  protected mapDoc(doc: admin.firestore.DocumentSnapshot): ProjectItem {
    return this.mapBaseFields(doc) as ProjectItem;
  }
}