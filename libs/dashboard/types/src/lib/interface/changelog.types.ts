export interface ChangelogEntry {
  scope?: string;
  description: string;
  commitHash?: string;
  commitUrl?: string;
}

export interface ChangelogSection {
  type: 'Features' | 'Bug Fixes' | string;
  items: ChangelogEntry[];
}

export interface ChangelogRelease {
  version: string;
  date: string;
  sections: ChangelogSection[];
  totalCommits: number;
}