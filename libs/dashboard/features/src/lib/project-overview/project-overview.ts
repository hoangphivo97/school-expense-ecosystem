import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@ngneat/transloco';
import { HeaderComponent } from '@school-expense-ecosystem/shared/ui';

interface SystemStatus {
  key: string;
  value: string | number;
  status: string; // Adjusted to match dynamic framework statuses
}

interface TimelineGroup {
  year: number;
  items: {
    month: number; // Changed string to number to align with data types
    title: string; // Changed titleKey to title
    description: string; // Changed descKey to description
    tags: string[];
    issueUrl?: string; // Architect Gateway: Optional GitHub issue redirection URL
    issueNumber?: number; // Optional GitHub issue reference identifier
  }[];
}

@Component({
  selector: 'lib-project-overview',
  imports: [CommonModule, TranslocoModule, HeaderComponent, MatIconModule],
  templateUrl: './project-overview.html',
  styleUrl: './project-overview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class ProjectOverview implements OnInit {
  systemStatuses = [
    { key: 'Architecture Version', value: 'v3.2 (Nx Distributed MFE)', status: 'active' },
    { key: 'Structural Type Safety', value: 'Strict / 100% TypeScript', status: 'success' },
    { key: 'Security Guard Layers', value: 'Multi-Tier RBAC Firewall', status: 'success' },
    { key: 'Data Ingestion Target', value: '100k+ Heavy-Duty Streams', status: 'info' },
    { key: 'Edge Node Deployment', value: 'Cloudflare Tunnel Enabled', status: 'warning' }
  ];

  // Chronological Historical Milestones Ledger (AC 3)
  historicalTimeline = [
    {
      year: 2026,
      items: [
        {
          month: 7,
          title: 'Dynamic Tree Traversal Over Single Source of Truth Navigation',
          description: 'Refactored internal layouts to dynamically derive active navigation states via hierarchical structural tree processing, completely eliminating brittle static map configurations.',
          tags: ['Angular-22', 'Clean-Architecture', 'Refactoring']
        },
        {
          month: 7,
          title: 'NoSQL Pagination Engine Optimization & Compound Indexing',
          description: 'Resolved NoSQL query boundary degradation by introducing untracked page tokens and Firestore query snapshots, achieving constant O(1) seek performance independent of database depth.',
          tags: ['Firestore', 'NoSQL', 'Performance']
        },
        {
          month: 7,
          title: 'Task-Driven Multi-Tier Security & Approval Queue',
          description: 'Architected defensive firewall validations utilizing Firebase App Check, request throttling, and custom JWT claims validation limits across hierarchical institutional access tiers.',
          tags: ['NestJS', 'Security', 'RBAC']
        }
      ]
    },
    {
      year: 2025,
      items: [
        {
          month: 12,
          title: 'Cross-Framework Micro Front-End Federation via Nx',
          description: 'Orchestrated an Angular host shell container dynamically embedding isolated React dynamic remote widgets using Webpack Module Federation strategies.',
          tags: ['Micro-Frontends', 'React-Remote', 'Module-Federation']
        },
        {
          month: 6,
          title: 'Ecosystem Architectural Inception & Monolithic Sandbox',
          description: 'Initialized the enterprise budgeting baseline application utilizing an Angular 18 framework backed by direct client-to-database Firestore synchronization.',
          tags: ['Project-Init', 'Angular-18', 'Firebase']
        }
      ]
    }
  ];

  // AC 4 Fix: Predictive timeline sequence plotting the newly introduced future architectural blueprints
  roadmapTimeline = [
    {
      year: 2026,
      items: [
        {
          month: 8,
          title: 'High-Performance Audit Export via Frontend WebAssembly (#140)',
          description: 'Preventing browser main UI thread freezing during massive data extractions (exceeding 100k+ rows) by offloading heavy binary compilation tasks to a specialized Web Worker utilizing a frontend Wasm module.',
          tags: ['WebAssembly', 'Web-Worker', 'Streaming']
        },
        {
          month: 9,
          title: 'Migration-Resilient Receipt Image Analysis Pipeline (#142)',
          description: 'Engineering a highly decoupled, event-driven image and PDF audit pipeline. Enforces a strict frontend abstraction layer that refrains from invoking client-side AI SDKs, securing a clean lift-and-shift path.',
          tags: ['Abstraction', 'Event-Driven', 'Image-Audit']
        },
        {
          month: 10,
          title: 'On-Premise Infrastructure Migration via Coolify Orchestration (#141)',
          description: 'Migrating full-stack services from Firebase to an open-source, self-hosted stack using Supabase and n8n on a local Linux server, utilizing a decoupled ID strategy matching PostgreSQL UUIDs with legacy Firebase string indexes.',
          tags: ['Supabase', 'n8n', 'Self-Hosted']
        },
        {
          month: 12,
          title: 'Decentralized Edge AI Node via Repurposed Android Server (#112)',
          description: 'Repurposing a legacy Snapdragon 855 mobile hardware target into a low-cost Android web server via Cloudflare Tunnel. Hosts a local lightweight computer vision model executing non-blocking receipt compliance scoring (validating image clarity, invoice layout structure, and total data completeness) routed via asynchronous n8n workflows.',
          tags: ['Edge-AI', 'Cloudflare-Tunnel', 'Hardware-Reuse']
        }
      ]
    }
  ];

  constructor() { }

  ngOnInit(): void { }
}
