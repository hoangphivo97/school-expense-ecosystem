import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TimelineGroup, TimelineItem } from '@school-expense-ecosystem/dashboard/types';
import { marked } from 'marked';

@Injectable({
  providedIn: 'root'
})
export class ProjectLedgerService {
  private http = inject(HttpClient);
  private readonly GITHUB_API_URL = 'https://api.github.com/repos/hoangphivo97/school-expense-ecosystem/issues?state=all&per_page=100';

  getLedgerTimelines(): Observable<{ history: TimelineGroup[]; roadmap: TimelineGroup[] }> {
    return this.http.get<any[]>(this.GITHUB_API_URL).pipe(
      map(issues => {
        // Only Issue is feature
        const cleanIssues = issues.filter(i => !i.pull_request);

        const historyRaw = cleanIssues.filter(i => i.state === 'closed');
        const roadmapRaw = cleanIssues.filter(i => i.state === 'open');

        return {
          history: this.transformAndGroupIssues(historyRaw),
          roadmap: this.transformAndGroupIssues(roadmapRaw)
        };
      })
    );
  }

  private transformAndGroupIssues(issues: any[]): TimelineGroup[] {
    const groups: { [year: number]: { [month: number]: TimelineItem[] } } = {};

    issues.forEach(issue => {
      let targetDate: Date;

      if (issue.state === 'closed' && issue.closed_at) {
        // Past History: Group by the actual completion date
        targetDate = new Date(issue.closed_at);
      } else if (issue.state === 'open' && issue.milestone?.due_on) {
        // Future Roadmap: Group by the target milestone due date set on GitHub
        targetDate = new Date(issue.milestone.due_on);
      } else {
        // Fallback: Default to creation date if an open issue lacks a milestone
        targetDate = new Date(issue.created_at);
      }

      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      const lowerTitle = issue.title?.toLowerCase() || '';

      if (!groups[year]) groups[year] = {};
      if (!groups[year][month]) groups[year][month] = [];

      if (!lowerTitle.includes('feat') && !lowerTitle.includes('feature')) {
        return;
      }

      // Architect Fix: Truncate and compile markdown to pure HTML before reaching the component state
      const cleanHtmlDescription = this.parseAndTruncateMarkdown(issue.body);
      const nodeState = this.calculateNodeState(year, month);

      groups[year][month].push({
        month: month,
        title: issue.title,
        description: cleanHtmlDescription, // Expose ready-to-render HTML string
        timelineState: nodeState,
        issueUrl: issue.html_url,
        issueNumber: issue.number,
        status: (issue.state === 'closed' && issue.state_reason === 'completed') ? 'completed' : (nodeState === 'present' ? 'in-progress' : 'todo'),
      });
    });


    return Object.keys(groups)
      .map(yearKey => {
        const year = parseInt(yearKey);
        const items = Object.keys(groups[year])
          .flatMap(monthKey => groups[year][parseInt(monthKey)])
          .sort((a, b) => b.month - a.month);

        return { year, items };
      })
      .sort((a, b) => b.year - a.year);
  }

  private parseAndTruncateMarkdown(rawBody: string | null | undefined): string {
    if (!rawBody) return '<p class="description-empty">No description provided.</p>';

    // Step 1: Establish split boundaries for standard engineering headlines
    const boundaries = [
      '## Acceptance Criteria',
      '## 🔍 Acceptance Criteria (AC)',
      '## 💻 Technical Implementation Tasks',
      '### 🔹 Frontend Layout & Routing',
      '## 🧪 Testing Requirements',
      '### 📋 Acceptance Criteria'
    ];

    let cleanText = rawBody;

    // Step 2: Slice the string at the very first occurrence of any target boundary
    for (const boundary of boundaries) {
      const index = cleanText.indexOf(boundary);
      if (index !== -1) {
        cleanText = cleanText.substring(0, index);
      }
    }

    // Step 3: Compile the cleanly sliced summary markdown directly into raw HTML string
    return marked.parse(cleanText.trim()) as string;
  }

  private calculateNodeState(year: number, month: number): 'past' | 'present' | 'future' {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) return 'past';
    if (year === currentYear && month === currentMonth) return 'present';
    return 'future';
  }

}