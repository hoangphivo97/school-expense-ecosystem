import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { TranslocoModule } from '@ngneat/transloco';
import { HeaderComponent } from '@school-expense-ecosystem/shared/ui';

interface SystemStatus {
  key: string;
  value: string | number;
  status: 'optimal' | 'warning' | 'critical';
}

interface TimelineGroup {
  year: number;
  items: {
    month: string;
    titleKey: string;
    descKey: string;
    tags: string[];
  }[];
}

@Component({
  selector: 'lib-project-overview',
  imports: [CommonModule, TranslocoModule, HeaderComponent],
  templateUrl: './project-overview.html',
  styleUrl: './project-overview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class ProjectOverview implements OnInit{
  public systemStatuses: SystemStatus[] = [
    { key: 'architectureVersion', value: 'v2.4.0', status: 'optimal' },
    { key: 'typeSafetyMetric', value: '98.5%', status: 'optimal' },
    { key: 'activeGuardsLayer', value: 3, status: 'optimal' },
    { key: 'monorepoHealth', value: 'Optimal', status: 'optimal' }
  ];

  // Chronological Historical Milestones Ledger (AC 3)
  public historicalTimeline: TimelineGroup[] = [
    {
      year: 2026,
      items: [
        { month: '01', titleKey: 'dashboard.projectOverview.timeline.2026.01.title', descKey: 'dashboard.projectOverview.timeline.2026.01.desc', tags: ['Nx', 'Angular 18'] },
        { month: '06', titleKey: 'dashboard.projectOverview.timeline.2026.06.title', descKey: 'dashboard.projectOverview.timeline.2026.06.desc', tags: ['Signals', 'State'] }
      ]
    }
  ];

  // Future Architectural Scalability Backlog (AC 4)
  public roadmapTimeline: TimelineGroup[] = [
    {
      year: 2026,
      items: [
        { month: '08', titleKey: 'dashboard.projectOverview.timeline.2026.08.title', descKey: 'dashboard.projectOverview.timeline.2026.08.desc', tags: ['AI', 'KoboldCpp'] },
        { month: '11', titleKey: 'dashboard.projectOverview.timeline.2026.11.title', descKey: 'dashboard.projectOverview.timeline.2026.11.desc', tags: ['Webhooks', 'Event-Driven'] }
      ]
    }
  ];

  constructor() {}

  ngOnInit(): void {}
}
