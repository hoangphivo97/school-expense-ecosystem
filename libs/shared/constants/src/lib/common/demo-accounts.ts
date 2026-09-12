import { DemoAccount, Role, UserType } from "@school-expense-ecosystem/shared/types";

export const DemoAccountArr: DemoAccount[] = [
    {
        role: Role.LEVEL_2_DEAN,
        email: 'professor.demo@ntust.edu.tw',
        password: 'DemoPassword123',
        description: 'Authorized to review, approve, or reject departmental expense claims, grant allocations, and academic research requests.'
    },
    {
        role: Role.LEVEL_3_USER,
        email: 'student.demo@ntust.edu.tw',
        password: 'DemoPassword123',
        description: 'Submits educational expense reimbursement requests and tracks individual research laboratory budget allocations.',
        userType: UserType.STUDENT
    },
    {
        role: Role.LEVEL_0_ADMIN,
        email: 'sysadmin.demo@ntust.edu.tw',
        password: 'DemoPassword123',
        description: 'Granted full global access to monitor system audit logs, manage configuration parameters, and orchestrate workspace security rules.'
    },
    {
        role: Role.LEVEL_3_USER,
        email: 'teacher.demo@ntust.edu.tw',
        password: 'DemoPassword123',
        description: 'Submits educational expense reimbursement requests and tracks individual research laboratory budget allocations. Authorizes initial student reimbursement claims within their specific faculty perimeter.',
        userType: UserType.TEACHER
    },
    {
        role: Role.LEVEL_1_FINANCE,
        email: 'finance.demo@ntust.edu.tw',
        password: 'School@123456',
        description: 'School Finance Officer responsible for university-wide financial oversight, auditing, and final budget approval for school-funded projects and events.'
    }
];