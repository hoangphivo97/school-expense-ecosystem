import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-budget-manager',
  imports: [CommonModule],
  templateUrl: './budget-manager.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './budget-manager.scss',
})
export class BudgetManager {

  // readonly faculties = [
  //   { id: FacultyId.FIT, name: 'Faculty of Information Technology' },
  //   { id: FacultyId.FBE, name: 'Faculty of Business Administration' },
  //   { id: FacultyId.FLL, name: 'Faculty of Foreign Languages' }
  // ];

  // // 1. READ STATE: Đọc danh sách ngân sách hiện tại từ Firestore dạng Signal
  // readonly deployedBudgets = toSignal(this.budgetService.getBudgets(), { initialValue: [] });

  // // 2. WRITE STATE: Form khởi tạo (Giữ nguyên logic Signal Form chuẩn)
  // readonly budgetModel = signal({ facultyId: '', studentCount: 0, quotaPerStudent: 0 });

  // readonly budgetForm = form(this.budgetModel, (p) => {
  //   required(p.facultyId);
  //   required(p.studentCount);
  //   required(p.quotaPerStudent);
  // });

  // readonly computedTotalCeiling = computed(() => {
  //   const state = this.budgetModel();
  //   return state.studentCount * state.quotaPerStudent;
  // });

  // onSubmit(event: EventItem): void {
  //   event.preventDefault();
  //   if (this.budgetForm().invalid()) return;

  //   const currentState = this.budgetModel();
  //   const selectedFaculty = this.faculties.find(f => f.id === currentState.facultyId);

  //   const budgetPayload: FacultyBudgetInit = {
  //     facultyId: currentState.facultyId,
  //     facultyName: selectedFaculty ? selectedFaculty.name : '',
  //     studentCount: currentState.studentCount,
  //     quotaPerStudent: currentState.quotaPerStudent,
  //     totalBudgetCeiling: this.computedTotalCeiling(),
  //   };

  //   this.budgetService.initializeFacultyBudget(budgetPayload).subscribe({
  //     next: () => {
  //       this.budgetModel.set({ facultyId: '', studentCount: 0, quotaPerStudent: 0 });
  //     },
  //     error: (err) => console.error('Transaction failed:', err)
  //   });
  // }
}
