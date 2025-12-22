import { Component, AfterViewInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzConfigService } from 'ng-zorro-antd/core/config';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { EditorStatus, EditorStatusService } from './service/editor-status-service';
import { BreadcrumbService, Breadcrumb } from './service/breadcrumb.service';
import { APP_VERSION, BUILD_TIME } from './environments/version';
import {constants } from './environments/constats' 
import { NzAvatarModule } from 'ng-zorro-antd/avatar';

// const originalLog = console.log;
// const originalError = console.error;
// const originalWarn = console.warn;
/*
console.log = (...args) => {
  if(!constants.debug) return
  const timestamp = new Date().toISOString();
  
  originalLog(
    "%c[FalconFlow]%c > %c" + timestamp,
    "color: #00bbff; font-weight:bold;",  // style for [FalconFlow]
    "color: white;",                      // style for ">"
    "color: #fcce00ff;",                    // style for timestamp
    ...args
  );
};

console.error = (...args) => {

  const timestamp = new Date().toISOString();
   originalError(
    "%c[FalconFlow]%c > %c" + timestamp,
    "color: #00bbff; font-weight:bold;",  // style for [FalconFlow]
    "color: white;",                      // style for ">"
    "color: #fcce00ff;",                    // style for timestamp
    ...args
  );
};


console.warn = (...args) => {

  const timestamp = new Date().toISOString();
   originalWarn(
    "%c[FalconFlow]%c > %c" + timestamp,
    "color: #00bbff; font-weight:bold;",  // style for [FalconFlow]
    "color: white;",                      // style for ">"
    "color: #fcce00ff;",                    // style for timestamp
    ...args
  );
};
 */

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet, NzIconModule, NzLayoutModule, NzMenuModule, NzBreadCrumbModule, CommonModule, NzAvatarModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit {

  status: EditorStatus = { line: 1, column: 1, wordCount: 0 };
  
  private subStatus?: Subscription;
  private subCenterMsg?: Subscription;
  breadcrumbs: Breadcrumb[] = [];
  dark = false;
  version = APP_VERSION;
  buildTime = new Date(BUILD_TIME).toLocaleString();

  constructor(
    private nzConfig: NzConfigService, 
    private router: Router, 
    private activatedRoute: ActivatedRoute, 
    private editorStatus: EditorStatusService,
    private breadcrumbService: BreadcrumbService
  ) {
    this.subStatus = this.editorStatus.status$.subscribe((status) => (
      this.status = status
    ));
  
    // Subscribe to breadcrumb service
    this.breadcrumbService.breadcrumbs$.subscribe((breadcrumbs) => {
      this.breadcrumbs = breadcrumbs;
    });
  }

  isCollapsed = true;
  ngOnInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const routeBreadcrumbs = this.createBreadcrumbs(this.activatedRoute.root);
        this.breadcrumbService.setBreadcrumbs(routeBreadcrumbs);
      });
  }


  ngAfterViewInit() {

    this.toggleTheme();

  }

  toggleTheme() {
    this.dark = !this.dark;
    // set theme variable or CSS root class
    const themeSetting = this.dark ? { /* dark vars */ } : { /* light vars */ };
    this.nzConfig.set('theme', themeSetting);
    document.body.setAttribute('theme', this.dark ? 'dark' : 'light');
  }

  private createBreadcrumbs(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: Breadcrumb[] = []
  ): Breadcrumb[] {
    const children = route.children;


    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      const label = child.snapshot.data['breadcrumb'];
      if (label) {
        breadcrumbs.push({ label, url });
      }

      return this.createBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }

  handleBreadcrumbClick(crumb: Breadcrumb) {
    console.log('Breadcrumb clicked:', crumb.label);
    if (crumb.onClick) {
      crumb.onClick();
    }
  }

  ngOnDestroy() {
    this.subStatus?.unsubscribe();
    this.subCenterMsg?.unsubscribe();
  }


}
