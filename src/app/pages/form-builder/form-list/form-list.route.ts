import { Routes } from '@angular/router';
import { FormListComponent } from './form-list.component';

export const FORM_LIST_ROUTES: Routes = [
    { path: '', component: FormListComponent, title: 'Forms', data: { breadcrumb: 'View' } },
];
