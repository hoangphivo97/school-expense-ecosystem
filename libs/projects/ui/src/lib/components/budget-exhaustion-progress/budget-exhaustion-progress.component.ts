import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'lib-budget-exhaustion-progress',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './budget-exhaustion-progress.component.html',
  styleUrls: ['./budget-exhaustion-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetExhaustionProgressComponent {
  readonly spent = input<number>(0);
  readonly pending = input<number>(0);
  readonly budgetCap = input.required<number>();

  // Total committed allocations combining settled outlays and in-queue items
  readonly totalCommitted = computed(() => (this.spent() || 0) + (this.pending() || 0));

  readonly rate = computed(() => {
    const cap = this.budgetCap();
    return cap > 0 ? (this.totalCommitted() / cap) * 100 : 0;
  });

  readonly statusClass = computed(() => {
    const currentRate = this.rate();
    if (currentRate > 90) return 'fill-danger';
    if (currentRate >= 70) return 'fill-warning';
    return 'fill-safe';
  });
}