import { AuthenticatedUser, FacultyId, Role, UserStatus, UserType } from '@school-expense-ecosystem/shared/types';

export const createMockAuthenticatedUser = (
    overrides?: Partial<AuthenticatedUser>
): AuthenticatedUser => ({
    uid: 'default-user-uid',
    role: Role.LEVEL_2_DEAN,
    userType: UserType.TEACHER,
    facultyId: FacultyId.FIT,
    status: UserStatus.ACTIVE,
    fullName: 'Default user Name',
    userCode: 'USER_FIT_01',
    ...overrides,
});