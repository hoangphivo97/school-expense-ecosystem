import { inject, Injectable } from '@angular/core';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { BehaviorSubject, from, map, Observable, of } from 'rxjs';
import { Auth } from '@angular/fire/auth';
import { UserSettings } from '@school-expense-ecosystem/shared/types';
import { DateFormatValue } from '@school-expense-ecosystem/shared/constants';

@Injectable({
  providedIn: 'root',
})
export class SettingsServiceService {
  private dateFormatSubject = new BehaviorSubject<string>(DateFormatValue.DMY);
  private firestore = inject(Firestore);
  private auth: Auth = inject(Auth);

  private getUserId(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  getUserSettings(): Observable<UserSettings | null> {
    const userId = this.getUserId();
    if (!userId) {
      return of(null);
    }

    const settingsRef = doc(this.firestore, `settings/${userId}`);
    return from(getDoc(settingsRef)).pipe(
      map((docSnap) => {
        if (docSnap.exists()) {
          return docSnap.data() as UserSettings;
        }
        return null; // No settings found for user
      }),
    );
  }

  setDateFormat(format: string) {
    return this.dateFormatSubject.next(format);
  }

  getCurrDateFormat(): string {
    return this.dateFormatSubject.value;
  }
}
