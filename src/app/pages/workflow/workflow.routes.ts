import { Routes } from '@angular/router';
import { WorkflowEditorComponent } from './workflow.component';

export const WORKFLOW_ROUTES: Routes = [
  {
    path: '',
    component: WorkflowEditorComponent,
    title: 'Workflow Designer',
    data: { breadcrumb: 'Designer' },
  },
  {
    path: ':id',
    component: WorkflowEditorComponent,
    title: 'Edit Workflow',
    data: { breadcrumb: 'Designer Edit' },
  },
  {
    path: ':id/:runid',
    component: WorkflowEditorComponent,
    title: 'Edit Workflow',
    data: { breadcrumb: 'Designer Edit' },
  },
];
