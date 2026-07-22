import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'lib-pagination',
  imports: [MatButtonModule, MatIconModule, TranslocoModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'shared' }
  ]
})
export class PaginationComponent {
  totalItems = input.required<number>();
  pageSize = input.required<number>();
  currentPage = input.required<number>();
  pageSizeOptions = input<number[]>([10, 20, 50, 100]);

  pageChange = output<number>();
  pageSizeChange = output<number>();

  protected readonly normalizedCurrentPage = computed(() => Number(this.currentPage()));
  protected readonly normalizedPageSize = computed(() => Number(this.pageSize()));
  protected readonly normalizedTotalItems = computed(() => Number(this.totalItems()));

  totalPages = computed(() => {
    const total = Math.ceil(this.totalItems() / this.pageSize());
    return Math.max(1, total);
  });

  pageIndices = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i);
  });

  selectPage(pageIndex: number): void {
    if (pageIndex >= 0 && pageIndex < this.totalPages() && pageIndex !== this.normalizedCurrentPage()) {
      this.pageChange.emit(pageIndex);
    }
  }
}
