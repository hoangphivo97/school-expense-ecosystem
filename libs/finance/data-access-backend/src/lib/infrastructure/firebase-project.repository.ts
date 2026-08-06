// ... 1-2 lines above in project.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Project } from '@school-expense-ecosystem/finance/types';
import { ProjectRepository } from '../project.repository';

@Injectable()
export class FirestoreProjectRepository implements ProjectRepository {
  // Architect Fix: Injecting Firestore instance via NestJS Dependency Injection for clean testability
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
}