import { Routes } from '@angular/router';
import { MjmlViewerComponent } from './mjml-viewer.component';

export const mjmlViewerRoutes: Routes = [
  {
    path: '',
    component: MjmlViewerComponent,
    title: 'MJML Email Viewer'
  }
];
