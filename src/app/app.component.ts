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
import { NzModalModule } from "ng-zorro-antd/modal";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzListModule } from "ng-zorro-antd/list";
import { WorkspaceService } from "./service/workspace.service";
import { ProjectService } from "./pages/projects/project-service";
import { Workspace } from "./model/workspace-model";
import { Project } from "./pages/projects/project-model";
import { ContextService } from "./service/context.service";
import { NzDropDownModule } from "ng-zorro-antd/dropdown";
import { AuthService } from "./service/auth.service";

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
    NzModalModule,
    NzListModule,
    NzButtonModule,
    NzDropDownModule,
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
  themeMode: "light" | "dark" | "system" = "system";
  version = APP_VERSION;
  buildTime = new Date(BUILD_TIME).toLocaleString();

  // Workspace and Project dropdowns
  workspaces: Workspace[] = [];
  projects: Project[] = [];
  selectedWorkspace: string | null = null;
  selectedProject: string | null = null;
  selectedWorkspaceName: string | null = null;
  selectedProjectName: string | null = null;
  isSelectionDisabled = false;
  private contextSub?: Subscription;
  private userSub?: Subscription;
  userRole: string | null = null;

  // Modal visibility
  isWorkspaceModalVisible = false;
  isProjectModalVisible = false;
  isProjectsLoading = false;

  constructor(
    private nzConfig: NzConfigService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private editorStatus: EditorStatusService,
    private breadcrumbService: BreadcrumbService,
    private workspaceService: WorkspaceService,
    private projectService: ProjectService,
    private contextService: ContextService,
    public authService: AuthService,
  ) {
    this.subStatus = this.editorStatus.status$.subscribe(
      (status) => (this.status = status),
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
          this.activatedRoute.root,
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
      } else {
        this.selectedWorkspaceName = null;
        this.projects = [];
      }
    });
    this.contextSub.add(
      this.contextService.project$.subscribe((p) => {
        this.selectedProject = p;
        if (!p) {
          this.selectedProjectName = null;
        }
      }),
    );

    // Subscribe to user changes for role-based visibility
    this.userSub = this.authService.currentUser$.subscribe((user) => {
      this.userRole = user?.roleName || null;
    });
  }

  ngAfterViewInit() {
    this.initializeTheme();
  }

  initializeTheme() {
    // Load saved theme preference
    const savedTheme = localStorage.getItem("themeMode") as
      | "light"
      | "dark"
      | "system";
    if (savedTheme) {
      this.themeMode = savedTheme;
    }
    this.applyTheme();

    // Listen for system theme changes
    if (window.matchMedia) {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", (e) => {
          if (this.themeMode === "system") {
            this.applyTheme();
          }
        });
    }
  }

  setThemeMode(mode: "light" | "dark" | "system") {
    this.themeMode = mode;
    localStorage.setItem("themeMode", mode);
    this.applyTheme();
  }

  applyTheme() {
    let isDark = false;

    if (this.themeMode === "system") {
      // Detect system preference
      isDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
      isDark = this.themeMode === "dark";
    }

    this.dark = isDark;

    // Update body attributes for theme
    document.body.setAttribute("data-theme", isDark ? "dark" : "light");

    // Add/remove light theme class for ng-zorro components
    if (isDark) {
      document.body.classList.remove("light-theme");
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
      document.body.classList.add("light-theme");
    }

    const themeSetting = isDark
      ? {
          /* dark vars */
        }
      : {
          /* light vars */
        };
    this.nzConfig.set("theme", themeSetting);
  }

  getThemeIcon(): string {
    if (this.themeMode === "system") return "laptop";
    if (this.themeMode === "dark") return "moon";
    return "sun";
  }

  isAdmin(): boolean {
    //alert(this.userRole);
    return (
      this.userRole?.toLowerCase() == "admin" ||
      this.userRole?.toLowerCase() == "super_admin"
    );
  }

  private createBreadcrumbs(
    route: ActivatedRoute,
    url: string = "",
    breadcrumbs: Breadcrumb[] = [],
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
    this.userSub?.unsubscribe();
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
          this.selectedWorkspaceName = firstWorkspace.name;
          this.onWorkspaceChange(workspaceId);
        } else if (this.selectedWorkspace) {
          // Set name for already selected workspace
          const workspace = this.workspaces.find(
            (w) => (w.code || w.id) === this.selectedWorkspace,
          );
          if (workspace) {
            this.selectedWorkspaceName = workspace.name;
          }
        }
      },
      error: (error) => {
        console.error("Error loading workspaces:", error);
      },
    });
  }

  private loadProjects(workspaceId: string): void {
    this.isProjectsLoading = true;
    // Note: ProjectService.getAll() uses a hardcoded workspace code
    // You may need to update the service to accept workspaceId parameter
    this.projectService.getAll().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.isProjectsLoading = false;
        // Set name for already selected project
        if (this.selectedProject) {
          const project = this.projects.find(
            (p) => p.id === this.selectedProject,
          );
          if (project) {
            this.selectedProjectName = project.name;
          }
        }
      },
      error: (error) => {
        console.error("Error loading projects:", error);
        this.projects = [];
        this.isProjectsLoading = false;
      },
    });
  }
  private restoreSavedSelections(): void {
    const savedWorkspace = this.contextService.getWorkspace();
    const savedProject = this.contextService.getProject();

    if (savedWorkspace) {
      this.selectedWorkspace = savedWorkspace;
      this.selectedWorkspaceName = localStorage.getItem(
        "selectedWorkspaceName",
      );
      this.loadProjects(savedWorkspace);
    }

    if (savedProject) {
      this.selectedProject = savedProject;
      this.selectedProjectName = localStorage.getItem("selectedProjectName");
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

  // Modal methods
  showWorkspaceModal(): void {
    this.isWorkspaceModalVisible = true;
  }

  showProjectModal(): void {
    this.isProjectModalVisible = true;
  }

  handleWorkspaceModalOk(): void {
    this.isWorkspaceModalVisible = false;
  }

  handleWorkspaceModalCancel(): void {
    this.isWorkspaceModalVisible = false;
  }

  handleProjectModalOk(): void {
    this.isProjectModalVisible = false;
  }

  handleProjectModalCancel(): void {
    this.isProjectModalVisible = false;
  }

  selectWorkspaceFromModal(workspaceId: string): void {
    const workspace = this.workspaces.find(
      (w) => (w.code || w.id) === workspaceId,
    );
    if (workspace) {
      this.selectedWorkspaceName = workspace.name;
      localStorage.setItem("selectedWorkspaceName", workspace.name);
    }
    this.onWorkspaceChange(workspaceId);
    this.isWorkspaceModalVisible = false;

    // Automatically show project modal after workspace selection
    setTimeout(() => {
      this.showProjectModal();
    }, 300);
  }

  selectProjectFromModal(projectId: string): void {
    const project = this.projects.find((p) => p.id === projectId);
    if (project) {
      this.selectedProjectName = project.name;
      localStorage.setItem("selectedProjectName", project.name);
      // Ensure we store the ID (UUID) specifically
      if (project.id) {
        localStorage.setItem("selectedProject", project.id);
      }
    }
    this.onProjectChange(projectId);
    this.isProjectModalVisible = false;
  }
}
