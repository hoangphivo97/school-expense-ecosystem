import { Routes } from "@angular/router";
import { Role } from "@school-expense-ecosystem/shared/types";
import { EventListComponent } from "./pages/event-list/event-list.component";
import { ProjectListComponent } from "./pages/project-list/project-list.component";
import { ProjectLayoutComponent } from "./layouts/project-layout/project-layout.component";

export const PROJECT_ROUTES: Routes = [
  {
    path: 'project-manager',
    component: ProjectLayoutComponent,
    data: {
      roles: [
        Role.LEVEL_1_FINANCE,
        Role.LEVEL_2_DEAN,
        Role.LEVEL_3_USER,
      ],
    },
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: ProjectListComponent },
      { path: 'events', component: EventListComponent },
    ],
  },
];