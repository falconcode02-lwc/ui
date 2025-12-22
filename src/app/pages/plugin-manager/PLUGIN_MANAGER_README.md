# Plugin Manager Component

## Overview
The Plugin Manager component provides a comprehensive interface for creating, editing, and managing plugins within the Falcon platform. It features a table-based list view and a drawer-based form for plugin details.

## Features

### 1. Plugin List View
- **Table Display**: Shows all plugins with key information
  - Plugin Icon (with placeholder for missing icons)
  - Plugin Name
  - Version (displayed as badge)
  - Author
  - Description (truncated with tooltip)
  - Status (Active/Inactive badge)
  - Action buttons

- **Pagination**: Configurable page sizes (10, 20, 50 items per page)

- **Actions**:
  - Edit: Opens drawer to modify plugin details
  - Compile: Triggers plugin compilation via API
  - Delete: Removes plugin with confirmation dialog

### 2. Create/Edit Plugin Drawer
- **Left-side Form** with the following fields:
  - **Plugin Name** (required, max 100 chars)
  - **Version** (required, semver format: X.Y.Z)
  - **Author** (required, max 100 chars)
  - **Description** (required, max 500 chars, textarea)
  - **Documentation** (optional, max 5000 chars, markdown supported)
  - **Icon** (optional, Base64 or URL, textarea)
  - **Active Status** (toggle switch)
  - **Props Configuration** (JSON schema for form builder)

### 3. Props Configuration
- Click "Create/Edit Props Schema" button to navigate to Form Builder
- Form Builder opens in a separate route for creating plugin property schemas
- Props are stored as JSON string in the plugin DTO

## Component Structure

```
plugin-manager/
├── plugin-manager.component.ts    # Component logic
├── plugin-manager.component.html  # Template
├── plugin-manager.component.scss  # Styles
└── PLUGIN_MANAGER_README.md       # This file
```

## Usage

### Standalone Component
```typescript
import { PluginManagerComponent } from './pages/plugin-manager/plugin-manager.component';

// In routes
{
  path: 'plugin-manager',
  component: PluginManagerComponent
}
```

### Integration Example
```html
<!-- In parent component template -->
<app-plugin-manager></app-plugin-manager>
```

## API Integration

### List Plugins
```typescript
listPlugins(q?: string, page: number = 0, size: number = 20): Observable<PageResponse<PluginDto>>
```

### Get Plugin by ID
```typescript
getPluginById(id: number): Observable<PluginDto>
```

### Compile Plugin
```typescript
compilePlugin(pluginName: string): Observable<{ success: boolean; message?: string }>
```

## PluginDto Interface
```typescript
interface PluginDto {
    id?: number;
    pluginId?: string;
    pluginName: string;
    pluginDesc: string;
    pluginAuthor: string;
    pluginDocument: string;
    props: string;  // JSON string from form builder
    icon: string;
    active: boolean;
    version: string;
    lastLoadedAt?: string;
}
```

## Styling

### Theme
- Dark theme with orange accent colors
- Uses global CSS variables:
  - `--bg-primary`: Main background (#141414)
  - `--card-bg`: Card background (#1f1f1f)
  - `--text-primary`: Primary text (#fff)
  - `--accent-color`: Orange accent (#ff6d5a)
  - `--accent-hover`: Orange hover (#ff8b7a)
  - `--border-color`: Border color (#303030)

### Key Style Classes
- `.plugin-manager`: Main container
- `.manager-header`: Header with title and create button
- `.plugin-icon`: Icon display with placeholder
- `.description-cell`: Truncated description with ellipsis
- `.action-buttons`: Action button group
- `.drawer-content`: Drawer form container
- `.props-section`: Props configuration area with preview

## Form Validation

### Required Fields
- Plugin Name
- Version (must match X.Y.Z format)
- Author
- Description

### Optional Fields
- Documentation (markdown supported)
- Icon (Base64 or URL)
- Props Configuration (JSON schema)

### Validation Messages
- Field-specific error messages displayed inline
- Form submission blocked if validation fails
- All fields marked as dirty on submit attempt

## Props Schema Integration

The Props field stores a JSON schema that defines the plugin's configurable properties. This schema is used by the Form Builder component to generate dynamic forms.

### Example Props JSON
```json
{
  "plugin_properties": [
    {
      "id": "apiKey",
      "type": "text",
      "label": "API Key",
      "placeholder": "Enter your API key",
      "required": true
    },
    {
      "id": "timeout",
      "type": "number",
      "label": "Timeout (seconds)",
      "defaultValue": 30
    }
  ]
}
```

### Accessing Form Builder
1. Click "Create/Edit Props Schema" button
2. Navigates to Form Builder page
3. Create/edit form schema
4. Return to plugin manager manually (future: automatic return with data)

## Future Enhancements

### Planned Features
1. **Inline Form Builder**: Embed form builder in modal instead of navigation
2. **Create/Update API Integration**: Connect to backend save/update endpoints
3. **Delete API Integration**: Connect to backend delete endpoint
4. **Plugin Preview**: Live preview of plugin configuration
5. **Import/Export**: Export plugins as JSON, import from files
6. **Version History**: Track plugin version changes
7. **Plugin Testing**: Test plugin compilation before saving
8. **Search and Filter**: Filter plugins by name, author, version, or status

### API Endpoints Needed
```
POST   /api/plugins              - Create new plugin
PUT    /api/plugins/{id}         - Update existing plugin
DELETE /api/plugins/{id}         - Delete plugin
POST   /api/plugins/compile/{name} - Compile plugin (already implemented)
```

## Dependencies

### Angular
- `@angular/common`: CommonModule
- `@angular/forms`: ReactiveFormsModule
- `@angular/router`: Router for navigation

### Ng-Zorro (Ant Design)
- `NzDrawerModule`: Drawer for create/edit form
- `NzTableModule`: Plugin list table
- `NzButtonModule`: Buttons
- `NzFormModule`: Form structure
- `NzInputModule`: Text inputs
- `NzModalModule`: Modal dialogs
- `NzMessageService`: Toast messages
- `NzPopconfirmModule`: Delete confirmation
- `NzTagModule`: Status and version badges
- `NzToolTipModule`: Tooltips
- `NzSwitchModule`: Active status toggle
- `NzIconModule`: Icons
- `NzDividerModule`: Section dividers

### Services
- `PluginService`: Backend API integration
- `NzMessageService`: User notifications

## Error Handling

### Loading States
- Table shows loading spinner during data fetch
- Button shows loading state during compile operation

### Error Messages
- API errors displayed as error toast messages
- Form validation errors shown inline
- Network errors caught and displayed to user

## Accessibility
- Form labels properly associated with inputs
- Required fields marked with asterisk
- Error messages announced to screen readers
- Keyboard navigation supported
- Focus management in drawer

## Browser Support
- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

## Notes
- Currently using mock compilation delay (TODO: connect to real API)
- Form Builder navigation opens in same window (TODO: modal integration)
- Delete operation needs backend endpoint implementation
- Create/Update operations need backend endpoint implementation
