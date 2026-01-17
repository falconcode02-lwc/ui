import { Component, AfterViewInit } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzLayoutModule } from "ng-zorro-antd/layout";
import { NzMenuModule } from "ng-zorro-antd/menu";
import { NzConfigService } from "ng-zorro-antd/core/config";
import { NzBreadCrumbModule } from "ng-zorro-antd/breadcrumb";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs/operators";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import {
  EditorStatus,
  EditorStatusService,
} from "./service/editor-status-service";
import { BreadcrumbService, Breadcrumb } from "./service/breadcrumb.service";
import { APP_VERSION, BUILD_TIME } from "./environments/version";
import { constants } from "./environments/constats";
import { NzAvatarModule } from "ng-zorro-antd/avatar";
import { NzSelectModule } from "ng-zorro-antd/select";
import { WorkspaceService } from "./service/workspace.service";
import { ProjectService } from "./pages/projects/project-service";
import { Workspace } from "./model/workspace-model";
import { Project } from "./pages/projects/project-model";
import { ContextService } from "./service/context.service";

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
  selector: "app-root",
  standalone: true,
  imports: [
    RouterLink,
    RouterOutlet,
    NzIconModule,
    NzLayoutModule,
    NzMenuModule,
    NzBreadCrumbModule,
    CommonModule,
    NzAvatarModule,
    NzSelectModule,
    FormsModule,
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent implements AfterViewInit {
  status: EditorStatus = { line: 1, column: 1, wordCount: 0 };

  private subStatus?: Subscription;
  private subCenterMsg?: Subscription;
  breadcrumbs: Breadcrumb[] = [];
  dark = false;
  version = APP_VERSION;
  buildTime = new Date(BUILD_TIME).toLocaleString();

  // Workspace and Project dropdowns
  workspaces: Workspace[] = [];
  projects: Project[] = [];
  selectedWorkspace: string | null = null;
  selectedProject: string | null = null;
  isSelectionDisabled = false;
  private contextSub?: Subscription;

  constructor(
    private nzConfig: NzConfigService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private editorStatus: EditorStatusService,
    private breadcrumbService: BreadcrumbService,
    private workspaceService: WorkspaceService,
    private projectService: ProjectService,
    private contextService: ContextService
  ) {
    this.subStatus = this.editorStatus.status$.subscribe(
      (status) => (this.status = status)
    );

    // Subscribe to breadcrumb service
    this.breadcrumbService.breadcrumbs$.subscribe((breadcrumbs) => {
      this.breadcrumbs = breadcrumbs;
    });
  }

  isCollapsed = true;
  ngOnInit(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const routeBreadcrumbs = this.createBreadcrumbs(
          this.activatedRoute.root
        );
        this.breadcrumbService.setBreadcrumbs(routeBreadcrumbs);

        // Check internal route for designer to disable dropdowns
        const url = this.router.url;
        this.isSelectionDisabled = url.includes("/workflow/designer");
      });

    // Load workspaces and restore saved selections
    this.loadWorkspaces();
    this.restoreSavedSelections();

    // Sync with global context
    this.contextSub = this.contextService.workspace$.subscribe((ws) => {
      this.selectedWorkspace = ws;
      if (ws) {
        this.loadProjects(ws);
      }
    });
    this.contextSub.add(
      this.contextService.project$.subscribe((p) => {
        this.selectedProject = p;
      })
    );
  }

  ngAfterViewInit() {
    this.toggleTheme();
  }

  toggleTheme() {
    this.dark = !this.dark;
    // set theme variable or CSS root class
    const themeSetting = this.dark
      ? {
          /* dark vars */
        }
      : {
          /* light vars */
        };
    this.nzConfig.set("theme", themeSetting);
    document.body.setAttribute("theme", this.dark ? "dark" : "light");
  }

  private createBreadcrumbs(
    route: ActivatedRoute,
    url: string = "",
    breadcrumbs: Breadcrumb[] = []
  ): Breadcrumb[] {
    const children = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL: string = child.snapshot.url
        .map((segment) => segment.path)
        .join("/");
      if (routeURL !== "") {
        url += `/${routeURL}`;
      }

      const label = child.snapshot.data["breadcrumb"];
      if (label) {
        breadcrumbs.push({ label, url });
      }

      return this.createBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }

  handleBreadcrumbClick(crumb: Breadcrumb) {
    console.log("Breadcrumb clicked:", crumb.label);
    if (crumb.onClick) {
      crumb.onClick();
    }
  }

  ngOnDestroy() {
    this.subStatus?.unsubscribe();
    this.subCenterMsg?.unsubscribe();
    this.contextSub?.unsubscribe();
  }

  // Workspace and Project methods
  private loadWorkspaces(): void {
    this.workspaceService.getWorkspaces(0, 500).subscribe({
      next: (response) => {
        this.workspaces = response.content || [];
        // If nothing is selected, and we have workspaces, select the first one
        if (!this.selectedWorkspace && this.workspaces.length > 0) {
          const firstWorkspace = this.workspaces[0];
          const workspaceId = firstWorkspace.code || firstWorkspace.id;
          this.onWorkspaceChange(workspaceId);
        }
      },
      error: (error) => {
        console.error("Error loading workspaces:", error);
      },
    });
  }

  private loadProjects(workspaceId: string): void {
    // Note: ProjectService.getAll() uses a hardcoded workspace code
    // You may need to update the service to accept workspaceId parameter
    this.projectService.getAll().subscribe({
      next: (projects) => {
        this.projects = projects;
      },
      error: (error) => {
        console.error("Error loading projects:", error);
        this.projects = [];
      },
    });
  }

  private restoreSavedSelections(): void {
    const savedWorkspace = this.contextService.getWorkspace();
    const savedProject = this.contextService.getProject();

    if (savedWorkspace) {
      this.selectedWorkspace = savedWorkspace;
      this.loadProjects(savedWorkspace);
    }

    if (savedProject) {
      this.selectedProject = savedProject;
    }
  }

  onWorkspaceChange(workspaceId: string | null): void {
    console.log("Workspace changed:", workspaceId);
    this.selectedWorkspace = workspaceId;
    this.selectedProject = null; // Reset project selection
    this.projects = []; // Clear projects

    // Save to context
    this.contextService.setWorkspace(workspaceId);
    this.contextService.setProject(null);

    // Load projects for the selected workspace
    if (workspaceId) {
      this.loadProjects(workspaceId);
    }
  }

  onProjectChange(projectId: string | null): void {
    console.log("Project changed:", projectId);
    this.selectedProject = projectId;

    // Save to context
    this.contextService.setProject(projectId);

    // Redirect to dashboard if a project is selected
    if (projectId) {
      // this.router.navigate(["/dashboard"]);
    }
  }
}
