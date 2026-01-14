import { Routes } from '@angular/router';
import { ProjectComponent } from './project-component';

export const PROJECT_ROUTES: Routes = [
  { path: '', component: ProjectComponent, title: 'New Project', data: { breadcrumb: 'New Project' } },
];
