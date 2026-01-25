# Workspace and Project Selection Modal Implementation

## Changes Made:

### 1. Component TypeScript (`app.component.ts`)

**Added Imports:**

- `NzModalModule` from 'ng-zorro-antd/modal'
- `NzButtonModule` from 'ng-zorro-antd/button'
- `NzListModule` from 'ng-zorro-antd/list'

**Added Properties:**

```typescript
isWorkspaceModalVisible = false;
isProjectModalVisible = false;
```

**Added Methods:**

```typescript
showWorkspaceModal(): void
showProjectModal(): void
handleWorkspaceModalOk(): void
handleWorkspaceModalCancel(): void
handleProjectModalOk(): void
handleProjectModalCancel(): void
selectWorkspaceFromModal(workspaceId: string): void
selectProjectFromModal(projectId: string): void
```

### 2. Component HTML (`app.component.html`)

**Update the breadcrumb section (around line 145-154):**

Replace the existing breadcrumb with:

```html
<div class="environment-selectors">
  <nz-breadcrumb style="border-bottom: 0px solid #f0f0f0;font-weight: 800;">
    <nz-breadcrumb-item>
      <a (click)="showWorkspaceModal()" style="cursor: pointer;">
        <nz-icon nzType="database" nzTheme="outline"></nz-icon>
        {{selectedWorkspace || 'Select Workspace'}}
      </a>
    </nz-breadcrumb-item>
    <nz-breadcrumb-item>
      <a (click)="showProjectModal()" style="cursor: pointer;">
        <nz-icon nzType="project" nzTheme="outline"></nz-icon>
        {{selectedProject || 'Select Project'}}
      </a>
    </nz-breadcrumb-item>
  </nz-breadcrumb>
</div>
```

**Add modals at the end of the file (before closing `</nz-layout>`):**

```html
<!-- Workspace Selection Modal -->
<nz-modal
  [(nzVisible)]="isWorkspaceModalVisible"
  nzTitle="Select Workspace"
  (nzOnCancel)="handleWorkspaceModalCancel()"
  (nzOnOk)="handleWorkspaceModalOk()"
  [nzFooter]="null"
>
  <ng-container *nzModalContent>
    <nz-list [nzDataSource]="workspaces" nzBordered>
      <nz-list-item
        *ngFor="let workspace of workspaces"
        (click)="selectWorkspaceFromModal(workspace.code || workspace.id)"
        style="cursor: pointer; padding: 16px;"
        [class.selected]="selectedWorkspace === (workspace.code || workspace.id)"
      >
        <div
          style="display: flex; align-items: center; gap: 12px; width: 100%;"
        >
          <nz-icon
            nzType="database"
            nzTheme="outline"
            style="font-size: 20px;"
          ></nz-icon>
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 14px;">
              {{workspace.name}}
            </div>
            <div style="font-size: 12px; color: var(--text-secondary);">
              {{workspace.code || workspace.id}}
            </div>
          </div>
          <nz-icon
            *ngIf="selectedWorkspace === (workspace.code || workspace.id)"
            nzType="check-circle"
            nzTheme="fill"
            style="color: var(--accent-color); font-size: 20px;"
          ></nz-icon>
        </div>
      </nz-list-item>
    </nz-list>
  </ng-container>
</nz-modal>

<!-- Project Selection Modal -->
<nz-modal
  [(nzVisible)]="isProjectModalVisible"
  nzTitle="Select Project"
  (nzOnCancel)="handleProjectModalCancel()"
  (nzOnOk)="handleProjectModalOk()"
  [nzFooter]="null"
>
  <ng-container *nzModalContent>
    <nz-list [nzDataSource]="projects" nzBordered>
      <nz-list-item
        *ngFor="let project of projects"
        (click)="selectProjectFromModal(project.id)"
        style="cursor: pointer; padding: 16px;"
        [class.selected]="selectedProject === project.id"
      >
        <div
          style="display: flex; align-items: center; gap: 12px; width: 100%;"
        >
          <nz-icon
            nzType="project"
            nzTheme="outline"
            style="font-size: 20px;"
          ></nz-icon>
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 14px;">
              {{project.name}}
            </div>
            <div style="font-size: 12px; color: var(--text-secondary);">
              {{project.code || project.id}}
            </div>
          </div>
          <nz-icon
            *ngIf="selectedProject === project.id"
            nzType="check-circle"
            nzTheme="fill"
            style="color: var(--accent-color); font-size: 20px;"
          ></nz-icon>
        </div>
      </nz-list-item>
    </nz-list>
  </ng-container>
</nz-modal>
```

### 3. Optional: Add CSS for selected state (`app.component.scss`)

```scss
nz-list-item.selected {
  background-color: var(--bg-tertiary);
  border-left: 3px solid var(--accent-color);
}

nz-list-item:hover {
  background-color: var(--bg-tertiary);
}
```

## Features:

1. **Clickable Breadcrumb Items**: Workspace and Project names are now clickable links with icons
2. **Modal Popups**: Click opens a modal with a list of available workspaces/projects
3. **Visual Feedback**: Selected items show a checkmark icon
4. **Hover Effects**: List items highlight on hover
5. **Icons**: Database icon for workspace, Project icon for projects
6. **Fallback Text**: Shows "Select Workspace" or "Select Project" when nothing is selected

## Usage:

- Click on the workspace name in the breadcrumb to open workspace selection modal
- Click on the project name in the breadcrumb to open project selection modal
- Click on any item in the modal to select it
- The modal closes automatically after selection
- Selected workspace/project is saved to context service
