import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthSocketService } from '@school-expense-ecosystem/auth/data-access';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'expense-tracker-app';
  private readonly authSocketService = inject(AuthSocketService);
}
