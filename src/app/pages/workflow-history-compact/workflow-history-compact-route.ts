import { Routes } from '@angular/router';
import { WorkflowHistoryCompactComponent } from './workflow-history-compact';


export const WORKFLOW_HISTORY_COMPACT_ROUTES: Routes = [
  { path: '', component: WorkflowHistoryCompactComponent, title: 'Workflow History', data: { breadcrumb: 'History' } },
];
