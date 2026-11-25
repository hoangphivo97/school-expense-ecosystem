import { ChangelogRelease, ChangelogSection } from '@school-expense-ecosystem/dashboard/types';

export interface SystemStatusItem {
  readonly key: string;
  readonly value: string;
  readonly status: 'active' | 'success' | 'info' | 'warning';
}

export const SYSTEM_STATUS_MATRIX: readonly SystemStatusItem[] = [
  {
    key: 'Federated Remote Nodes',
    value: 'Angular Host ⇄ React v19 MFE',
    status: 'active',
  },
  {
    key: 'Defensive Security Tiers',
    value: 'In-Memory JWT + Refresh & 4x Guards',
    status: 'success',
  },
  {
    key: 'NoSQL Index Scalability',
    value: 'O(1) Stateful Cursor Pagination',
    status: 'info',
  },
  {
    key: 'QA Verification Pipeline',
    value: 'Jest, Cypress & Storybook Active',
    status: 'success',
  },
  {
    key: 'Distributed Cloud Topology',
    value: 'Firebase Hosting & Functions Edge',
    status: 'warning',
  },
];

const RELEASE_REGEX =
  /^#{1,3}\s+(?:\[?v?([0-9]+\.[0-9]+\.[0-9]+[^\]\s]*)\]?(?:\([^)]*\))?)\s+\((.*?)\)/;
const SECTION_REGEX = /^#{3,4}\s+([A-Za-z\s]+)(?:\s*\(\d+\))?$/;
const ITEM_REGEX =
  /^[\*\-]\s+(?:(?:\*\*([^*]+):\*\*\s*)?)(.*?)(?:\s*\(\[?([a-f0-9]+)\]?(?:\((https?:\/\/[^)]+)\))?\))?$/;

export function parseChangelogMarkdown(raw: string): ChangelogRelease[] {
  if (!raw) return [];

  const lines = raw.split('\n');
  const releases: ChangelogRelease[] = [];
  let currentRelease: ChangelogRelease | null = null;
  let currentSection: ChangelogSection | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const releaseMatch = line.match(RELEASE_REGEX);
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

    const sectionMatch = line.match(SECTION_REGEX);
    if (sectionMatch && currentRelease) {
      currentSection = {
        type: sectionMatch[1].trim(),
        items: [],
      };
      currentRelease.sections.push(currentSection);
      continue;
    }

    const itemMatch = line.match(ITEM_REGEX);
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
}