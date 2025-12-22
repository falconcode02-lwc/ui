import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppShellComponent } from './app/app-shell/app-shell.component';
// import { AppComponent } from './app/app.component';
// (window as any).MonacoEnvironment = {
//   getWorkerUrl: function (_moduleId: string, label: string) {
//     return `assets/monaco/min/vs/base/worker/workerMain.js`;
//   },
// };

bootstrapApplication(AppShellComponent, appConfig)
  .catch((err) => console.error(err));
