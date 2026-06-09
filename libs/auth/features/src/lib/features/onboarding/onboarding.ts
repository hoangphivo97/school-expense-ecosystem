import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'lib-onboarding',
  imports: [],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingComponent {}
