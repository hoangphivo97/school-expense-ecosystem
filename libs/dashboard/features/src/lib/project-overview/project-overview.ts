import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@ngneat/transloco';
import { ChangelogService, ProjectLedgerService } from '@school-expense-ecosystem/dashboard/data-access';
import { ChangelogRelease, ChangelogSection, TimelineGroup } from '@school-expense-ecosystem/dashboard/types';
import { HeaderComponent } from '@school-expense-ecosystem/shared/ui';
import { map } from 'rxjs';

@Component({
  selector: 'lib-project-overview',
  imports: [CommonModule, TranslocoModule, HeaderComponent, MatIconModule],
  templateUrl: './project-overview.html',
  styleUrl: './project-overview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class ProjectOverview implements OnInit {
  private ledgerService = inject(ProjectLedgerService);
  private changelogService = inject(ChangelogService);

  readonly currentYear = new Date().getFullYear();
  readonly currentMonth = new Date().getMonth() + 1;

  readonly changelogContent = toSignal(
    this.changelogService.getChangelog(), { initialValue: '' }
  );

  readonly parsedReleases = computed<ChangelogRelease[]>(() => {
    const raw = this.changelogContent();
    if (!raw) return [];

    const lines = raw.split('\n');
    const releases: ChangelogRelease[] = [];
    let currentRelease: ChangelogRelease | null = null;
    let currentSection: ChangelogSection | null = null;

    const releaseRegex = /^#\s+([^\s]+)\s+\((.*?)\)/;
    const sectionRegex = /^###\s+(.*)/;
    const itemRegex = /^\*\s+(?:(?:\*\*([^*]+):\*\*\s*)?)(.*?)(?:\s*\(\[([a-f0-9]+)\]\((https?:\/\/[^\)]+)\)\))?$/;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      const releaseMatch = line.match(releaseRegex);
      if (releaseMatch) {
        currentRelease = {
          version: releaseMatch[1],
          date: releaseMatch[2],
          sections: [],
          totalCommits: 0,
        };
        releases.push(currentRelease);
        currentSection = null;
        continue;
      }

      const sectionMatch = line.match(sectionRegex);
      if (sectionMatch && currentRelease) {
        currentSection = {
          type: sectionMatch[1].trim(),
          items: [],
        };
        currentRelease.sections.push(currentSection);
        continue;
      }

      const itemMatch = line.match(itemRegex);
      if (itemMatch && currentSection && currentRelease) {
        currentSection.items.push({
          scope: itemMatch[1]?.trim(),
          description: itemMatch[2]?.trim(),
          commitHash: itemMatch[3],
          commitUrl: itemMatch[4],
        });
        currentRelease.totalCommits++;
      }
    }

    return releases;
  });

  systemStatuses = computed(() => {
    const historicalGroups = this.historicalTimeline();
    const roadmapGroups = this.roadmapTimeline();

    const totalShippedFeatures = historicalGroups.reduce((acc, group) => acc + group.items.length, 0);
    const activeBacklogCount = roadmapGroups.reduce((acc, group) => acc + group.items.length, 0);

    return [
      {
        key: 'Federated Remote Nodes',
        value: 'Angular Host ⇄ React v19 MFE',
        status: 'active'
      },
      {
        key: 'Defensive Security Tiers',
        value: '4x Active Guards (AppCheck/JWT)',
        status: 'success'
      },
      {
        key: 'NoSQL Index Scalability',
        value: 'O(1) Stateful Cursor Pagination',
        status: 'info'
      },
      {
        key: 'QA Verification Pipeline',
        value: 'Jest, Cypress & Storybook Active',
        status: 'success'
      },
      {
        key: 'Distributed Cloud Topology',
        value: 'Firebase Hosting & Functions Edge',
        status: 'warning'
      }
    ];
  });

  // Chronological Historical Milestones Ledger (AC 3)
  private ledgerData$ = this.ledgerService.getLedgerTimelines();

  historicalTimeline = toSignal(
    this.ledgerData$.pipe(map(data => data.history)),
    { initialValue: [] as TimelineGroup[] }
  );

  roadmapTimeline = toSignal(
    this.ledgerData$.pipe(map(data => data.roadmap)),
    { initialValue: [] as TimelineGroup[] }
  );

  constructor() { }

  ngOnInit(): void {

  }


}
