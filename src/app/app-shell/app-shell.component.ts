import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  template: `
    <div class="app-shell">
       <div class="app-body">
        <main class="app-main">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles:[`.app-shell, .app-body, .app-main { height:100%; width:100%}`],
  standalone: true,
  imports: [RouterOutlet]
})
export class AppShellComponent {}
