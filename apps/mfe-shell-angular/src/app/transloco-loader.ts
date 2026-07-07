import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Translation, TranslocoLoader } from '@ngneat/transloco';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string): Observable<Translation> {
    /**
     * Dynamically fetching local static JSON translation assets from the target server path.
     * This ensures runtime language switching without breaking lazy loading boundaries.
     */
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
  }
}