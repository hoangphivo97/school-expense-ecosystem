import { ChangeDetectionStrategy, Component, computed, inject, Injector, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@school-expense-ecosystem/auth/data-access';
import { MatButton } from '@angular/material/button';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'lib-waiting-approval',
  standalone: true,
  imports: [
    MatCardModule,
    MatProgressSpinnerModule,
    MatButton,
    TranslocoModule
  ],
  templateUrl: './waiting-approval.component.html',
  styleUrl: './waiting-approval.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers:[
    { provide: TRANSLOCO_SCOPE, useValue: 'auth' }
  ]
})
export class WaitingApprovalComponent implements OnInit {
  private readonly authStore = inject(AuthSignalStore);
  private readonly authService = inject(AuthService);

  private readonly componentInjector = inject(Injector);

  readonly displayName = computed(() => this.authStore.user()?.fullName || 'Valued Educator');
  readonly displayEmail = computed(() => this.authStore.user()?.email || 'N/A');

  ngOnInit(): void {
    const currentUser = this.authStore.user();
  }

  handleLogout(): void {
    this.authService.signOut();
  }
}