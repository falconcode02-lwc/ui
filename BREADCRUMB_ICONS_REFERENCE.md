# Breadcrumb Icons Quick Reference

## Common Icon Mappings for FalconFlow

### Navigation & Structure
```typescript
{ icon: 'home' }           // Home page
{ icon: 'dashboard' }      // Dashboard
{ icon: 'appstore' }       // App overview / Main menu
{ icon: 'menu' }           // Menu / Navigation
{ icon: 'folder' }         // Directory / Folder
{ icon: 'folder-open' }    // Open folder / Active section
```

### Workflow & Automation
```typescript
{ icon: 'pull-request' }       // Workflow
{ icon: 'branches' }           // Workflow branches
{ icon: 'deployment-unit' }    // Deployment / Execution
{ icon: 'control' }            // Control flow
{ icon: 'gateway' }            // Gateway / Decision point
{ icon: 'sync' }               // Synchronization
{ icon: 'reload' }             // Refresh / Reload
```

### AI & Intelligence
```typescript
{ icon: 'robot' }              // AI Agent
{ icon: 'experiment' }         // Experimentation
{ icon: 'bulb' }              // Ideas / Intelligence
{ icon: 'thunder' }            // Quick action / Power
{ icon: 'fire' }              // Hot / Active
```

### Actions & Operations
```typescript
{ icon: 'edit' }               // Edit mode
{ icon: 'save' }               // Save operation
{ icon: 'plus' }               // Add / Create new
{ icon: 'plus-circle' }        // Add with emphasis
{ icon: 'delete' }             // Delete
{ icon: 'close' }              // Close / Cancel
{ icon: 'check' }              // Confirm / Complete
{ icon: 'close-circle' }       // Error / Cancel
```

### Data & Content
```typescript
{ icon: 'database' }           // Database
{ icon: 'cloud' }              // Cloud storage
{ icon: 'api' }                // API endpoint
{ icon: 'file-text' }          // Document / File
{ icon: 'file' }               // Generic file
{ icon: 'code' }               // Code / Programming
{ icon: 'project' }            // Project
```

### Users & Security
```typescript
{ icon: 'user' }               // User profile
{ icon: 'team' }               // Team / Group
{ icon: 'usergroup-add' }      // Add users
{ icon: 'key' }                // Secrets / Authentication
{ icon: 'lock' }               // Locked / Secure
{ icon: 'unlock' }             // Unlocked / Public
{ icon: 'safety' }             // Safety / Security
```

### Time & Scheduling
```typescript
{ icon: 'clock-circle' }       // Time / Schedule
{ icon: 'calendar' }           // Calendar / Date
{ icon: 'hourglass' }          // Scheduler / Timer
{ icon: 'history' }            // History / Past events
{ icon: 'field-time' }         // Time field
```

### Settings & Configuration
```typescript
{ icon: 'setting' }            // Settings
{ icon: 'tool' }               // Tools / Utilities
{ icon: 'build' }              // Build / Configure
{ icon: 'control' }            // Control panel
{ icon: 'sliders' }            // Adjustments
```

### Status & Indicators
```typescript
{ icon: 'check-circle' }       // Success
{ icon: 'close-circle' }       // Error
{ icon: 'exclamation-circle' } // Warning
{ icon: 'info-circle' }        // Information
{ icon: 'question-circle' }    // Help / Unknown
{ icon: 'loading' }            // Loading / Processing
```

### Communication
```typescript
{ icon: 'message' }            // Messages
{ icon: 'notification' }       // Notifications
{ icon: 'bell' }               // Alerts
{ icon: 'mail' }               // Email
{ icon: 'comment' }            // Comments
```

## Icon Theme Examples

### Outline (Default - Best for most cases)
```typescript
this.breadcrumbService.addBreadcrumb({
  label: 'Workflows',
  icon: 'pull-request',
  iconTheme: 'outline'
});
```

### Fill (For emphasis or active states)
```typescript
this.breadcrumbService.addBreadcrumb({
  label: 'Current Workflow',
  icon: 'folder',
  iconTheme: 'fill'
});
```

### TwoTone (For special highlights)
```typescript
this.breadcrumbService.addBreadcrumb({
  label: 'Active Agent',
  icon: 'robot',
  iconTheme: 'twotone'
});
```

## Real-World Examples

### Workflow Navigation
```typescript
// Workflows List
this.breadcrumbService.addBreadcrumb({
  label: 'Workflows',
  url: '/workflow',
  icon: 'pull-request',
  iconTheme: 'outline'
});

// Specific Workflow
this.breadcrumbService.addBreadcrumb({
  label: 'Customer Onboarding',
  icon: 'branches',
  iconTheme: 'fill',
  onClick: () => this.openWorkflow()
});

// Edit Mode
this.breadcrumbService.addBreadcrumb({
  label: 'Edit',
  icon: 'edit',
  iconTheme: 'outline'
});
```

### AI Agent Path
```typescript
// Agents List
this.breadcrumbService.addBreadcrumb({
  label: 'AI Agents',
  url: '/aiagents',
  icon: 'robot',
  iconTheme: 'outline'
});

// Specific Agent
this.breadcrumbService.addBreadcrumb({
  label: 'Support Bot',
  icon: 'experiment',
  iconTheme: 'twotone',
  onClick: () => this.viewAgent()
});

// Settings
this.breadcrumbService.addBreadcrumb({
  label: 'Configuration',
  icon: 'setting',
  iconTheme: 'outline'
});
```

### Project & Code
```typescript
// Projects
this.breadcrumbService.addBreadcrumb({
  label: 'Projects',
  url: '/editor',
  icon: 'project',
  iconTheme: 'outline'
});

// Specific Project
this.breadcrumbService.addBreadcrumb({
  label: 'API Integration',
  icon: 'code',
  iconTheme: 'fill'
});

// File/Module
this.breadcrumbService.addBreadcrumb({
  label: 'auth.ts',
  icon: 'file-text',
  iconTheme: 'outline'
});
```

## Tips for Choosing Icons

1. **Be Consistent**: Use the same icon for the same type across your app
2. **Context Matters**: Icons should make sense in the navigation context
3. **Don't Overuse**: Not every breadcrumb needs an icon
4. **Theme Appropriately**: 
   - `outline` for navigation
   - `fill` for current/active items
   - `twotone` for special emphasis
5. **Test Visibility**: Make sure icons are visible in your theme (dark/light)

## Icon Color Customization

Icons inherit color from the breadcrumb text, but you can customize in your component's CSS:

```scss
nz-breadcrumb {
  nz-icon {
    color: #ff6d5a; // Your theme color
  }
  
  a:hover nz-icon {
    color: #ff8b7a; // Lighter on hover
  }
}
```
