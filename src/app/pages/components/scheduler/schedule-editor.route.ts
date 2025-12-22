import { Routes } from '@angular/router';
import { SchedulerFormComponent } from './schedule-editor.component';


export const SCHEDULER_ROUTES: Routes = [
    { path: '', component: SchedulerFormComponent, title: 'Scheduler', data: { breadcrumb: 'Scheduler' } },
];
