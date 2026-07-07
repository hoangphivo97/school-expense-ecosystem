import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageSwitcherComponent } from '@school-expense-ecosystem/shared/ui';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, LanguageSwitcherComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
})
export class AuthLayoutComponent {}
