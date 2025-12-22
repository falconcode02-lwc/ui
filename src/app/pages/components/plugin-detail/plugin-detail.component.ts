import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { MarkdownModule } from 'ngx-markdown';
import { PluginDto, PluginService } from '../../../service/plugin.service';

@Component({
  selector: 'app-plugin-detail',
  standalone: true,
  imports: [
    CommonModule,
    NzModalModule,
    NzDescriptionsModule,
    NzTagModule,
    NzBadgeModule,
    NzIconModule,
    NzDividerModule,
    NzTableModule,
    NzButtonModule,
    NzSpinModule,
    NzEmptyModule,
    MarkdownModule
  ],
  templateUrl: './plugin-detail.component.html',
  styleUrls: ['./plugin-detail.component.scss']
})
export class PluginDetailComponent {
  @Input() visible: boolean = false;
  @Input() pluginId: number | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onClose = new EventEmitter<void>();

  plugin: PluginDto | null = null;
  loading: boolean = false;
  pluginProperties: any[] = [];
  iconLoadError: boolean = false;
  defaultIcon: string = 'api'; // Default fallback icon

  constructor(private pluginService: PluginService) {}

  ngOnChanges() {
    console.log('Plugin detail ngOnChanges - visible:', this.visible, 'pluginId:', this.pluginId);
    if (this.visible && this.pluginId) {
      this.iconLoadError = false; // Reset icon error state
      this.loadPlugin();
    }
  }

  loadPlugin() {
    if (!this.pluginId) return;

    this.loading = true;
    this.pluginService.getPluginById(this.pluginId).subscribe({
      next: (plugin) => {
        this.plugin = plugin;
        this.parsePluginProperties(plugin.props);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading plugin:', err);
        this.loading = false;
      }
    });
  }

  parsePluginProperties(propsJson: string) {
    try {
      if (propsJson) {
        const propsObj = JSON.parse(propsJson);
        console.log('Parsed props object:', propsObj);
        
        // Handle different possible structures
        if (Array.isArray(propsObj)) {
          // If props is directly an array
          this.pluginProperties = propsObj;
        } else if (propsObj.plugin_properties && Array.isArray(propsObj.plugin_properties)) {
          // If props has plugin_properties field
          this.pluginProperties = propsObj.plugin_properties;
        } else if (propsObj.properties && Array.isArray(propsObj.properties)) {
          // If props has properties field
          this.pluginProperties = propsObj.properties;
        } else {
          // Try to extract any array from the object
          const arrayValues = Object.values(propsObj).find(val => Array.isArray(val));
          this.pluginProperties = arrayValues ? arrayValues as any[] : [];
        }
        
        console.log('Plugin properties:', this.pluginProperties);
      } else {
        this.pluginProperties = [];
      }
    } catch (e) {
      console.error('Error parsing plugin properties:', e);
      console.error('Props JSON:', propsJson);
      this.pluginProperties = [];
    }
  }

  handleCancel() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.onClose.emit();
    this.plugin = null;
    this.pluginProperties = [];
  }

  isExternalIcon(icon: string): boolean {
    if (!icon) return false;
    return icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('data:');
  }

  getStatusColor(active: boolean): string {
    return active ? 'success' : 'default';
  }

  getStatusText(active: boolean): string {
    return active ? 'Active' : 'Inactive';
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  }

  getTypeIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'text': 'font-size',
      'number': 'number',
      'select': 'select',
      'multiselect': 'select',
      'checkbox': 'check-square',
      'radio': 'check-circle',
      'codeeditor': 'code',
      'textarea': 'file-text',
      'date': 'calendar',
      'datetime': 'clock-circle'
    };
    return iconMap[type] || 'form';
  }

  /**
   * Handle icon load error by showing default icon
   */
  onIconError(event: Event) {
    this.iconLoadError = true;
    console.warn('Plugin icon failed to load, using default icon');
  }

  /**
   * Get the display icon (fallback to default if external icon failed)
   */
  getDisplayIcon(): string {
    if (!this.plugin) return this.defaultIcon;
    if (this.iconLoadError || !this.plugin.icon) return this.defaultIcon;
    if (this.isExternalIcon(this.plugin.icon)) return this.plugin.icon;
    return this.plugin.icon || this.defaultIcon;
  }
}
