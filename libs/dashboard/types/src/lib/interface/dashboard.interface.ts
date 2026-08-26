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