import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

@Component({
  selector: 'lib-breadcrumb',
  standalone: true,
  imports: [],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
})
export class BreadcrumbComponent {
  private readonly router = inject(Router);

  //Reactive stream pipeline that extracts clean paths on NavigationEnd, completely isolating '?year=...' query params
  private readonly cleanUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.split('?')[0])
    ),
    { initialValue: this.router.url.split('?')[0] }
  );

  //Computed Contract: Enforces layout text formatting, normalizing capitalization structures dynamically
  readonly firstBreadcrumb = computed(() => {
    const path = this.cleanUrl().split('/')[1];
    if (!path) return '';

    // Standardize presentation by substituting hyphens with white spaces dynamically
    const cleanPath = path.replace(/-/g, ' ');
    return cleanPath.charAt(0).toUpperCase() + cleanPath.slice(1);
  });
}
