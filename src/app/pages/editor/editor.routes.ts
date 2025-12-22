import { Routes } from '@angular/router';
import { EditorComponent } from './editor.component';


export const EDITOR_ROUTES: Routes = [
  { path: '', component: EditorComponent, title: 'Code Editor', data: { breadcrumb: 'Code Editor' } },
];
