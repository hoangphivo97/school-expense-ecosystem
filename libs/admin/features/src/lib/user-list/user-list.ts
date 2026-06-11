import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserListService } from '@school-expense-ecosystem/admin/data-access';
import { UserBase } from '@school-expense-ecosystem/auth/types';

@Component({
  selector: 'lib-user-list',
  imports: [CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent implements OnInit {
  private readonly userListService = inject(UserListService);

  // Core reactive states managed via Angular Signals
  users = signal<UserBase[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  searchQuery = signal<string>('');

  // Derived state that automatically filters the roster when search queries mutate
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.users();

    return this.users().filter(
      (user) =>
        user.fullName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.userCode?.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  /**
    * Triggers the HTTP client request pipeline to pull data from the server
   */
  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.userListService.getAllUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load user directory. Please verify server connectivity');
        this.isLoading.set(false);
        console.error('Fetch user list failed:', err);
      },
    });
  }
}
