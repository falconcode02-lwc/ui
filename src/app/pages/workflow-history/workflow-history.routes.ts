import { Routes } from '@angular/router';
import { WorkflowHistoryComponent } from './workflow-history.component';

export const WORKFLOW_HISTORY_ROUTES: Routes = [
  { path: '', component: WorkflowHistoryComponent, title: 'Workflow History', data: { breadcrumb: 'History' } },
];
