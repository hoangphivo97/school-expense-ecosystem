import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';
import { toDebouncedSignal } from '@school-expense-ecosystem/shared/utils-frontend';
import { EventApiService, ProjectApiService } from '@school-expense-ecosystem/projects/data-access';
import { ManageJoinCodeLayoutComponent } from '@school-expense-ecosystem/projects/ui';
import {
  EventItem,
  GenerateJoinCodePayload,
  JoinConfig,
  ProjectItem,
  StudentSummary,
} from '@school-expense-ecosystem/projects/types';
import { TranslocoModule } from '@ngneat/transloco';

export interface ManageJoinCodeDialogData {
  entity: ProjectItem | EventItem;
  type: 'PROJECT' | 'EVENT';
}

export interface ManageJoinCodeDialogResult {
  joinedStudentIds: string[];
  joinConfig: JoinConfig | null;
}

@Component({
  selector: 'lib-manage-join-code-dialog',
  standalone: true,
  imports: [ManageJoinCodeLayoutComponent, TranslocoModule],
  template: `
    <ng-container *transloco="let t; read: 'project.manageMembersDialog'">
      <lib-manage-join-code-layout
        [title]="t(data.type === 'PROJECT' ? 'titleProject' : 'titleEvent')"
        [subtitle]="data.entity.name"
        [maxEndDate]="maxEndDate"
        [joinConfig]="joinConfig()"
        [joinedStudents]="joinedStudents()"
        [searchResults]="studentsResource.value()"
        [isSearching]="studentsResource.isLoading()"
        [isLoadingRoster]="isLoadingRoster()"
        [isMemberMutating]="isMemberMutating()"
        [isSubmitting]="isSubmitting()"
        [errorMessage]="errorMessage()"
        (searchRawQueryChange)="searchQuery.set($event)"
        (studentAdded)="handleAddStudent($event)"
        (studentRemoved)="handleRemoveStudent($event)"
        (codeGenerated)="handleGenerateCode($event)"
        (closed)="handleClose()"
      />
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageJoinCodeDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ManageJoinCodeDialogComponent, ManageJoinCodeDialogResult>);
  private readonly projectApiService = inject(ProjectApiService);
  private readonly eventApiService = inject(EventApiService);

  readonly data = inject<ManageJoinCodeDialogData>(MAT_DIALOG_DATA);
  private readonly isProject = this.data.type === 'PROJECT';

  readonly joinedStudents = signal<StudentSummary[]>([]);
  readonly joinConfig = signal<JoinConfig | null>(this.data.entity.joinConfig ?? null);
  readonly isLoadingRoster = signal<boolean>(true);
  readonly isMemberMutating = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  private hasMutated = false;

  readonly maxEndDate = new Date(this.data.entity.endDate);
  readonly searchQuery = signal<string>('');
  private readonly debouncedQuery = toDebouncedSignal(this.searchQuery, 300);

  // Dynamic API Adapter
  private readonly api = {
    getRoster: () =>
      this.isProject
        ? this.projectApiService.getProjectStudents(this.data.entity.id)
        : this.eventApiService.getEventStudents(this.data.entity.id),
    search: (query: string) =>
      this.isProject
        ? this.projectApiService.searchStudents(query)
        : this.eventApiService.searchStudents(query),
    addMembers: (ids: string[]) =>
      this.isProject
        ? this.projectApiService.addStudents(this.data.entity.id, ids)
        : this.eventApiService.addStudents(this.data.entity.id, ids),
    removeMember: (id: string) =>
      this.isProject
        ? this.projectApiService.removeStudent(this.data.entity.id, id)
        : this.eventApiService.removeStudent(this.data.entity.id, id),
    generateCode: (payload: GenerateJoinCodePayload) =>
      this.isProject
        ? this.projectApiService.generateJoinCode(this.data.entity.id, payload)
        : this.eventApiService.generateJoinCode(this.data.entity.id, payload),
  };

  readonly studentsResource = rxResource({
    params: () => this.debouncedQuery().trim(),
    stream: ({ params: query }) => {
      if (!query || query.length < 2) return of([]);
      return this.api.search(query);
    },
    defaultValue: [] as StudentSummary[],
  });

  ngOnInit(): void {
    const studentIds = this.data.entity.joinedStudentIds ?? [];
    if (studentIds.length === 0) {
      this.joinedStudents.set([]);
      this.isLoadingRoster.set(false);
      return;
    }

    this.api.getRoster().subscribe({
      next: (students) => {
        this.joinedStudents.set(students);
        this.isLoadingRoster.set(false);
      },
      error: () => this.isLoadingRoster.set(false),
    });
  }

  handleAddStudent(student: StudentSummary): void {
    if (this.joinedStudents().some((s) => s.id === student.id)) {
      this.errorMessage.set('Student is already enrolled.');
      return;
    }

    this.isMemberMutating.set(true);
    this.errorMessage.set(null);

    this.api.addMembers([student.id]).subscribe({
      next: () => {
        this.isMemberMutating.set(false);
        this.joinedStudents.update((list) => [student, ...list]);
        this.hasMutated = true;
      },
      error: (err) => {
        this.isMemberMutating.set(false);
        this.errorMessage.set(err?.error?.errorMsg || err?.error?.message || 'Failed to add student.');
      },
    });
  }

  handleRemoveStudent(studentId: string): void {
    if (this.isMemberMutating()) return;

    this.isMemberMutating.set(true);
    this.errorMessage.set(null);

    this.api.removeMember(studentId).subscribe({
      next: () => {
        this.joinedStudents.update((list) => list.filter((s) => s.id !== studentId));
        this.hasMutated = true;
      },
      error: (err) => {
        this.isMemberMutating.set(false);
        this.errorMessage.set(err?.error?.errorMsg || err?.error?.message || 'Failed to remove student.');
      },
    });
  }

  handleGenerateCode(payload: GenerateJoinCodePayload): void {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.api.generateCode(payload).subscribe({
      next: (newConfig) => {
        this.isSubmitting.set(false);
        this.joinConfig.set(newConfig);
        this.hasMutated = true;
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.errorMsg || err?.error?.message || 'Failed to generate invitation code.');
      },
    });
  }

  handleClose(): void {
    if (this.hasMutated) {
      this.dialogRef.close({
        joinedStudentIds: this.joinedStudents().map((s) => s.id),
        joinConfig: this.joinConfig(),
      });
    } else {
      this.dialogRef.close();
    }
  }
}