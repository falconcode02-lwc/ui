import { Routes } from '@angular/router';
import { LoginComponent } from '../pages/login/login.component';
import { routes } from '../app.routes';
import { AppComponent } from '../app.component';

export const APP_SHELL_ROUTES: Routes = [
    {
        path: '',
        children: [
            {
                path: 'login', component: LoginComponent
            },
            {
                path: '', component: AppComponent,
                children: [
                    ...routes
                ]
            },
            { path: 'form-viewer/:code', title: 'Form Viewer', loadComponent: () => import('../pages/form-viewer/form-viewer.component').then(m => m.FormViewerComponent), data: { breadcrumb: 'Form Viewer' } },
            { path: '**', redirectTo: '' }
        ]
    }
];
