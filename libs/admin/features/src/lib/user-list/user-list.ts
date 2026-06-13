import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild, effect, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserListService } from '@school-expense-ecosystem/admin/data-access';
import { Role, UserBase , UserStatus} from '@school-expense-ecosystem/auth/types';
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
export class UserListComponent {
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

  readonly pageSize = signal<number>(10);
  readonly currentPageIndex = signal<number>(0);
  private readonly pageTokens = signal<Record<number, string>>({ 0: '' });

  readonly RoleEnum = Role;
  readonly UserStatusEnum = UserStatus;

  // Commercial English translation registry mapping raw system roles into presentation texts
  readonly roleLabels: Record<Role, string> = {
    [Role.LEVEL_0_ADMIN]: 'System Administrator',
    [Role.LEVEL_1_FINANCE]: 'Finance Specialist',
    [Role.LEVEL_2_DEAN]: 'Faculty Dean',
    [Role.LEVEL_3_USER]: 'Standard User'
  };

  private readonly remoteParams$ = toObservable(
    computed(() => {
      const index = this.currentPageIndex();
      const limit = this.pageSize();
      const tokens = this.pageTokens();
      const currentToken = tokens[index] || '';

      return { limit, pageToken: currentToken, refresh: this.refreshTrigger() };
    })
  );

  private readonly apiResponse$ = this.remoteParams$.pipe(
    switchMap(({ limit, pageToken }) => {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      return this.userListService.getPaginatedUsers(limit, pageToken).pipe(
        catchError((err) => {
          console.error('Fetch paginated users failed:', err);
          this.errorMessage.set('Failed to load user directory. Please verify server connectivity');
          return of({ users: [] as UserBase[], nextPageToken: null as string | null, totalItems: 0 });
        })
      );
    }),
    map((response) => {
      this.isLoading.set(false);

      if (response.nextPageToken) {
        const nextIndex = this.currentPageIndex() + 1;
        // 🛠️ FIX: Ép kiểu 'as string' để vượt qua giới hạn Closure Narrowing của TypeScript
        this.pageTokens.update(tokens => ({
          ...tokens,
          [nextIndex]: response.nextPageToken as string
        }));
      }
      return response;
    })
  );

  readonly apiResponseSignal = toSignal(this.apiResponse$, {
    initialValue: { users: [] as UserBase[], nextPageToken: null as string | null, totalItems: 0 }
  });

  readonly totalItems = computed(() => this.apiResponseSignal().totalItems);

  readonly dataSource = computed(() => {
    const rawList = this.apiResponseSignal().users;
    const query = this.searchQuery().toLowerCase().trim();
    const role = this.roleFilter();
    const status = this.statusFilter();

    // Vẫn giữ Single-pass Filter để hỗ trợ tìm kiếm nhanh/lọc nhanh trên phạm vi trang hiện tại (10 bản ghi)
    const filteredList = rawList.filter((user: UserBase) => {
      const matchesQuery = !query ||
        user.fullName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.userCode?.toLowerCase().includes(query);
      const matchesRole = role === 'ALL' || user.role === role;
      const matchesStatus = status === 'ALL' || user.status?.toUpperCase() === status.toUpperCase();

      return matchesQuery && matchesRole && matchesStatus;
    });

    const processedList = filteredList.map((user: UserBase) => {
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
    // 🧹 SAFETY EFFECT: Khi Admin thay đổi bộ lọc tìm kiếm/quyền/trạng thái, 
    // bắt buộc phải reset pageIndex về 0 và xóa lịch sử token cũ để kích hoạt fetch lại từ đầu.
    effect(() => {
      this.searchQuery();
      this.roleFilter();
      this.statusFilter();

      untracked(() => {
        this.currentPageIndex.set(0);
        this.pageTokens.set({ 0: '' });
      });
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.currentPageIndex.set(event.pageIndex);
  }

  triggerRefresh(): void {
    this.refreshTrigger.update((n) => n + 1);
  }

  openEditUserModal(user: UserBase): void {
    console.log('Triggered edit modal workflow for target account:', user);
  }
}