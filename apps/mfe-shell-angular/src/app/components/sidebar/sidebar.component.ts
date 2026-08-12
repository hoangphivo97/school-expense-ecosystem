import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
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
import { APP_NAVIGATION } from '@school-expense-ecosystem/shared/constants';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ReactWrapperComponent } from '@school-expense-ecosystem/shared/ui';
import { A11yModule } from "@angular/cdk/a11y";
import { Role } from '@school-expense-ecosystem/shared/types';
import { MatTooltip } from "@angular/material/tooltip";
import { LanguageSwitcherComponent } from "@school-expense-ecosystem/shared/ui";
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

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
    LanguageSwitcherComponent,
    TranslocoModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'shared' }
  ]
})
export class SidebarComponent implements OnInit {
  readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthSignalStore)

  readonly toggle = output<void>();
  readonly logout = output<void>();
  readonly collapsed = input(false);

  readonly user = this.authStore.user;
  faArrowRightFromBracket = faArrowRightFromBracket;

  activeItem = signal<NavItem>(NavItem.PROJECT_OVERVIEW)

  private readonly ROLES_PERMISSION: Record<Role, NavItem[]> = {
    [Role.LEVEL_0_ADMIN]: [
      NavItem.DASHBOARD,
      NavItem.USER_LIST,
      NavItem.PROJECT_OVERVIEW
    ],
    [Role.LEVEL_1_FINANCE]: [
      NavItem.DASHBOARD,
      NavItem.EXPENSE,
      NavItem.REPORT,
      NavItem.FINANCE,
      NavItem.BUDGET_MANAGER,
      NavItem.APPROVAL_CENTER,
      NavItem.PROJECT_OVERVIEW,
      NavItem.PROJECT_MANAGER
    ],
    [Role.LEVEL_2_DEAN]: [
      NavItem.DASHBOARD,
      NavItem.EXPENSE,
      NavItem.REPORT,
      NavItem.USER_LIST,
      NavItem.APPROVAL_CENTER,
      NavItem.PROJECT_OVERVIEW,
      NavItem.PROJECT_MANAGER
    ],
    [Role.LEVEL_3_USER]: [
      NavItem.DASHBOARD,
      NavItem.EXPENSE,
      NavItem.PROJECT_OVERVIEW,
      NavItem.PROJECT_MANAGER
    ]
  };

  private readonly USER_TYPE_PERMISSIONS: Partial<Record<UserType, NavItem[]>> = {
    [UserType.TEACHER]: [NavItem.APPROVAL_CENTER],
  };

  readonly filteredNavItems = computed(() => {
    const currentUser = this.user();
    if (!currentUser) return [];

    const allowedItems = new Set<NavItem>(this.ROLES_PERMISSION[currentUser.role] || []);

    if (currentUser.userType) {
      const typeItems = this.USER_TYPE_PERMISSIONS[currentUser.userType];
      if (typeItems) {
        typeItems.forEach(item => allowedItems.add(item));
      }
    }

    return APP_NAVIGATION
      .filter((item) => allowedItems.has(item.key))
      .map((item) => {
        if (!item.children || item.children.length === 0) {
          return item;
        }

        // Filter sub-items if child has a specific permission key defined
        const filteredChildren = item.children.filter((child) =>
          !child.key || allowedItems.has(child.key)
        );

        return {
          ...item,
          children: filteredChildren,
        };
      })
      .filter((item) => !item.children || item.children.length > 0);
  });

  ngOnInit(): void {
    this.getUrlAndActiveSidebar();
    this.setActiveItemByUrl(this.router.url);
    // console.log(this.filteredNavItems())
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
    let matchedKey: NavItem | null = null;
    let longestMatchLength = 0;

    for (const item of APP_NAVIGATION) {
      if (item.route && url.includes(item.route) && item.route.length > longestMatchLength) {
        matchedKey = item.key;
        longestMatchLength = item.route.length;
      }
      if (item.children) {
        for (const child of item.children) {
          if (url.includes(child.route) && child.route.length > longestMatchLength) {
            matchedKey = item.key;
            longestMatchLength = child.route.length;
          }
        }
      }
    }

    if (matchedKey) {
      this.activeItem.set(matchedKey);
    }
  }

  setActive(itemKey: NavItem) {
    const currentQueryParams = this.router.parseUrl(this.router.url).queryParams;
    
    // Pick from filteredNavItems so users navigate to their first authorized sub-menu
    const currentItem = this.filteredNavItems().find(item => item.key === itemKey);
    if (currentItem && currentItem.children && currentItem.children.length > 0) {
      this.router.navigate([currentItem.children[0].route], {
        queryParams: currentQueryParams,
        queryParamsHandling: 'merge',
      });
      return;
    }

    const urlSlug = itemKey.toLowerCase().replace(/_/g, '-');
    this.router.navigate([urlSlug], {
      queryParams: currentQueryParams,
      queryParamsHandling: 'merge',
    });
  }
}
