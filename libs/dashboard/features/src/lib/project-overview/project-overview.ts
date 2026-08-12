import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@ngneat/transloco';
import { ProjectLedgerService } from '@school-expense-ecosystem/dashboard/data-access';
import { TimelineGroup } from '@school-expense-ecosystem/dashboard/types';
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

  readonly currentYear = new Date().getFullYear();
  readonly currentMonth = new Date().getMonth() + 1;

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
