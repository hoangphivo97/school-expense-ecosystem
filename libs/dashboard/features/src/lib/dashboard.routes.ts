import { Routes } from '@angular/router';
import { ProjectOverview } from './project-overview/project-overview';
import { DashboardComponent } from './dashboard-features/dashboard-features';


export const DASHBOARD_ROUTES: Routes = [
    {
        path: '',
        component: ProjectOverview
    },
    {
        path: 'project-overview',
        component: ProjectOverview
    },
    {
        path: 'analytics',
        component: DashboardComponent,
    },
]