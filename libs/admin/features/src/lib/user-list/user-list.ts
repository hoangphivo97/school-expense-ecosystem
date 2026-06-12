// user-list.ts
import { CommonModule, DatePipe } from '@angular/common'; // Added DatePipe for createdAt column
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, viewChild, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select'; // Added for custom filtering dropdowns
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button'; // Added for action buttons
import { UserListService } from '@school-expense-ecosystem/admin/data-access';
import { Role, UserBase } from '@school-expense-ecosystem/auth/types';
import { FooterComponent } from '@school-expense-ecosystem/shared/ui';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';

@Component({
  selector: 'lib-user-list',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    FooterComponent,
    DatePipe
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent implements OnInit {
  private readonly userListService = inject(UserListService);

  // Structural grid column configurations including auditing and interactive actions
  displayedColumns: string[] = ['fullName', 'email', 'userCode', 'role', 'status', 'createdAt', 'action'];

  // DOM viewchild query referencing the active material pagination element
  readonly paginator = viewChild(MatPaginator);

  // Core local reactive states driven by Angular Signals for client-side filtering
  readonly searchQuery = signal<string>('');
  readonly roleFilter = signal<string>('ALL');
  readonly statusFilter = signal<string>('ALL');

  private readonly refreshTrigger = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Commercial English translation registry mapping raw system roles into presentation texts
  readonly roleLabels: Record<Role, string> = {
    [Role.LEVEL_0_ADMIN]: 'System Administrator',
    [Role.LEVEL_1_FINANCE]: 'Finance Specialist',
    [Role.LEVEL_2_DEAN]: 'Faculty Dean',
    [Role.LEVEL_3_USER]: 'Standard User'
  };

  // Declarative database stream pipeline handling remote records fetching securely
  private readonly rawUsers$ = toObservable(
    computed(() => ({ refresh: this.refreshTrigger() }))
  ).pipe(
    switchMap(() => {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      return this.userListService.getAllUsers().pipe(
        catchError((err) => {
          console.error('Fetch user list failed:', err);
          this.errorMessage.set('Failed to load user directory. Please verify server connectivity');
          return of([] as UserBase[]);
        })
      );
    }),
    map((data) => {
      this.isLoading.set(false);
      return data;
    })
  );

  readonly usersSignal = toSignal(this.rawUsers$, { initialValue: [] as UserBase[] });

  // Advanced multi-criteria computed state pipeline evaluating local filters reactively
  readonly dataSource = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const role = this.roleFilter();
    const status = this.statusFilter();

    // 🏆 SINGLE-PASS FILTER: Combines all criteria into one single loop iteration
    const filteredList = this.usersSignal().filter(user => {
      const matchesQuery = !query ||
        user.fullName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.userCode?.toLowerCase().includes(query);
      const matchesRole = role === 'ALL' || user.role === role;
      const matchesStatus = status === 'ALL' || user.status?.toUpperCase() === status.toUpperCase();

      return matchesQuery && matchesRole && matchesStatus;
    });

    // 🚀 CONCISE INLINE MAPPING: Resolves both role translations and bulletproof date parsing seamlessly
    const processedList = filteredList.map(user => {
      const rawSeconds = user.createdAt?.seconds ?? (user.createdAt as any)?._seconds;

      return {
        ...user,
        roleLabel: this.roleLabels[user.role as Role] || String(user.role),
        processedCreatedAt: rawSeconds ? new Date(rawSeconds * 1000) : null
      };
    });

    return new MatTableDataSource<any>(processedList);
  });
  constructor() {
    // Structural synchronization effect applying updated pagination pointers onto data sources
    effect(() => {
      const tableDataSource = this.dataSource();
      const currentPaginator = this.paginator();
      if (tableDataSource && currentPaginator) {
        tableDataSource.paginator = currentPaginator;
      }
    });
  }

  ngOnInit(): void { }

  triggerRefresh(): void {
    this.refreshTrigger.update((n) => n + 1);
  }

  /**
   * Dispatches dialog initialization workflows targeting information mutation
   */
  openEditUserModal(user: UserBase): void {
    console.log('Triggered edit modal workflow for target account:', user);
    // TODO: Open your CreateExpenseModalComponent or custom user modal with DialogData context later
  }
}