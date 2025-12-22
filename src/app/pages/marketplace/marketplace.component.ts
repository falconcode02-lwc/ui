import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzRateModule } from 'ng-zorro-antd/rate';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { MarkdownModule } from 'ngx-markdown';
import { MarketplaceService, MarketplacePlugin } from './marketplace.service';

@Component({
    selector: 'app-marketplace',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzModalModule,
        NzTableModule,
        NzButtonModule,
        NzIconModule,
        NzInputModule,
        NzTagModule,
        NzBadgeModule,
        NzSpinModule,
        NzDrawerModule,
        NzDescriptionsModule,
        NzDividerModule,
        NzEmptyModule,
        NzCardModule,
        NzRateModule,
        NzPaginationModule,
        MarkdownModule
    ],
    templateUrl: './marketplace.component.html',
    styleUrls: ['./marketplace.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketplaceComponent implements OnInit {
    @Input() visible: boolean = false;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() onClose = new EventEmitter<void>();
    @Output() onPluginInstalled = new EventEmitter<MarketplacePlugin>();

    // Plugin list
    plugins: MarketplacePlugin[] = [];
    loading: boolean = false;
    searchTerm: string = '';

    // Pagination
    currentPage: number = 1;
    pageSize: number = 10;
    totalElements: number = 0;

    // Plugin detail drawer
    detailDrawerVisible: boolean = false;
    selectedPlugin: MarketplacePlugin | null = null;
    loadingDetails: boolean = false;

    // Installation
    installingPlugins: Set<string> = new Set();

    constructor(
        private marketplaceService: MarketplaceService,
        private message: NzMessageService,
        private changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        if (this.visible) {
            this.loadPlugins();
        }
    }

    ngOnChanges(): void {
        if (this.visible) {
            this.loadPlugins();
        }
    }

    /**
     * Load plugins from marketplace
     */
    loadPlugins(): void {
        this.loading = true;
        const page = this.currentPage - 1; // Convert to 0-based

        this.marketplaceService.listMarketplacePlugins(this.searchTerm, page, this.pageSize).subscribe({
            next: (response) => {
                this.plugins = response.content;
                this.totalElements = response.totalElements;
                this.loading = false;
                this.changeDetectorRef.markForCheck();
            },
            error: (error) => {
                console.error('Error loading marketplace plugins:', error);
                this.message.error('Failed to load plugins from marketplace');
                this.loading = false;
                this.changeDetectorRef.markForCheck();
            }
        });
    }

    /**
     * Search plugins
     */
    onSearch(): void {
        this.currentPage = 1;
        this.loadPlugins();
    }

    /**
     * Handle page change
     */
    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadPlugins();
    }

    /**
     * View plugin details
     */
    viewPluginDetails(plugin: MarketplacePlugin): void {
        this.selectedPlugin = plugin;
        this.loadingDetails = true;
        this.detailDrawerVisible = true;

        // Load full details
        this.marketplaceService.getPluginDetails(plugin.pluginId).subscribe({
            next: (details) => {
                this.selectedPlugin = details;
                this.loadingDetails = false;
                this.changeDetectorRef.markForCheck();
            },
            error: (error) => {
                console.error('Error loading plugin details:', error);
                this.message.error('Failed to load plugin details');
                this.loadingDetails = false;
                this.changeDetectorRef.markForCheck();
            }
        });
    }

    /**
     * Close plugin details drawer
     */
    closePluginDetails(): void {
        this.detailDrawerVisible = false;
        this.selectedPlugin = null;
        this.changeDetectorRef.markForCheck();
    }

    /**
     * Install a plugin
     */
    installPlugin(plugin: MarketplacePlugin): void {
        this.installingPlugins.add(plugin.pluginId);
        this.changeDetectorRef.markForCheck();

        const loadingId = this.message.loading(`Installing ${plugin.pluginName}...`, { nzDuration: 0 }).messageId;

        this.marketplaceService.installPlugin(plugin.pluginId).subscribe({
            next: (response) => {
                this.message.remove(loadingId);
                this.installingPlugins.delete(plugin.pluginId);
                
                if (response.success) {
                    this.message.success(`${plugin.pluginName} installed successfully!`);
                    plugin.isInstalled = true;
                    this.onPluginInstalled.emit(plugin);
                } else {
                    this.message.error(response.message || 'Installation failed');
                }
                
                this.changeDetectorRef.markForCheck();
            },
            error: (error) => {
                this.message.remove(loadingId);
                this.installingPlugins.delete(plugin.pluginId);
                console.error('Error installing plugin:', error);
                this.message.error(`Failed to install ${plugin.pluginName}`);
                this.changeDetectorRef.markForCheck();
            }
        });
    }

    /**
     * Check if a plugin is currently being installed
     */
    isInstalling(pluginId: string): boolean {
        return this.installingPlugins.has(pluginId);
    }

    /**
     * Check if icon is external URL
     */
    isExternalIcon(icon: string): boolean {
        return icon?.startsWith('http://') || icon?.startsWith('https://') || icon?.startsWith('data:');
    }

    /**
     * Handle modal close
     */
    handleCancel(): void {
        this.visible = false;
        this.visibleChange.emit(false);
        this.onClose.emit();
    }

    /**
     * Format date
     */
    formatDate(date: string): string {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Get category color
     */
    getCategoryColor(category: string): string {
        const colors: { [key: string]: string } = {
            'integration': 'blue',
            'data': 'green',
            'notification': 'orange',
            'processing': 'purple',
            'storage': 'cyan',
            'default': 'default'
        };
        return colors[category?.toLowerCase()] || colors['default'];
    }
}
