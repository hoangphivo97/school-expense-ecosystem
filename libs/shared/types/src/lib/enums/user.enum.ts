export enum UserType {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  STAFF = 'STAFF',
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE', 
  REJECTED = 'REJECTED',
  ONBOARDING = 'ONBOARDING',
  SUSPENDED = 'SUSPENDED'
}

export enum Role {
  LEVEL_0_ADMIN = 'ADMIN',               
  LEVEL_1_FINANCE = 'FINANCE_OFFICER', 
  LEVEL_2_DEAN = 'FACULTY_DEAN',       
  LEVEL_3_USER = 'END_USER',
}

export enum FacultyId {
  FIT = 'FIT', // Faculty of Information Technology
  FBE = 'FBE', // Faculty of Business and Economics
  FLL = 'FLL', // Faculty of Foreign Languages
}