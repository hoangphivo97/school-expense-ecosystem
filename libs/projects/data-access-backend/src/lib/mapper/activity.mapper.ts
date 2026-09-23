import { BaseActivityItem, EnrolledActivitySummary, StudentSummary } from '@school-expense-ecosystem/projects/types';

// Pure mapper function stripping financial details from any BaseActivityItem
export function toEnrolledActivitySummary(
  item: BaseActivityItem<unknown, string>
): EnrolledActivitySummary {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    type: String(item.type),
    status: item.status,
    facultyId: item.facultyId,
    startDate: item.startDate,
    endDate: item.endDate,
    joinedStudentIds: item.joinedStudentIds ?? [],
    updatedAt: item.updatedAt,
  };
}

export function toStudentSummary(user: { uid?: string; id?: string; userCode?: string; fullName?: string; email?: string }): StudentSummary {
  return {
    id: user.uid || user.id || '',
    studentCode: String(user.userCode || '').trim(),
    fullName: String(user.fullName || '').trim(),
    email: String(user.email || '').trim(),
  };
}

export function toStudentSummaryList(users: Array<{ uid?: string; id?: string; userCode?: string; fullName?: string; email?: string }>): StudentSummary[] {
  return users.map(toStudentSummary);
}