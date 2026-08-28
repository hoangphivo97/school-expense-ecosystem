// ... 1-2 lines above inside firebase-project.repository.ts imports
import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ProjectRepository } from '../abstracts/project.repository';
import { Project, ProjectQueryPayload } from '@school-expense-ecosystem/projects/types';
import {
  ProjectInitialSpentExceedsCapException,
  ProjectJoinCapacityReachedException,
  ProjectJoinCodeExpiredException,
  ProjectJoinDisabledException,
  ProjectJoinNotStartedException,
  ProjectNotFoundException,
  ProjectStudentAlreadyEnrolledException,
} from '../../exceptions/project.exception';
import { FirebaseBaseRepository } from './firebase-base.repository';

@Injectable()
export class FirestoreProjectRepository
  extends FirebaseBaseRepository<Project>
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

  async create(project: Project): Promise<Project> {
    await this.collection.doc(project.id).set(project);
    return project;
  }

  async findById(id: string): Promise<Project | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.mapDocToProject(doc);
  }

  async findByJoinCode(code: string): Promise<Project | null> {
    const snapshot = await this.collection
      .where('joinConfig.code', '==', code)
      .where('joinConfig.isActive', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return this.mapDocToProject(snapshot.docs[0]);
  }

  async update(id: string, data: Partial<Project>): Promise<void> {
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

  async findWithQuery(query: ProjectQueryPayload): Promise<{ items: Project[]; total: number }> {
    let baseQuery: admin.firestore.Query = this.collection;

    if (query.facultyId) baseQuery = baseQuery.where('facultyId', '==', query.facultyId);
    if (query.status) baseQuery = baseQuery.where('status', '==', query.status);
    if (query.mentorId) baseQuery = baseQuery.where('mentorId', '==', query.mentorId);
    if (query.studentId) baseQuery = baseQuery.where('joinedStudentIds', 'array-contains', query.studentId);

    const snapshot = await baseQuery.get();
    let items = snapshot.docs.map((doc) => this.mapDocToProject(doc));

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

  async updateJoinConfig(id: string, config: Project['joinConfig']): Promise<void> {
    await this.collection.doc(id).update({
      joinConfig: config,
      updatedAt: new Date().toISOString(),
    });
  }

  async findProjectsByMentorId(mentorUid: string): Promise<Project[]> {
    const snapshot = await this.collection.where('mentorId', '==', mentorUid).get();
    return snapshot.docs.map((doc) => this.mapDocToProject(doc));
  }

  async enrollStudentViaCode(projectId: string, studentId: string): Promise<Project> {
    const projectRef = this.collection.doc(projectId);

    return this.db.runTransaction(async (transaction) => {
      const doc = await transaction.get(projectRef);
      if (!doc.exists) {
        throw new ProjectNotFoundException(projectId);
      }

      const project = this.mapDocToProject(doc);
      const joinConfig = project.joinConfig;

      if (!joinConfig || !joinConfig.isActive) {
        throw new ProjectJoinDisabledException();
      }

      const joinedStudentIds = project.joinedStudentIds ?? [];
      if (joinedStudentIds.includes(studentId)) {
        throw new ProjectStudentAlreadyEnrolledException();
      }

      const now = new Date();
      if (joinConfig.startsAt && now < new Date(joinConfig.startsAt)) {
        throw new ProjectJoinNotStartedException(joinConfig.startsAt);
      }
      if (joinConfig.expiresAt && now > new Date(joinConfig.expiresAt)) {
        throw new ProjectJoinCodeExpiredException();
      }
      if (joinConfig.maxUses && (joinConfig.usedCount || 0) >= joinConfig.maxUses) {
        throw new ProjectJoinCapacityReachedException();
      }

      transaction.update(projectRef, {
        joinedStudentIds: admin.firestore.FieldValue.arrayUnion(studentId),
        'joinConfig.usedCount': admin.firestore.FieldValue.increment(1),
        updatedAt: new Date().toISOString(),
      });

      return {
        ...project,
        joinedStudentIds: [...joinedStudentIds, studentId],
        joinConfig: {
          ...joinConfig,
          usedCount: (joinConfig.usedCount || 0) + 1,
        },
      };
    });
  }

  async createWithFacultyFund(project: Project, departmentFundId: string): Promise<Project> {
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

  private mapDocToProject(doc: admin.firestore.DocumentSnapshot): Project {
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
    } as Project;
  }
}