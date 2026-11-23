import { Component, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'lib-login-case-study',
  imports: [MatIcon, TranslocoModule],
  templateUrl: './login-case-study.component.html',
  styleUrl: './login-case-study.component.scss',
})
export class LoginCaseStudyComponent {
  readonly exploreDossier = output<void>();
}
