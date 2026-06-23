import { ChangeDetectionStrategy, Component, computed, effect, inject, Injector } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthRealtimeService, AuthService, AuthSignalStore } from '@school-expense-ecosystem/auth/data-access';
import { MatButton } from '@angular/material/button';
import { UserStatus } from '@school-expense-ecosystem/auth/types';
import { Router } from '@angular/router';

@Component({
  selector: 'lib-waiting-approval',
  standalone: true,
  imports: [
    MatCardModule,
    MatProgressSpinnerModule,
    MatButton
  ],
  templateUrl: './waiting-approval.component.html',
  styleUrl: './waiting-approval.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaitingApprovalComponent {
  private readonly authStore = inject(AuthSignalStore);
  private readonly realtimeService = inject(AuthRealtimeService);
  private readonly authService = inject(AuthService);

  private readonly componentInjector = inject(Injector);

  readonly displayName = computed(() => this.authStore.user()?.fullName || 'Valued Educator');
  readonly displayEmail = computed(() => this.authStore.user()?.email || 'N/A');

  ngOnInit(): void {
    const currentUser = this.authStore.user();

    if (currentUser?.uid) {
      /**
       * Initialize the declarative signal listener node contextually.
       * Pass the component injector downstream so that toSignal() and effect() 
       * automatically tear down the Firestore connection once this view unmounts.
       */
      this.realtimeService.watchStatusAsSignal(currentUser.uid, this.componentInjector);
    }
  }

  handleLogout(): void {
    this.authService.signOut();
  }
}