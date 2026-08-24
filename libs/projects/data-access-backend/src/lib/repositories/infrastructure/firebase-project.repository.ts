import { Injectable, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FacultyId, UserStatus, UserType } from '@school-expense-ecosystem/shared/types';
import { ProjectRepository } from '../abstracts/project.repository';
import { Project, ProjectQueryPayload, StudentSummary } from '@school-expense-ecosystem/projects/types';

@Injectable()
export class FirestoreProjectRepository implements ProjectRepository {
  constructor(
    @Inject('FIRESTORE_INSTANCE') private readonly db: admin.firestore.Firestore,
  ) { }

  private get collection() {
    return this.db.collection('projects');
  }

  private get usersCollection() {
    return this.db.collection('users');
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
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return this.mapDocToProject(snapshot.docs[0]);
  }

  async update(id: string, data: Partial<Project>): Promise<void> {
    await this.collection.doc(id).update(data);
  }

  async addStudentsBulk(id: string, studentIds: string[]): Promise<void> {
    await this.collection.doc(id).update({
      joinedStudentIds: admin.firestore.FieldValue.arrayUnion(...studentIds),
      updatedAt: new Date().toISOString(),
    });
  }

  async removeStudent(id: string, studentUid: string): Promise<void> {
    await this.collection.doc(id).update({
      joinedStudentIds: admin.firestore.FieldValue.arrayRemove(studentUid),
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

    if (query.facultyId) {
      baseQuery = baseQuery.where('facultyId', '==', query.facultyId);
    }
    if (query.status) {
      baseQuery = baseQuery.where('status', '==', query.status);
    }
    if (query.mentorId) {
      baseQuery = baseQuery.where('mentorId', '==', query.mentorId);
    }
    if (query.studentId) {
      baseQuery = baseQuery.where('joinedStudentIds', 'array-contains', query.studentId);
    }

    const snapshot = await baseQuery.get();
    let items = snapshot.docs.map((doc) => this.mapDocToProject(doc));

    // In-memory search for project name
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(searchLower));
    }

    const total = items.length;

    // In-memory pagination slicing
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
    const snapshot = await this.collection
      .where('mentorId', '==', mentorUid)
      .get();

    return snapshot.docs.map((doc) => this.mapDocToProject(doc));
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
          expiresAt: this.formatDate(data['joinConfig'].expiresAt),
        }
        : undefined,
    } as Project;
  }

  private formatDate(dateVal: any): string {
    if (!dateVal) return new Date().toISOString();
    if (typeof dateVal === 'string') return dateVal;
    if (dateVal.toDate && typeof dateVal.toDate === 'function') {
      return dateVal.toDate().toISOString();
    }
    if (dateVal instanceof Date) return dateVal.toISOString();
    return new Date(dateVal).toISOString();
  }

  async searchStudents(query: string, limitCount = 20): Promise<StudentSummary[]> {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    // Query active student accounts only
    const snapshot = await this.usersCollection
      .where('userType', '==', UserType.STUDENT)
      .where('status', '==', UserStatus.ACTIVE)
      .limit(100)
      .get();

    const matchedStudents: StudentSummary[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const userCode = String(data['userCode'] || '').trim();
      const fullName = String(data['fullName'] || '').trim();
      const email = String(data['email'] || '').trim();

      // Check matching keyword against fullName, userCode (student code), or email
      if (
        fullName.toLowerCase().includes(normalizedQuery) ||
        userCode.toLowerCase().includes(normalizedQuery) ||
        email.toLowerCase().includes(normalizedQuery)
      ) {
        matchedStudents.push({
          id: doc.id,
          studentCode: userCode,
          fullName: fullName,
          email: email,
        });

        if (matchedStudents.length >= limitCount) break;
      }
    }

    return matchedStudents;
  }

  
}