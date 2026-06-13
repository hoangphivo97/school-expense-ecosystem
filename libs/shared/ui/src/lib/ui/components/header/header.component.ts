// header.component.ts
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

@Component({
  selector: 'lib-header',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly router = inject(Router);

  private readonly routeTitleMapping: Record<string, string> = {
    '/dashboard': 'Dashboard Overview',
    '/user-list': 'System User Directory',
    '/expense': 'Expense Tracker',
    '/report': 'Financial Reports',
    '/budget-manager': 'Budget Management'
  };

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.split('?')[0])
    ),
    { initialValue: this.router.url.split('?')[0] }
  );

  readonly pageTitle = computed(() => {
    const url = this.currentUrl();
    const matchedTitle = Object.entries(this.routeTitleMapping)
      .find(([routeKey]) => url.includes(routeKey));

    return matchedTitle ? matchedTitle[1] : 'System Management';
  });
}