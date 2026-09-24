import { AuthenticatedUser, FacultyId, Role, UserType } from '@school-expense-ecosystem/shared/types';

export const createMockAuthenticatedUser = (
    overrides?: Partial<AuthenticatedUser>
): AuthenticatedUser => ({
    uid: 'default-user-uid',
    role: Role.LEVEL_2_DEAN,
    userType: UserType.TEACHER,
    facultyId: FacultyId.FIT,
    fullName: 'Default user Name',
    userCode: 'USER_FIT_01',
    ...overrides,
});