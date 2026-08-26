import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Faculty, FacultyId } from '@school-expense-ecosystem/shared/types';
import { FacultyRepository } from '../abstracts/faculty.repository';

// Default metadata baseline used for initial system bootstrap
const SEED_FACULTIES: Faculty[] = [
  { id: FacultyId.FIT, name: 'Faculty of Information Technology', isActive: true },
  { id: FacultyId.FBE, name: 'Faculty of Business and Economics', isActive: true },
  { id: FacultyId.FLL, name: 'Faculty of Foreign Languages & Linguistics', isActive: true },
  { id: FacultyId.FET, name: 'Faculty of Engineering and Technology', isActive: true },
  { id: FacultyId.FAD, name: 'Faculty of Architecture and Design', isActive: true },
  { id: FacultyId.FLA, name: 'Faculty of Law and Public Administration', isActive: true },
];

@Injectable()
export class FirestoreFacultyRepository implements FacultyRepository {
  private readonly logger = new Logger(FirestoreFacultyRepository.name);
  private readonly collection = admin.firestore().collection('faculties');

  async findAllActive(): Promise<Faculty[]> {
    try {
      const snapshot = await this.collection.where('isActive', '==', true).get();

      // Fallback: If DB collection is not yet populated, return structured seed catalogue
      if (snapshot.empty) {
        this.logger.warn('Faculties collection is empty. Returning default seed faculties.');
        return SEED_FACULTIES;
      }

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id as FacultyId,
          name: data['name'] ?? '',
          deanId: data['deanId'],
          isActive: data['isActive'] ?? true,
        };
      });
    } catch (error) {
      this.logger.error('Failed to query faculties from Firestore, falling back to seed baseline', error);
      return SEED_FACULTIES;
    }
  }

  async findById(id: string): Promise<Faculty | null> {
    try {
      const doc = await this.collection.doc(id.toUpperCase()).get();

      if (!doc.exists) {
        // Check in seed baseline before returning null
        const fallback = SEED_FACULTIES.find((fac) => fac.id === id.toUpperCase());
        return fallback ?? null;
      }

      const data = doc.data()!;
      return {
        id: doc.id as FacultyId,
        name: data['name'] ?? '',
        deanId: data['deanId'],
        isActive: data['isActive'] ?? true,
      };
    } catch (error) {
      this.logger.error(`Error querying faculty with ID: ${id}`, error);
      return null;
    }
  }
}