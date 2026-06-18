export enum UserType {
  STUDENT = 'student',
  TEACHER = 'teacher',
  STAFF = 'staff',
}

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active', 
  REJECTED = 'rejected',
  ONBOARDING = 'onboarding'
}

export enum Role {
  LEVEL_0_ADMIN = 'admin',               
  LEVEL_1_FINANCE = 'finance_officer', 
  LEVEL_2_DEAN = 'faculty_dean',       
  LEVEL_3_USER = 'end_user',
}

export enum FacultyId {
  FIT = 'fit', // Faculty of Information Technology
  FBE = 'fbe', // Faculty of Business and Economics
  FLL = 'fll', // Faculty of Foreign Languages
}

