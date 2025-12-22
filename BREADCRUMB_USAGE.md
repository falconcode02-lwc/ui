# Breadcrumb Service Usage Guide

## Overview
The `BreadcrumbService` allows you to dynamically add, remove, and manage breadcrumbs from any child component in your Angular application.

## Service Location
`/src/app/service/breadcrumb.service.ts`

## Features
- ✅ Add breadcrumbs dynamically from any component
- ✅ Support for route navigation
- ✅ Support for custom click handlers
- ✅ Support for query parameters
- ✅ Auto-update breadcrumbs on route changes
- ✅ Remove individual or all breadcrumbs

## Basic Usage

### 1. Import and Inject the Service

```typescript
import { BreadcrumbService } from '../../service/breadcrumb.service';

constructor(private breadcrumbService: BreadcrumbService) {}
```

### 2. Add a Breadcrumb

#### Simple Breadcrumb (Read-only)
```typescript
this.breadcrumbService.addBreadcrumb({
  label: 'My Page'
});
```

#### Breadcrumb with Icon
```typescript
this.breadcrumbService.addBreadcrumb({
  label: 'Dashboard',
  icon: 'dashboard',
  iconTheme: 'outline'
});
```

#### Breadcrumb with Route Link and Icon
```typescript
this.breadcrumbService.addBreadcrumb({
  label: 'Workflows',
  url: '/workflow',
  icon: 'pull-request',
  iconTheme: 'outline'
});
```

#### Breadcrumb with Query Parameters
```typescript
this.breadcrumbService.addBreadcrumb({
  label: 'Users',
  url: '/users',
  queryParams: { filter: 'active' },
  icon: 'user',
  iconTheme: 'outline'
});
```

#### Breadcrumb with Click Handler and Icon
```typescript
this.breadcrumbService.addBreadcrumb({
  label: 'Edit Workflow',
  icon: 'edit',
  iconTheme: 'fill',
  onClick: () => {
    this.openEditModal();
  }
});
```

### 3. Example: Workflow Component

```typescript
export class WorkflowComponent implements OnInit, OnDestroy {
  
  constructor(
    private breadcrumbService: BreadcrumbService,
    private workflowService: WorkflowService
  ) {}

  ngOnInit() {
    this.loadWorkflow();
  }

  loadWorkflow() {
    this.workflowService.getById(this.workflowId).subscribe((workflow) => {
      // Add workflow name to breadcrumb with icon
      this.breadcrumbService.addBreadcrumb({
        label: workflow.name,
        icon: 'pull-request',
        iconTheme: 'outline',
        onClick: () => {
          this.router.navigate(['/workflow', workflow.id]);
        }
      });
    });
  }

  ngOnDestroy() {
    // Clean up breadcrumb when leaving component
    this.breadcrumbService.removeLastBreadcrumb();
  }
}
```

### 4. Example: Agent Management Component

```typescript
export class AgentManagementComponent implements OnInit {
  
  constructor(private breadcrumbService: BreadcrumbService) {}

  ngOnInit() {
    this.breadcrumbService.addBreadcrumb({
      label: 'AI Agents',
      url: '/aiagents',
      icon: 'robot',
      iconTheme: 'outline'
    });
  }

  openAgentDetails(agent: any) {
    // Add agent-specific breadcrumb
    this.breadcrumbService.addBreadcrumb({
      label: agent.name,
      icon: 'user',
      iconTheme: 'fill',
      onClick: () => {
        this.showAgentDetails(agent);
      }
    });
  }
}
```

## Available Methods

### `addBreadcrumb(breadcrumb: Breadcrumb)`
Adds a new breadcrumb to the end of the list.

### `upsertBreadcrumb(breadcrumb: Breadcrumb, merge?: boolean)`
Updates existing breadcrumb by key or adds new one.
- If `merge` is `true`, merges with existing breadcrumb (partial update)
- If `merge` is `false` (default), replaces entire breadcrumb

### `updateBreadcrumbFields(key: string, fields: Partial<Breadcrumb>)`
Updates only specific fields of a breadcrumb by key, keeping other fields unchanged.

### `setBreadcrumbs(breadcrumbs: Breadcrumb[])`
Replaces all breadcrumbs with a new list.

### `removeLastBreadcrumb()`
Removes the last breadcrumb from the list.

### `removeBreadcrumbAt(index: number)`
Removes a breadcrumb at a specific index.

### `removeBreadcrumbByKey(key: string)`
Removes a breadcrumb by its key.

### `clearBreadcrumbs()`
Removes all breadcrumbs.

### `updateBreadcrumb(index: number, breadcrumb: Breadcrumb)`
Updates a breadcrumb at a specific index.

### `getBreadcrumbs(): Breadcrumb[]`
Returns the current list of breadcrumbs.

## Breadcrumb Interface

```typescript
export interface Breadcrumb {
  label: string;                              // Display text
  url?: string;                               // Optional route URL
  queryParams?: any;                          // Optional query parameters
  onClick?: () => void;                       // Optional click handler
  icon?: string;                              // Optional nz-icon type (e.g., 'home', 'user', 'setting')
  iconTheme?: 'outline' | 'fill' | 'twotone'; // Optional icon theme, defaults to 'outline'
}
```

## Available Icon Types

You can use any icon from [Ant Design Icons](https://ng.ant.design/components/icon/en). Common examples:

- **Navigation**: `home`, `dashboard`, `menu`, `folder`, `file`
- **Actions**: `edit`, `delete`, `save`, `plus`, `close`
- **Objects**: `user`, `team`, `setting`, `tool`, `code`
- **Workflow**: `pull-request`, `branches`, `deployment-unit`, `project`
- **AI**: `robot`, `experiment`, `thunder`, `bulb`
- **Data**: `database`, `cloud`, `api`, `file-text`

Example icon usage:
```typescript
// Outline theme (default)
{ label: 'Settings', icon: 'setting', iconTheme: 'outline' }

// Fill theme
{ label: 'Profile', icon: 'user', iconTheme: 'fill' }

// Twotone theme
{ label: 'Alerts', icon: 'bell', iconTheme: 'twotone' }
```

## Best Practices

1. **Clean Up**: Remove breadcrumbs in `ngOnDestroy()` when leaving a component
2. **Specific Labels**: Use descriptive labels that help users understand their location
3. **Click Handlers**: Use `onClick` for actions, `url` for navigation
4. **Route Sync**: The service automatically syncs with route-based breadcrumbs from `app.component.ts`

## Example Workflow

```
🏠 Home > 📊 Workflow > 🔄 "My Workflow" > ✏️ Edit Node
   ↑         ↑              ↑                   ↑
  Auto    Route         Added by           Added by
         based         component          component
```

## Common Patterns

### Pattern 1: Add on Load, Remove on Destroy
```typescript
ngOnInit() {
  this.breadcrumbService.addBreadcrumb({ 
    label: 'Details',
    icon: 'file-text',
    iconTheme: 'outline'
  });
}

ngOnDestroy() {
  this.breadcrumbService.removeLastBreadcrumb();
}
```

### Pattern 2: Dynamic Update (Full Replace)
```typescript
onDataLoad(data: any) {
  this.breadcrumbService.upsertBreadcrumb({
    key: 'workflow-detail',
    label: data.title,
    icon: 'folder-open',
    iconTheme: 'fill',
    onClick: () => this.viewDetails(data)
  });
}
```

### Pattern 3: Partial Update (Update Only Label)
```typescript
// Update only the label, keeping icon and onClick unchanged
this.breadcrumbService.updateBreadcrumbFields('workflow-detail', {
  label: updatedWorkflow.name
});

// Or using merge option
this.breadcrumbService.upsertBreadcrumb({
  key: 'workflow-detail',
  label: updatedWorkflow.name
}, true); // merge = true
```

### Pattern 4: Multiple Levels
```typescript
// Level 1 - Projects list
this.breadcrumbService.addBreadcrumb({ 
  key: 'projects',
  label: 'Projects', 
  url: '/projects',
  icon: 'project',
  iconTheme: 'outline'
});

// Level 2 - Specific project
this.breadcrumbService.upsertBreadcrumb({ 
  key: 'project-123',
  label: project.name, 
  url: `/projects/${project.id}`,
  icon: 'folder',
  iconTheme: 'fill'
});

// Level 3 - Settings page
this.breadcrumbService.addBreadcrumb({ 
  key: 'project-settings',
  label: 'Settings',
  icon: 'setting',
  iconTheme: 'outline'
});
```

### Pattern 5: Contextual Icons
```typescript
// Different icons for different types
const iconMap = {
  'workflow': 'pull-request',
  'agent': 'robot',
  'schedule': 'clock-circle',
  'project': 'code'
};

this.breadcrumbService.upsertBreadcrumb({
  key: `${item.type}-${item.id}`,
  label: item.name,
  icon: iconMap[item.type],
  iconTheme: 'outline',
  url: `/${item.type}/${item.id}`
});
```
