import { Injectable, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Project } from '@school-expense-ecosystem/finance/types';
import { ProjectRepository } from '../project.repository';
import { FacultyId } from '@school-expense-ecosystem/shared/types';

@Injectable()
export class FirestoreProjectRepository implements ProjectRepository {
  constructor(
    @Inject('FIRESTORE_INSTANCE') private readonly db: admin.firestore.Firestore,
  ) {}

  private get collection() {
    return this.db.collection('projects');
  }

  async create(project: Project): Promise<Project> {
    await this.collection.doc(project.id).set(project);
    return project;
  }

  async findById(id: string): Promise<Project | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;

    const data = doc.data()!;
    
    // Safely parse Firestore Timestamps back to native JS Date instances
    return {
      ...data,
      startDate: (data['startDate'] as admin.firestore.Timestamp)?.toDate() ?? data['startDate'],
      endDate: (data['endDate'] as admin.firestore.Timestamp)?.toDate() ?? data['endDate'],
      joinConfig: data['joinConfig'] ? {
        ...data['joinConfig'],
        expiresAt: (data['joinConfig'].expiresAt as admin.firestore.Timestamp)?.toDate() ?? data['joinConfig'].expiresAt
      } : undefined
    } as unknown as Project;
  }

  async update(id: string, data: Partial<Project>): Promise<void> {
    await this.collection.doc(id).update(data);
  }

  async addStudentsBulk(id: string, studentIds: string[]): Promise<void> {
    // Thread-safe atomic array pushes using firebase-admin FieldValue
    await this.collection.doc(id).update({
      joinedStudentIds: admin.firestore.FieldValue.arrayUnion(...studentIds),
    });
  }

  async updateJoinConfig(id: string, config: Project['joinConfig']): Promise<void> {
    await this.collection.doc(id).update({ joinConfig: config });
  }

  async findProjectsByStudentId(studentId: string): Promise<Project[]> {
    const snapshot = await this.collection
      .where('joinedStudentIds', 'array-contains', studentId)
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Project));
  }

  async findProjectsByMentorId(mentorUid: string): Promise<Project[]> {
    const snapshot = await this.collection
      .where('mentorId', '==', mentorUid)
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as unknown as Project));
  }

  async findAll(filters?: { facultyId?: FacultyId }): Promise<Project[]> {
    let query: admin.firestore.Query = this.collection;

    if (filters?.facultyId) {
      query = query.where('facultyId', '==', filters.facultyId);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Project));
  }
}