import { ChangeDetectionStrategy, Component, computed, inject, Injector, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthRealtimeService, AuthService } from '@school-expense-ecosystem/auth/data-access';
import { MatButton } from '@angular/material/button';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

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