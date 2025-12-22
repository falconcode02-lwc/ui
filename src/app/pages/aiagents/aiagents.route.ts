import { Routes } from '@angular/router'; 
import { AgentManagementComponent } from './agent-management.component';

export const AIAgent_ROUTES: Routes = [
  { path: '', component: AgentManagementComponent, title: 'AI Agents', data: { breadcrumb: 'AI Agents' } }
];
