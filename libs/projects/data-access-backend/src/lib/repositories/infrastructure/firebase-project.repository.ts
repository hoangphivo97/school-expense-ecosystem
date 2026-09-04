import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ProjectRepository } from '../abstracts/project.repository';
import { ProjectItem, ProjectQueryPayload } from '@school-expense-ecosystem/projects/types';
import {
  ProjectInitialSpentExceedsCapException,
  ProjectNotFoundException,
} from '../../exceptions/project.exception';
import { FirebaseBaseRepository } from './firebase-base.repository';

@Injectable()
export class FirestoreProjectRepository
  extends FirebaseBaseRepository<ProjectItem>
  implements ProjectRepository
{
  constructor(
    @Inject('FIRESTORE_INSTANCE') db: admin.firestore.Firestore
  ) {
    super(db, 'projects');
  }

  private get departmentFundsCollection() {
    return this.db.collection('department_funds');
  }

  async findWithQuery(query: ProjectQueryPayload): Promise<{ items: ProjectItem[]; total: number }> {
    let baseQuery: admin.firestore.Query = this.collection;

    if (query.facultyId) baseQuery = baseQuery.where('facultyId', '==', query.facultyId);
    if (query.status) baseQuery = baseQuery.where('status', '==', query.status);
    if (query.mentorId) baseQuery = baseQuery.where('mentorId', '==', query.mentorId);
    if (query.studentId) baseQuery = baseQuery.where('joinedStudentIds', 'array-contains', query.studentId);

    const snapshot = await baseQuery.get();
    let items = snapshot.docs.map((doc) => this.mapDoc(doc));

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(searchLower));
    }

    const total = items.length;
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    return { items: paginatedItems, total };
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