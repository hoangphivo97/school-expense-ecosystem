// libs/shared/data-access/src/lib/services/changelog.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChangelogService {
  private readonly http = inject(HttpClient);

  // Architect Practice: Load static markdown directly from public assets
  getChangelog(): Observable<string> {
    return this.http.get('/assets/CHANGELOG.md', { responseType: 'text' });
  }
}