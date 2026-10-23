export interface TimelineItem {
  month: number;
  title: string;
  description: string;
  issueUrl: string;
  issueNumber: number;
  timelineState: 'past' | 'present' | 'future';
  status: 'completed' | 'in-progress' | 'todo';
}

export interface TimelineGroup {
  year: number;
  items: TimelineItem[];
}

export interface GithubIssueMilestone {
  due_on?: string | null;
}

export interface GithubIssue {
  number: number;
  title: string;
  body?: string | null;
  state: 'open' | 'closed' | string;
  state_reason?: string | null;
  created_at: string;
  closed_at?: string | null;
  html_url: string;
  pull_request?: Record<string, unknown>;
  milestone?: GithubIssueMilestone | null;
}