# Plugin Marketplace

A lazy-loaded modal component for browsing, viewing details, and installing plugins from a marketplace.

## Features

### 1. **Plugin Listing**
- Grid-based card layout displaying all available plugins
- Pagination support (10, 20, or 50 plugins per page)
- Real-time search functionality across plugin names, authors, and descriptions
- Loading states with spinners
- Empty state handling

### 2. **Plugin Information Display**
- Plugin icon (supports both external URLs and internal icons)
- Plugin name with "Installed" badge if already installed
- Short description with truncation
- Category tags with color coding
- Author information
- Version display
- Star rating (if available)
- Download count (if available)

### 3. **Plugin Detail View**
- Side drawer with comprehensive plugin information
- Full plugin metadata:
  - Plugin ID
  - Version
  - Author
  - Category
  - Downloads count
  - Rating
  - Last updated date
  - Installation status
- Complete description
- Full documentation rendered with Markdown support
- Install button with loading states

### 4. **Installation Capability**
- One-click plugin installation
- Calls the compile API endpoint: `POST /api/marketplace/plugins/{pluginId}/install`
- Loading indicators during installation
- Success/error messages
- Auto-refresh plugin list after installation
- Prevents duplicate installations (button disabled if already installed)

## Components

### MarketplaceComponent (`marketplace.component.ts`)
**Standalone Component** - Can be lazy-loaded as a modal

**Inputs:**
- `visible: boolean` - Controls modal visibility
- `searchTerm: string` - Initial search term (optional)

**Outputs:**
- `visibleChange: EventEmitter<boolean>` - Emits when modal visibility changes
- `onClose: EventEmitter<void>` - Emits when modal is closed
- `onPluginInstalled: EventEmitter<MarketplacePlugin>` - Emits when a plugin is successfully installed

**Key Methods:**
- `loadPlugins()` - Fetches plugins from API
- `onSearch()` - Performs search with current search term
- `viewPluginDetails(plugin)` - Opens detail drawer for a plugin
- `installPlugin(plugin)` - Installs a plugin and calls compile API
- `onPageChange(page)` - Handles pagination

### MarketplaceService (`marketplace.service.ts`)
**Service** - Handles all API interactions

**API Endpoints:**
- `GET /api/marketplace/plugins?q={search}&page={page}&size={size}` - List plugins
- `GET /api/marketplace/plugins/{pluginId}` - Get plugin details
- `POST /api/marketplace/plugins/{pluginId}/install` - Install/compile plugin
- `POST /api/plugins/{pluginId}/compile` - Alternative compile endpoint
- `POST /api/marketplace/plugins/{pluginId}/uninstall` - Uninstall plugin
- `GET /api/marketplace/plugins/installed` - Get installed plugins
- `GET /api/marketplace/plugins/category/{category}?page={page}&size={size}` - Filter by category

**Data Models:**
```typescript
interface MarketplacePlugin {
    id: number;
    pluginId: string;
    pluginName: string;
    pluginDesc: string;
    pluginAuthor: string;
    pluginDocument: string;
    version: string;
    icon: string;
    category?: string;
    downloads?: number;
    rating?: number;
    isInstalled?: boolean;
    lastUpdated?: string;
}

interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    // ... pagination metadata
}

interface CompileResponse {
    success: boolean;
    message: string;
    pluginId?: string;
}
```

## Integration

### In Workflow Component

1. **Import the component:**
```typescript
import { MarketplaceComponent } from '../marketplace/marketplace.component';
```

2. **Add to imports array:**
```typescript
imports: [..., MarketplaceComponent]
```

3. **Add state properties:**
```typescript
isMarketplaceVisible: boolean = false;
```

4. **Add methods:**
```typescript
openMarketplace() {
    this.isMarketplaceVisible = true;
    this.changeDetectorRef.detectChanges();
}

closeMarketplace() {
    this.isMarketplaceVisible = false;
    this.changeDetectorRef.detectChanges();
}

onPluginInstalled(plugin: any) {
    this.message.success(`${plugin.pluginName} installed successfully!`);
    this.loadPlugins(); // Reload plugins to show newly installed plugin
}
```

5. **Add to template:**
```html
<!-- Plugin Marketplace Modal -->
<app-marketplace
    [(visible)]="isMarketplaceVisible"
    (onClose)="closeMarketplace()"
    (onPluginInstalled)="onPluginInstalled($event)">
</app-marketplace>
```

6. **Add button to open marketplace:**
```html
<button nz-button nzType="default" (click)="openMarketplace()">
    <nz-icon nzType="shop"></nz-icon> Plugin Marketplace
</button>
```

## Styling

The component includes:
- Responsive grid layout (auto-fill, min 300px per card)
- Hover effects on cards (elevation and transform)
- Dark mode support
- Markdown styling for documentation
- Loading states and spinners
- Empty state illustrations

## Usage Example

```typescript
// In your component
openMarketplaceModal() {
    this.isMarketplaceVisible = true;
}

handlePluginInstalled(plugin: MarketplacePlugin) {
    console.log('Installed:', plugin);
    // Refresh your plugin list or perform other actions
}
```

```html
<app-marketplace
    [(visible)]="isMarketplaceVisible"
    (onPluginInstalled)="handlePluginInstalled($event)">
</app-marketplace>
```

## Backend API Requirements

The marketplace expects the following backend endpoints:

1. **List Plugins** - `GET /api/marketplace/plugins`
   - Query params: `q` (search), `page` (0-based), `size`
   - Returns: `PageResponse<MarketplacePlugin>`

2. **Get Plugin Details** - `GET /api/marketplace/plugins/{pluginId}`
   - Returns: `MarketplacePlugin`

3. **Install Plugin** - `POST /api/marketplace/plugins/{pluginId}/install`
   - Returns: `CompileResponse { success: boolean, message: string }`
   - This should trigger compilation of the plugin

4. **Get Installed Plugins** - `GET /api/marketplace/plugins/installed`
   - Returns: `MarketplacePlugin[]`

## Dependencies

- `@angular/common`
- `@angular/forms`
- `ng-zorro-antd` (modal, table, button, icon, input, tag, badge, spin, drawer, descriptions, divider, empty, card, rate, pagination)
- `ngx-markdown` (for documentation rendering)

## Notes

- Component uses OnPush change detection strategy for better performance
- All API calls are lazy-loaded (only called when modal is opened)
- Installation state is tracked per plugin to prevent duplicate installations
- Search is debounced on Enter key press
- Pagination state is maintained across searches
