import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
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

  systemStatuses = [
    { key: 'Architecture Version', value: 'v3.2 (Nx Distributed MFE)', status: 'active' },
    { key: 'Structural Type Safety', value: 'Strict / 100% TypeScript', status: 'success' },
    { key: 'Security Guard Layers', value: 'Multi-Tier RBAC Firewall', status: 'success' },
    { key: 'Data Ingestion Target', value: '100k+ Heavy-Duty Streams', status: 'info' },
    { key: 'Edge Node Deployment', value: 'Cloudflare Tunnel Enabled', status: 'warning' }
  ];

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

  ngOnInit(): void { }
}
