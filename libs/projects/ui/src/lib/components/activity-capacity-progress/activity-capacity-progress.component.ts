import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'lib-activity-capacity-progress',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './activity-capacity-progress.component.html',
  styleUrl: './activity-capacity-progress.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityCapacityProgressComponent {
  // Required participant/enrolled count
  readonly current = input.required<number>();

  // Optional maximum quota
  readonly max = input<number | null | undefined>(null);

  // Optional override inputs; computed automatically when omitted
  readonly percentage = input<number>();
  readonly isFull = input<boolean>();

  // Configurable fallback icon when no quota is defined
  readonly fallbackIcon = input<string>('person');

  // Resolved percentage calculation with 0-100 clamping
  readonly resolvedPercentage = computed(() => {
    const override = this.percentage();
    if (override !== undefined) return override;

    const maxCap = this.max();
    if (!maxCap || maxCap <= 0) return 0;

    return Math.min(100, Math.round((this.current() / maxCap) * 100));
  });

  // Resolved saturation flag
  readonly resolvedIsFull = computed(() => {
    const override = this.isFull();
    if (override !== undefined) return override;

    const maxCap = this.max();
    if (!maxCap || maxCap <= 0) return false;

    return this.current() >= maxCap;
  });
}