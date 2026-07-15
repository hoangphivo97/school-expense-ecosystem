import { DemoAccount } from "@school-expense-ecosystem/shared/types";

export const DemoAccountArr: DemoAccount[] = [
    {
        role: 'DEAN',
        email: 'professor.demo@ntust.edu.tw',
        password: 'DemoPassword123',
        description: 'Authorized to review, approve, or reject departmental expense claims, grant allocations, and academic research requests.'
    },
    {
        role: 'Student',
        email: 'student.demo@ntust.edu.tw',
        password: 'DemoPassword123',
        description: 'Submits educational expense reimbursement requests and tracks individual research laboratory budget allocations.'
    },
    {
        role: 'System Administrator',
        email: 'sysadmin.demo@ntust.edu.tw',
        password: 'DemoPassword123',
        description: 'Granted full global access to monitor system audit logs, manage configuration parameters, and orchestrate workspace security rules.'
    },
    {
        role: 'Teacher',
        email: 'teacher.demo@ntust.edu.tw',
        password: 'DemoPassword123',
        description: 'Submits educational expense reimbursement requests and tracks individual research laboratory budget allocations. Authorizes initial student reimbursement claims within their specific faculty perimeter.'
    }
];