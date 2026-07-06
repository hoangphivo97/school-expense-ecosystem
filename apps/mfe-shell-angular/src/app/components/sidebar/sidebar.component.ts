import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AuthSignalStore } from '@school-expense-ecosystem/shared/data-access';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { NavItem } from '@school-expense-ecosystem/shared/types';
import { MatDialog } from '@angular/material/dialog';
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons/faArrowRightFromBracket';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { navItems } from '@school-expense-ecosystem/shared/constants';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ReactWrapperComponent } from '@school-expense-ecosystem/shared/ui';
import { A11yModule } from "@angular/cdk/a11y";
import { Role } from '@school-expense-ecosystem/shared/types';
import { MatTooltip } from "@angular/material/tooltip";

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    MatSidenavModule,
    CommonModule,
    MatIcon,
    FontAwesomeModule,
    RouterModule,
    ReactWrapperComponent,
    A11yModule,
    MatTooltip
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthSignalStore)

  @Output() toggle = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Input() collapsed = false;

  readonly user = this.authStore.user;
  faArrowRightFromBracket = faArrowRightFromBracket;

  activeItem = signal<NavItem>(NavItem.DASHBOARD)

  private readonly rolePermissions: Record<Role, NavItem[]> = {
    [Role.LEVEL_0_ADMIN]: [
      NavItem.DASHBOARD,
      NavItem.USER_LIST
    ],
    [Role.LEVEL_1_FINANCE]: [
      NavItem.DASHBOARD,
      NavItem.EXPENSE,
      NavItem.REPORT,
      NavItem.BUDGET_MANAGER
    ],
    [Role.LEVEL_2_DEAN]: [
      NavItem.DASHBOARD,
      NavItem.EXPENSE,
      NavItem.REPORT,
      NavItem.USER_LIST
    ],
    [Role.LEVEL_3_USER]: [
      NavItem.DASHBOARD,
      NavItem.EXPENSE
    ]
  };

  private readonly urlRouteMapping: Record<string, NavItem> = {
    '/report': NavItem.REPORT,
    '/budget-manager': NavItem.BUDGET_MANAGER,
    '/user-list': NavItem.USER_LIST,
    '/expense': NavItem.EXPENSE,
    '/dashboard': NavItem.DASHBOARD,
  };

  readonly filteredNavItems = computed(() => {
    const currentUser = this.user();
    if (!currentUser) return [];

    const allowedItems = this.rolePermissions[currentUser.role] || [];
    return navItems.filter((item: any) => allowedItems.includes(item.key));
  });

  ngOnInit(): void {
    this.getUrlAndActiveSidebar();
    this.setActiveItemByUrl(this.router.url);
  }

  getUrlAndActiveSidebar() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        this.setActiveItemByUrl(url);
      });
  }

  setActiveItemByUrl(url: string): void {
    const match = Object.entries(this.urlRouteMapping).find(([routeKey]) => url.includes(routeKey));

    if (match) {
      const [_, navItem] = match;
      this.activeItem.set(navItem);
    }
  }

  setActive(itemKey: NavItem) {
    const currentQueryParams = this.router.parseUrl(this.router.url).queryParams;

    this.router.navigate([itemKey], {
      queryParams: currentQueryParams,
      queryParamsHandling: 'merge',
    });
  }

  get navItems() {
    return navItems;
  }
}
