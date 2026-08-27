import { Routes } from "@angular/router";
import { ProjectListComponent } from "./features/project/project-list.component";
import { ProjectLayoutComponent } from "./features/project-layout/project-layout.component";
import { EventListComponent } from "./features/event-list/event-list.component";
import { Role } from "@school-expense-ecosystem/shared/types";

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