import { Routes } from '@angular/router';
// import { LoginLayoutComponent } from './pages/login/login-layout.component';
// import { LoginComponent } from './pages/login/login.component';
// import { APP_SHELL_ROUTES } from './app-shell/app-shell.routes';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/dashboard' },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./pages/dashboard/dashboard.routes').then(
        (m) => m.DASHBOARD_ROUTES
      ),
  },
  {
    path: 'editor',
    loadChildren: () =>
      import('./pages/editor/editor.routes').then((m) => m.EDITOR_ROUTES),
  },
  {
    path: 'workflow-history',
    loadChildren: () =>
      import('./pages/workflow-history/workflow-history.routes').then(
        (m) => m.WORKFLOW_HISTORY_ROUTES
      ),
  },
  {
    path: 'workflow-history-compact',
    loadChildren: () =>
      import(
        './pages/workflow-history-compact/workflow-history-compact-route'
      ).then((m) => m.WORKFLOW_HISTORY_COMPACT_ROUTES),
  },
  {
    path: 'workflow-history-compact/:id',
    loadChildren: () =>
      import(
        './pages/workflow-history-compact/workflow-history-compact-route'
      ).then((m) => m.WORKFLOW_HISTORY_COMPACT_ROUTES),
  },
  {
    path: 'workflow',
    loadChildren: () =>
      import('./pages/workflow/workflow-list/workflow-list.route').then(
        (m) => m.WORKFLOW_LIST_ROUTES
      ),
    data: { breadcrumb: 'Workflow' },
  },
  {
    path: 'schedular',
    loadChildren: () =>
      import('./pages/components/scheduler/schedule-editor.route').then(
        (m) => m.SCHEDULER_ROUTES
      ),
  },
  {
    path: 'secrets',
    title: 'Secrets Manager',
    loadComponent: () =>
      import('./pages/secrets/secrets.component').then(
        (m) => m.SecretsComponent
      ),
    data: { breadcrumb: 'Secrets' },
  },
  {
    path: 'aiagents',
    loadChildren: () =>
      import('./pages/aiagents/aiagents.route').then((m) => m.AIAgent_ROUTES),
  },
  {
    path: 'forms',
    loadChildren: () =>
      import('./pages/form-builder/form-list/form-list.route').then(
        (m) => m.FORM_LIST_ROUTES
      ),
    data: { breadcrumb: 'Forms' },
  },
  {
    path: 'form-builder',
    title: 'Form Builder',
    loadComponent: () =>
      import('./pages/form-builder/form-builder.component').then(
        (m) => m.FormBuilderComponent
      ),
    data: { breadcrumb: 'Form Builder' },
  },
  {
    path: 'form-builder/:id',
    title: 'Form Builder',
    loadComponent: () =>
      import('./pages/form-builder/form-builder.component').then(
        (m) => m.FormBuilderComponent
      ),
    data: { breadcrumb: 'Form Builder' },
  },
  {
    path: 'mjml-builder',
    title: 'MJML Builder',
    loadComponent: () =>
      import('./pages/mjml-builder/mjml-builder.component').then(
        (m) => m.MjmlBuilderComponent
      ),
    data: { breadcrumb: 'MJML Builder' },
  },
  {
    path: 'mjml-viewer',
    loadChildren: () =>
      import('./pages/mjml-viewer/mjml-viewer.routes').then(
        (m) => m.mjmlViewerRoutes
      ),
    data: { breadcrumb: 'MJML Viewer' },
  },
  {
    path: 'mjml-editor',
    loadChildren: () =>
      import('./pages/mjml-editor/mjml-editor.routes').then(
        (m) => m.mjmlEditorRoutes
      ),
    data: { breadcrumb: 'Email Editor' },
  },
  {
    path: 'plugin-manager',
    title: 'Plugin Manager',
    loadComponent: () =>
      import('./pages/plugin-manager/plugin-manager.component').then(
        (m) => m.PluginManagerComponent
      ),
    data: { breadcrumb: 'Plugin Manager' },
  },
  {
    path: 'custom-variables',
    title: 'Custom Variables',
    loadComponent: () =>
      import('./pages/custom-variables/custom-variables.component').then(
        (m) => m.CustomVariablesComponent
      ),
    data: { breadcrumb: 'Custom Variables' },
  },
  {
    path: 'profile',
    title: 'Profile',
    loadChildren: () =>
      import('./pages/profile/profile.routes').then((m) => m.PROFILE_ROUTES),
    data: { breadcrumb: 'Profile' },
  },
];
