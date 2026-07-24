export interface TimelineItem {
  month: number;
  title: string;
  description: string;
  tags: string[];
  issueUrl: string;
  issueNumber: number;
}

export interface TimelineGroup {
  year: number;
  items: TimelineItem[];
}