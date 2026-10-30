import { FacultyId } from "@school-expense-ecosystem/shared/types";

export interface CompleteOnboardingPayload{
    fullName: string;
    facultyId: FacultyId;
    userCode: string;
    dateOfBirth: string;
}