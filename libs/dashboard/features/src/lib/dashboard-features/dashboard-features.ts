import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { Role } from '@school-expense-ecosystem/shared/types';

@Component({
  selector: 'lib-dashboard-features',
  imports: [RouterLink, MatTooltipModule],
  templateUrl: './dashboard-features.html',
  styleUrl: './dashboard-features.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly userSignal = inject(AuthSignalStore)

  readonly user = this.userSignal.user;
  readonly isAdmin = computed(() => this.user()?.role === Role.LEVEL_0_ADMIN);
  readonly isUser = computed (() => this.user()?.role === Role.LEVEL_3_USER);
  readonly isDean = computed (() => this.user()?.role === Role.LEVEL_2_DEAN);

}
