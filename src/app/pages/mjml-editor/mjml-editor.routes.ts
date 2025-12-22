import { Routes } from '@angular/router';
import { MjmlEditorComponent } from './mjml-editor.component';

export const mjmlEditorRoutes: Routes = [
  {
    path: '',
    component: MjmlEditorComponent,
    title: 'MJML Email Editor'
  }
];
