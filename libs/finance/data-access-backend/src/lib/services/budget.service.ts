import { inject, Injectable } from '@angular/core';
import { Firestore, collection, addDoc, Timestamp, collectionData } from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';
import { from, Observable, switchMap, take } from 'rxjs';
import { FacultyBudgetInit } from '@school-expense-ecosystem/finance/types';

@Injectable({
  providedIn: 'root',
})

export class BudgetBackendService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);
  private readonly user$ = authState(this.auth);
  private readonly budgetCollection = collection(this.firestore, 'budgets');

  /**
   * Initializes the base budget ceiling for a specific faculty (Top-Down allocation).
   * @param data The raw budget initiation data from the finance form.
   */
  initializeFacultyBudget(data: FacultyBudgetInit): Observable<any> {
    return this.user$.pipe(
      take(1),
      switchMap((user) => {
        if (!user) {
          throw new Error('Unauthorized: User must be authenticated to initialize budget records.');
        }
        
        // Construct audit-ready transactional payload
        const payload = {
          ...data,
          createdBy: user.uid,
          createdAt: Timestamp.now(),
          remainingBudget: data.totalBudgetCeiling, // Initially, remaining balance matches the ceiling
          fiscalYear: new Date().getFullYear()
        };
        
        return from(addDoc(this.budgetCollection, payload));
      })
    );
  }

  getBudgets(): Observable<any[]> {
    return collectionData(this.budgetCollection, { idField: 'id' });
  }
}