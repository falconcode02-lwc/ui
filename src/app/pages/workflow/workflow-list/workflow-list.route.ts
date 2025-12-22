import { Routes } from '@angular/router';
import { WorkflowListComponent } from './workflow-list.component';

export const WORKFLOW_LIST_ROUTES: Routes = [
    { path: '', component: WorkflowListComponent, title: 'Workflows', data: { breadcrumb: 'View' } },
    { path: 'designer', loadChildren: () => import('../../../pages/workflow/workflow.routes').then(m => m.WORKFLOW_ROUTES), data: { breadcrumb: '' } },
];
