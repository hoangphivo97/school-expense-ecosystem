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
import { NavItem, UserType } from '@school-expense-ecosystem/shared/types';
import { MatDialog } from '@angular/material/dialog';
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons/faArrowRightFromBracket';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { APP_NAVIGATION, URL_ROUTE_LINKER } from '@school-expense-ecosystem/shared/constants';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ReactWrapperComponent } from '@school-expense-ecosystem/shared/ui';
import { A11yModule } from "@angular/cdk/a11y";
import { Role } from '@school-expense-ecosystem/shared/types';
import { MatTooltip } from "@angular/material/tooltip";
import { LanguageSwitcherComponent } from "@school-expense-ecosystem/shared/ui";

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
    MatTooltip,
    LanguageSwitcherComponent
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
      NavItem.BUDGET_MANAGER,
      NavItem.APPROVAL_CENTER
    ],
    [Role.LEVEL_2_DEAN]: [
      NavItem.DASHBOARD,
      NavItem.EXPENSE,
      NavItem.REPORT,
      NavItem.USER_LIST,
      NavItem.APPROVAL_CENTER
    ],
    [Role.LEVEL_3_USER]: [
      NavItem.DASHBOARD,
      NavItem.EXPENSE
    ]
  };

  private readonly urlRouteMapping = URL_ROUTE_LINKER;

  private readonly userTypePermissions: Partial<Record<UserType, NavItem[]>> = {
    [UserType.TEACHER]: [NavItem.APPROVAL_CENTER], // Grant teachers permission to access the student review desk
    [UserType.STAFF]: [NavItem.APPROVAL_CENTER]    // Configure staff permissions safely inside this functional block
  };

  readonly filteredNavItems = computed(() => {
    const currentUser = this.user();
    if (!currentUser) return [];

    const allowedItems = new Set<NavItem>(this.rolePermissions[currentUser.role] || []);

    if (currentUser.userType) {
      const typeItems = this.userTypePermissions[currentUser.userType];
      if (typeItems) {
        typeItems.forEach(item => allowedItems.add(item));
      }
    }

    return APP_NAVIGATION.filter((item: any) => allowedItems.has(item.key));
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
    const match = Object.entries(this.urlRouteMapping)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([routeKey]) => url.includes(routeKey));

    if (match) {
      const [_, navItem] = match;
      this.activeItem.set(navItem);
    }
  }

  setActive(itemKey: NavItem) {
    const currentQueryParams = this.router.parseUrl(this.router.url).queryParams;
    const targetItem = APP_NAVIGATION.find(item => item.key === itemKey);

    // If the parent menu houses sub-items, immediately auto-route to the primary leaf node entry
    if (targetItem && targetItem.children && targetItem.children.length > 0) {
      this.router.navigate([targetItem.children[0].route], {
        queryParams: currentQueryParams,
        queryParamsHandling: 'merge',
      });
      return;
    }

    this.router.navigate([itemKey], {
      queryParams: currentQueryParams,
      queryParamsHandling: 'merge',
    });
  }

  get navItems() {
    return APP_NAVIGATION;
  }
}
