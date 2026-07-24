import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TimelineGroup, TimelineItem } from '@school-expense-ecosystem/dashboard/types';

@Injectable({
  providedIn: 'root'
})
export class ProjectLedgerService {
  private http = inject(HttpClient);
  private readonly GITHUB_API_URL = 'https://api.github.com/repos/hoangphivo97/school-expense-ecosystem/issues?state=all&per_page=100';

  /**
   * Tải toàn bộ danh sách Issues từ GitHub và phân loại theo trạng thái đóng/mở
   */
  getLedgerTimelines(): Observable<{ history: TimelineGroup[]; roadmap: TimelineGroup[] }> {
    return this.http.get<any[]>(this.GITHUB_API_URL).pipe(
      map(issues => {
        // Lọc bỏ Pull Request rác để chỉ giữ lại các Issue tính năng thực tế
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

  /**
   * Thuật toán bốc tách và gom nhóm dữ liệu phẳng thành cấu trúc cây lồng nhau (Year -> Month)
   */
  private transformAndGroupIssues(issues: any[]): TimelineGroup[] {
    const groups: { [year: number]: { [month: number]: TimelineItem[] } } = {};

    issues.forEach(issue => {
      const dateTarget = issue.closed_at ? new Date(issue.closed_at) : new Date(issue.created_at);
      const year = dateTarget.getFullYear();
      const month = dateTarget.getMonth() + 1;

      if (!groups[year]) groups[year] = {};
      if (!groups[year][month]) groups[year][month] = [];

      groups[year][month].push({
        month: month,
        title: issue.title,
        description: issue.body || 'No description provided.',
        tags: issue.labels.map((l: any) => l.name),
        issueUrl: issue.html_url,
        issueNumber: issue.number
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
}