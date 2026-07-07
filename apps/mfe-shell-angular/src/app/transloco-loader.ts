import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Translation, TranslocoLoader } from '@ngneat/transloco';
import { Observable } from 'rxjs';
import { environment } from './environments/environment';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string): Observable<Translation> {
    /**
     * Dynamically fetching local static JSON translation assets from the target server path.
     * This ensures runtime language switching without breaking lazy loading boundaries.
     */
    const baseUrl = environment.productionUrl || "";
    return this.http.get<Translation>(`${baseUrl}/assets/i18n/${lang}.json`);
  }
}