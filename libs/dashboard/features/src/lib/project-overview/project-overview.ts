import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@jsverse/transloco';
import { ChangelogService, ProjectLedgerService } from '@school-expense-ecosystem/dashboard/data-access';
import { TimelineGroup } from '@school-expense-ecosystem/dashboard/types';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { HeaderComponent, LanguageSwitcherComponent, ReactWrapperComponent } from '@school-expense-ecosystem/shared/ui';
import { map } from 'rxjs';
import { parseChangelogMarkdown, SYSTEM_STATUS_MATRIX } from './project-overview.utils';

@Component({
  selector: 'lib-project-overview',
  imports: [CommonModule, TranslocoModule, HeaderComponent, MatIconModule, ReactWrapperComponent, LanguageSwitcherComponent, MatButtonModule],
  templateUrl: './project-overview.html',
  styleUrl: './project-overview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
    providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'overview' }
  ]
})
export class ProjectOverview {
  private readonly ledgerService = inject(ProjectLedgerService);
  private readonly changelogService = inject(ChangelogService);
  private readonly authStore = inject(AuthSignalStore);
  private readonly router = inject(Router);

  readonly isAuthenticated = computed(() => Boolean(this.authStore.user()));
  readonly systemStatuses = SYSTEM_STATUS_MATRIX;

  readonly changelogContent = toSignal(this.changelogService.getChangelog(), { initialValue: '' });
  readonly parsedReleases = computed(() => parseChangelogMarkdown(this.changelogContent()));

  private readonly ledgerData$ = this.ledgerService.getLedgerTimelines();

  readonly historicalTimeline = toSignal(
    this.ledgerData$.pipe(map((data) => data.history)),
    { initialValue: [] as TimelineGroup[] }
  );

  readonly roadmapTimeline = toSignal(
    this.ledgerData$.pipe(map((data) => data.roadmap)),
    { initialValue: [] as TimelineGroup[] }
  );

  navigateToLogin(): void {
    void this.router.navigate(['/auth']);
  }
}
