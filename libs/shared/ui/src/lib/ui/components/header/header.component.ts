// header.component.ts
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { ROUTE_HEADER_TITLE_REGISTRY } from '@school-expense-ecosystem/shared/constants';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'lib-header',
  standalone: true,
  imports: [MatButtonModule, TranslocoModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'shared' }
  ]
})
export class HeaderComponent {
  private readonly router = inject(Router);

  private readonly routeTitleMapping = ROUTE_HEADER_TITLE_REGISTRY;

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.split('?')[0])
    ),
    { initialValue: this.router.url.split('?')[0] }
  );

  readonly pageTitle = computed(() => {
    const url = this.currentUrl();
    // Sort entries by key length descending to guarantee specific sub-routes take precedence over short root segments
    const matchedTitle = Object.entries(this.routeTitleMapping)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([routeKey]) => url.includes(routeKey));

    if (!matchedTitle) return 'header.fallback';

    return `header.titles.${matchedTitle[0]}`;
  });
}