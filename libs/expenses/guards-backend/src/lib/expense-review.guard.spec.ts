import { AuthenticatedUser, Role, UserType } from "@school-expense-ecosystem/shared/types";
import { ExpenseReviewGuard } from "./expense-review.guard"
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { createMockAuthenticatedUser } from "@school-expense-ecosystem/shared/test-utils";


describe('ExpenseReviewGuard', () => {
    let guard: ExpenseReviewGuard;

    beforeEach(() => {
        guard = new ExpenseReviewGuard();
    });

    const createMockContext = (user?: AuthenticatedUser): ExecutionContext => {
        return {
            switchToHttp: () => ({
                getRequest: () => ({ user })
            }),
        } as unknown as ExecutionContext
    };

    describe('Denial Cases', () => {
        it('Throw ForbiddenExeption if user is unauthenticated', () => {
            const context = createMockContext(undefined);

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow("Access Denied: Students are not authorized to review expense claims")
        })

        it('Throw ForbiddenExeption if user role is STUDENT', () => {
            const studentUser: AuthenticatedUser = createMockAuthenticatedUser({
                role: Role.LEVEL_3_USER,
                userType: UserType.STUDENT
            })

            const context = createMockContext(studentUser)
            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        })
    })

    describe('Authorization Cases' , () => {
        it('Allow Teacher to Review', () => {
            const teacherUser: AuthenticatedUser = createMockAuthenticatedUser({
                role: Role.LEVEL_3_USER,
                userType: UserType.TEACHER
            })

            const context = createMockContext(teacherUser)
            expect(guard.canActivate(context)).toBe(true);
        })

        it('Allow Dean to Review', () => {
            const deanUser: AuthenticatedUser = createMockAuthenticatedUser({
                role: Role.LEVEL_2_DEAN
            });

            const context = createMockContext(deanUser);
            expect(guard.canActivate(context)).toBe(true);
        })

        it('Not Allow Admin to Review', () => {
            const adminUser: AuthenticatedUser = createMockAuthenticatedUser({
                role: Role.LEVEL_0_ADMIN
            })

            const context = createMockContext(adminUser);
            expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
        })
    })
})