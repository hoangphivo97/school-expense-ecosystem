import { Routes } from "@angular/router";
import { Role } from "@school-expense-ecosystem/shared/types";
import { ProjectLayoutComponent } from "./layouts/project-layout/project-layout.component";

export const PROJECT_ROUTES: Routes = [
  {
    path: 'project-manager',
    component: ProjectLayoutComponent,
    data: {
      roles: [Role.LEVEL_1_FINANCE, Role.LEVEL_2_DEAN, Role.LEVEL_3_USER],
    },
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./pages/project-list/project-list.component').then((m) => m.ProjectListComponent),
      },
      {
        path: 'events',
        loadComponent: () =>
          import('./pages/event-list/event-list.component').then((m) => m.EventListComponent),
      },
    ],
  },
];