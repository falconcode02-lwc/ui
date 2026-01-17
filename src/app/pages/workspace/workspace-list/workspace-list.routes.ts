import { Routes } from '@angular/router';
import { WorkspaceListComponent } from './workspace-list.component';
import { WorkspaceCreateComponent } from '../workspace-create/workspace-create.component';

export const WORKSPACE_LIST_ROUTES: Routes = [
    { path: '', component: WorkspaceListComponent, title: 'Workspaces', data: { breadcrumb: 'View' } },
    { path: 'create', component: WorkspaceCreateComponent, title: 'Create Workspace', data: { breadcrumb: 'Create' } },
    // { path: 'designer', loadChildren: () => import('../../../pages/workflow/workflow.routes').then(m => m.WORKFLOW_ROUTES), data: { breadcrumb: '' } },
];