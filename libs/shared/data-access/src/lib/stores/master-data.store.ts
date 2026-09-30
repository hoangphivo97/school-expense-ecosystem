import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs/operators';
import { FacultyApiService } from '../faculty-service/faculty-api.service';
import { FilterOption } from '@school-expense-ecosystem/shared/types';

export interface FacultyMasterItem {
  facultyId: string;
  facultyName: string;
}

@Injectable({
  providedIn: 'root'
})
export class MasterDataStore {
  private readonly facultyApi = inject(FacultyApiService);

  // Directly leverage readonly Signals exposed by httpResource
  readonly faculties = this.facultyApi.facultiesResource.value;
  readonly isLoading = this.facultyApi.facultiesResource.isLoading;

  /**
   * Pre-computed filter options stream supporting dynamic Transloco localization.
   * Directly consumed by parent feature components (AC 2, AC 3).
   */
  readonly facultyOptions = computed<FilterOption<string>[]>(() => {
    const rawFaculties = this.faculties() ?? [];

    const options: FilterOption<string>[] = [
      { value: 'ALL', labelKey: 'shared.filter.options.faculties.ALL' }
    ];

    const dynamicFacultyOptions = rawFaculties.map((faculty) => ({
      value: faculty.id,
      labelKey: `shared.filter.options.faculties.${faculty.id}`,
      label: faculty.name // Fallback label in case translation key is absent
    }));

    return [...options, ...dynamicFacultyOptions];
  });

  /**
   * Triggers background re-fetch if cache invalidation is explicitly required
   */
  reloadFaculties(): void {
    this.facultyApi.facultiesResource.reload();
  }
}