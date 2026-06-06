import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AuthService } from '@school-expense-ecosystem/auth/data-access';
import { MatIcon } from '@angular/material/icon';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, MatSidenavModule, MatIcon, SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  authService = inject(AuthService);
  collapsed = false;

  logout() {
    this.authService.signOut();
  }

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }

  get toggleIcon() {
    return this.collapsed ? 'chevron_right' : 'chevron_left';
  }
}
