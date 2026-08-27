import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Event, EventQueryPayload, CreateEventPayload, UpdateEventPayload, EventStatus } from '@school-expense-ecosystem/projects/types';
import { EventRepository } from '../abstracts/event.repository';

@Injectable()
export class FirebaseEventRepository extends EventRepository {
  private readonly collection = admin.firestore().collection('events');

  async findById(id: string): Promise<Event | null> {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as Event) : null;
  }

  async findMany(query: EventQueryPayload): Promise<{ items: Event[]; total: number }> {
    let ref: admin.firestore.Query = this.collection;

    if (query.facultyId) ref = ref.where('facultyId', '==', query.facultyId);
    if (query.status) ref = ref.where('status', '==', query.status);
    if (query.projectId) ref = ref.where('projectId', '==', query.projectId);

    const snapshot = await ref.get();
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Event));

    return { items, total: items.length };
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
      startDate: data.startDate,
      endDate: data.endDate,
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

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}