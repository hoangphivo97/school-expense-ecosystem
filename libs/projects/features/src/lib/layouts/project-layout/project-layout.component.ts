import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { HeaderComponent, FooterComponent } from '@school-expense-ecosystem/shared/ui';

@Component({
  selector: 'lib-project-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatTabsModule,
    MatIconModule,
    TranslocoModule,
    HeaderComponent,
    FooterComponent,
  ],
  templateUrl: './project-layout.component.html',
  styleUrl: './project-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'project' }],
})
export class ProjectLayoutComponent {}