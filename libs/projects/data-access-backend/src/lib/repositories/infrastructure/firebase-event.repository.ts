import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Event, EventQueryPayload, CreateEventPayload, UpdateEventPayload, EventStatus } from '@school-expense-ecosystem/projects/types';
import { EventRepository } from '../abstracts/event.repository';
import { FirebaseBaseRepository } from './firebase-base.repository';

@Injectable()
export class FirebaseEventRepository extends FirebaseBaseRepository<Event> implements EventRepository {
  constructor(
    @Inject('FIRESTORE_INSTANCE') db: admin.firestore.Firestore
  ) {
    super(db, 'events');
  }

  async findById(id: string): Promise<Event | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.mapDocToEvent(doc);
  }

  async findMany(query: EventQueryPayload): Promise<{ items: Event[]; total: number }> {
    let ref: admin.firestore.Query = this.collection;

    if (query.facultyId) ref = ref.where('facultyId', '==', query.facultyId);
    if (query.status) ref = ref.where('status', '==', query.status);
    if (query.projectId) ref = ref.where('projectId', '==', query.projectId);

    const snapshot = await ref.get();
    let items = snapshot.docs.map((d) => this.mapDocToEvent(d));

    // In-memory search by name
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      items = items.filter((item) => item.name.toLowerCase().includes(searchLower));
    }

    const total = items.length;
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    return { items: paginatedItems, total };
  }

  async create(data: CreateEventPayload & { organizerId: string }): Promise<Event> {
    const docRef = this.collection.doc();
    const now = new Date().toISOString();

    const newEvent: Event = {
      id: docRef.id,
      name: data.name,
      description: data.description,
      facultyId: data.facultyId,
      type: data.type,
      budgetCap: data.budgetCap,
      initialSpent: data.initialSpent || 0,
      currentSpent: data.initialSpent || 0,
      startDate: this.formatDate(data.startDate),
      endDate: this.formatDate(data.endDate),
      status: EventStatus.UPCOMING,
      organizerId: data.organizerId,
      joinedStudentIds: [],
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(newEvent);
    return newEvent;
  }

  async update(id: string, data: UpdateEventPayload): Promise<Event> {
    const docRef = this.collection.doc(id);
    const updateData = { ...data, updatedAt: new Date().toISOString() };
    await docRef.update(updateData);
    const updated = await this.findById(id);
    return updated!;
  }

  async findByJoinCode(code: string): Promise<Event | null> {
    const snapshot = await this.collection
      .where('joinConfig.code', '==', code)
      .where('joinConfig.isActive', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return this.mapDocToEvent(snapshot.docs[0]);
  }

  async addStudent(id: string, studentId: string): Promise<Event> {
    const docRef = this.collection.doc(id);
    await docRef.update({
      joinedStudentIds: admin.firestore.FieldValue.arrayUnion(studentId),
      updatedAt: new Date().toISOString(),
    });
    const updated = await this.findById(id);
    return updated!;
  }

  private mapDocToEvent(doc: admin.firestore.DocumentSnapshot): Event {
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
        : undefined,
    } as Event;
  }
}