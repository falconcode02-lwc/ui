import { Injectable } from '@angular/core';
import { HttpService } from '../../service/http-service';
import { Observable, of } from 'rxjs';

export interface MarketplacePlugin {
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

export interface PageResponse<T> {
    content: T[];
    pageable: {
        pageNumber: number;
        pageSize: number;
    };
    totalPages: number;
    totalElements: number;
    last: boolean;
    first: boolean;
}

export interface CompileResponse {
    success: boolean;
    message: string;
    pluginId?: string;
}

@Injectable({
    providedIn: 'root'
})
export class MarketplaceService {
    
    constructor(private httpService: HttpService) { }

    /**
     * List all available plugins in marketplace
     * @param q Search query
     * @param page Page number (0-based)
     * @param size Page size
     * @returns Observable of paginated marketplace plugins
     */
    listMarketplacePlugins(q?: string, page: number = 0, size: number = 20): Observable<PageResponse<MarketplacePlugin>> {
        // TODO: Comment this line and uncomment below when backend is ready
        return this.getMockMarketplacePlugins(q, page, size);
        
        // let url = `/api/marketplace/plugins?page=${page}&size=${size}`;
        // if (q && q.trim()) {
        //     url += `&q=${encodeURIComponent(q)}`;
        // }
        // return this.httpService.get<PageResponse<MarketplacePlugin>>(url) as Observable<PageResponse<MarketplacePlugin>>;
    }

    /**
     * Get plugin details by ID
     * @param pluginId Plugin ID
     * @returns Observable of plugin details
     */
    getPluginDetails(pluginId: string): Observable<MarketplacePlugin> {
        // TODO: Comment this line and uncomment below when backend is ready
        return this.getMockPluginDetails(pluginId);
        
        // return this.httpService.get<MarketplacePlugin>(`/api/marketplace/plugins/${pluginId}`) as Observable<MarketplacePlugin>;
    }

    /**
     * Install/Compile a plugin
     * @param pluginId Plugin ID to install
     * @returns Observable of compile response
     */
    installPlugin(pluginId: string): Observable<CompileResponse> {
        // TODO: Comment this line and uncomment below when backend is ready
        return this.getMockInstallResponse(pluginId);
        
        // return this.httpService.post<CompileResponse>(`/api/marketplace/plugins/${pluginId}/install`, {}) as Observable<CompileResponse>;
    }

    /**
     * Compile a plugin (alternative endpoint)
     * @param pluginId Plugin ID to compile
     * @returns Observable of compile response
     */
    compilePlugin(pluginId: string): Observable<CompileResponse> {
        return this.httpService.post<CompileResponse>(`/api/plugins/${pluginId}/compile`, {}) as Observable<CompileResponse>;
    }

    /**
     * Uninstall a plugin
     * @param pluginId Plugin ID to uninstall
     * @returns Observable of response
     */
    uninstallPlugin(pluginId: string): Observable<any> {
        return this.httpService.post(`/api/marketplace/plugins/${pluginId}/uninstall`, {}) as Observable<any>;
    }

    /**
     * Get installed plugins
     * @returns Observable of installed plugins
     */
    getInstalledPlugins(): Observable<MarketplacePlugin[]> {
        return this.httpService.get<MarketplacePlugin[]>('/api/marketplace/plugins/installed') as Observable<MarketplacePlugin[]>;
    }

    /**
     * Search plugins by category
     * @param category Category name
     * @param page Page number
     * @param size Page size
     * @returns Observable of filtered plugins
     */
    getPluginsByCategory(category: string, page: number = 0, size: number = 20): Observable<PageResponse<MarketplacePlugin>> {
        return this.httpService.get<PageResponse<MarketplacePlugin>>(
            `/api/marketplace/plugins/category/${category}?page=${page}&size=${size}`
        ) as Observable<PageResponse<MarketplacePlugin>>;
    }

    /**
     * Get mock marketplace plugins (for development/testing)
     * @param q Search query
     * @param page Page number
     * @param size Page size
     * @returns Observable of mock paginated plugins
     */
    private getMockMarketplacePlugins(q?: string, page: number = 0, size: number = 20): Observable<PageResponse<MarketplacePlugin>> {
        const allPlugins: MarketplacePlugin[] = [
            {
                id: 1,
                pluginId: 'twilio_sms',
                pluginName: 'Twilio SMS',
                pluginDesc: 'Send SMS messages via Twilio API with delivery tracking and scheduled sending capabilities',
                pluginAuthor: 'Twilio Inc.',
                pluginDocument: '# Twilio SMS Plugin\n\n## Overview\nSend SMS messages using Twilio\'s powerful messaging API.\n\n## Features\n- Send SMS to any phone number\n- Delivery tracking\n- Scheduled messages\n- MMS support\n\n## Configuration\nRequires Twilio Account SID and Auth Token.',
                version: '2.1.0',
                icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/twilio.svg',
                category: 'Notification',
                downloads: 15420,
                rating: 4.8,
                isInstalled: false,
                lastUpdated: '2025-11-10'
            },
            {
                id: 2,
                pluginId: 'sendgrid_email',
                pluginName: 'SendGrid Email',
                pluginDesc: 'Professional email delivery service with templates, tracking, and analytics',
                pluginAuthor: 'SendGrid Team',
                pluginDocument: '# SendGrid Email Plugin\n\n## Overview\nSend transactional and marketing emails using SendGrid.\n\n## Features\n- HTML email templates\n- Open and click tracking\n- Email analytics\n- Attachment support\n\n## Setup\nRequire API key from SendGrid dashboard.',
                version: '3.0.5',
                icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/sendgrid.svg',
                category: 'Notification',
                downloads: 28900,
                rating: 4.9,
                isInstalled: true,
                lastUpdated: '2025-11-15'
            },
            {
                id: 3,
                pluginId: 'aws_s3_storage',
                pluginName: 'AWS S3 Storage',
                pluginDesc: 'Upload, download, and manage files in Amazon S3 buckets with automatic retry and multipart upload',
                pluginAuthor: 'Amazon Web Services',
                pluginDocument: '# AWS S3 Storage Plugin\n\n## Overview\nManage files in AWS S3 with enterprise features.\n\n## Features\n- File upload/download\n- Multipart upload for large files\n- Bucket management\n- Presigned URLs\n- Server-side encryption\n\n## Requirements\nAWS credentials with S3 permissions.',
                version: '4.2.1',
                icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/amazons3.svg',
                category: 'Storage',
                downloads: 42100,
                rating: 4.7,
                isInstalled: false,
                lastUpdated: '2025-11-12'
            },
            {
                id: 4,
                pluginId: 'stripe_payment',
                pluginName: 'Stripe Payment',
                pluginDesc: 'Process payments, manage subscriptions, and handle refunds with Stripe payment gateway',
                pluginAuthor: 'Stripe Inc.',
                pluginDocument: '# Stripe Payment Plugin\n\n## Overview\nIntegrate Stripe payment processing into your workflows.\n\n## Features\n- Payment processing\n- Subscription management\n- Refund handling\n- Webhook support\n- Invoice generation\n\n## Setup\nRequires Stripe API keys (test and live modes).',
                version: '5.1.0',
                icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/stripe.svg',
                category: 'Integration',
                downloads: 35600,
                rating: 4.9,
                isInstalled: false,
                lastUpdated: '2025-11-16'
            },
            {
                id: 5,
                pluginId: 'slack_messenger',
                pluginName: 'Slack Messenger',
                pluginDesc: 'Send messages, files, and interactive notifications to Slack channels and users',
                pluginAuthor: 'Slack Technologies',
                pluginDocument: '# Slack Messenger Plugin\n\n## Overview\nConnect with your team via Slack messaging.\n\n## Features\n- Send messages to channels\n- Direct messages\n- File uploads\n- Interactive buttons\n- Rich message formatting\n\n## Authentication\nUse OAuth or Bot tokens.',
                version: '3.5.2',
                icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/slack.svg',
                category: 'Integration',
                downloads: 52300,
                rating: 4.8,
                isInstalled: true,
                lastUpdated: '2025-11-14'
            },
            {
                id: 6,
                pluginId: 'postgres_connector',
                pluginName: 'PostgreSQL Database',
                pluginDesc: 'Execute queries, manage transactions, and perform CRUD operations on PostgreSQL databases',
                pluginAuthor: 'PostgreSQL Global Development Group',
                pluginDocument: '# PostgreSQL Database Plugin\n\n## Overview\nConnect to PostgreSQL databases and execute SQL queries.\n\n## Features\n- Query execution\n- Transaction support\n- Prepared statements\n- Connection pooling\n- Bulk operations\n\n## Connection\nRequires host, port, database name, username, and password.',
                version: '6.0.3',
                icon: 'database',
                category: 'Data',
                downloads: 38700,
                rating: 4.6,
                isInstalled: false,
                lastUpdated: '2025-11-11'
            },
            {
                id: 7,
                pluginId: 'mongodb_connector',
                pluginName: 'MongoDB',
                pluginDesc: 'Perform CRUD operations, aggregations, and manage collections in MongoDB databases',
                pluginAuthor: 'MongoDB Inc.',
                pluginDocument: '# MongoDB Plugin\n\n## Overview\nInteract with MongoDB NoSQL databases.\n\n## Features\n- Document operations\n- Aggregation pipelines\n- Index management\n- GridFS file storage\n- Change streams\n\n## Setup\nConnection string or individual credentials required.',
                version: '4.5.1',
                icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/mongodb.svg',
                category: 'Data',
                downloads: 31200,
                rating: 4.7,
                isInstalled: false,
                lastUpdated: '2025-11-13'
            },
            {
                id: 8,
                pluginId: 'openai_gpt',
                pluginName: 'OpenAI GPT',
                pluginDesc: 'Generate text, complete prompts, and create embeddings using OpenAI GPT models',
                pluginAuthor: 'OpenAI',
                pluginDocument: '# OpenAI GPT Plugin\n\n## Overview\nLeverage OpenAI GPT models for text generation and AI capabilities.\n\n## Features\n- Text completion\n- Chat conversations\n- Embeddings generation\n- Multiple model support (GPT-4, GPT-3.5)\n- Token counting\n\n## API Key\nRequires OpenAI API key from platform.openai.com.',
                version: '1.8.0',
                icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/openai.svg',
                category: 'Processing',
                downloads: 67800,
                rating: 5.0,
                isInstalled: true,
                lastUpdated: '2025-11-17'
            },
            {
                id: 9,
                pluginId: 'google_sheets',
                pluginName: 'Google Sheets',
                pluginDesc: 'Read, write, and update Google Sheets data with full spreadsheet manipulation capabilities',
                pluginAuthor: 'Google LLC',
                pluginDocument: '# Google Sheets Plugin\n\n## Overview\nIntegrate with Google Sheets for data operations.\n\n## Features\n- Read/write cells\n- Batch operations\n- Sheet management\n- Formula support\n- Cell formatting\n\n## Authentication\nRequires Google OAuth 2.0 credentials.',
                version: '2.7.3',
                icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/googlesheets.svg',
                category: 'Data',
                downloads: 44900,
                rating: 4.8,
                isInstalled: false,
                lastUpdated: '2025-11-09'
            },
            {
                id: 10,
                pluginId: 'redis_cache',
                pluginName: 'Redis Cache',
                pluginDesc: 'Store and retrieve cached data with Redis for high-performance data access',
                pluginAuthor: 'Redis Ltd.',
                pluginDocument: '# Redis Cache Plugin\n\n## Overview\nUse Redis as a caching layer or data store.\n\n## Features\n- Key-value operations\n- TTL support\n- Pub/Sub messaging\n- Lists, Sets, Hashes\n- Transactions\n\n## Connection\nRequires Redis host, port, and optional password.',
                version: '5.3.2',
                icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/redis.svg',
                category: 'Data',
                downloads: 29400,
                rating: 4.7,
                isInstalled: false,
                lastUpdated: '2025-11-08'
            },
            {
                id: 11,
                pluginId: 'jira_integration',
                pluginName: 'Jira Integration',
                pluginDesc: 'Create, update, and manage Jira issues, projects, and workflows',
                pluginAuthor: 'Atlassian',
                pluginDocument: '# Jira Integration Plugin\n\n## Overview\nAutomate Jira project management tasks.\n\n## Features\n- Issue creation/updates\n- Comment management\n- Transition workflows\n- Project queries\n- Attachment handling\n\n## Setup\nJira Cloud or Server API credentials required.',
                version: '3.2.1',
                icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/jira.svg',
                category: 'Integration',
                downloads: 22100,
                rating: 4.5,
                isInstalled: false,
                lastUpdated: '2025-11-07'
            },
            {
                id: 12,
                pluginId: 'github_actions',
                pluginName: 'GitHub Actions',
                pluginDesc: 'Trigger workflows, manage repositories, and interact with GitHub API',
                pluginAuthor: 'GitHub Inc.',
                pluginDocument: '# GitHub Actions Plugin\n\n## Overview\nIntegrate with GitHub for repository management and CI/CD.\n\n## Features\n- Trigger workflows\n- Repository operations\n- PR management\n- Issue tracking\n- Release management\n\n## Authentication\nPersonal access token or GitHub App required.',
                version: '4.1.0',
                icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/github.svg',
                category: 'Integration',
                downloads: 41500,
                rating: 4.9,
                isInstalled: false,
                lastUpdated: '2025-11-16'
            }
        ];

        // Filter by search query
        let filteredPlugins = allPlugins;
        if (q && q.trim()) {
            const searchLower = q.toLowerCase();
            filteredPlugins = allPlugins.filter(plugin =>
                plugin.pluginName.toLowerCase().includes(searchLower) ||
                plugin.pluginDesc.toLowerCase().includes(searchLower) ||
                plugin.pluginAuthor.toLowerCase().includes(searchLower) ||
                plugin.category?.toLowerCase().includes(searchLower)
            );
        }

        // Paginate
        const start = page * size;
        const end = start + size;
        const paginatedPlugins = filteredPlugins.slice(start, end);

        const response: PageResponse<MarketplacePlugin> = {
            content: paginatedPlugins,
            pageable: {
                pageNumber: page,
                pageSize: size
            },
            totalPages: Math.ceil(filteredPlugins.length / size),
            totalElements: filteredPlugins.length,
            last: end >= filteredPlugins.length,
            first: page === 0
        };

        return of(response);
    }

    /**
     * Get mock plugin details by ID
     * @param pluginId Plugin ID
     * @returns Observable of mock plugin details
     */
    private getMockPluginDetails(pluginId: string): Observable<MarketplacePlugin> {
        // Call the mock list method and find the plugin
        return new Observable(observer => {
            this.getMockMarketplacePlugins().subscribe(response => {
                const plugin = response.content.find(p => p.pluginId === pluginId);
                if (plugin) {
                    observer.next(plugin);
                } else {
                    observer.error({ message: 'Plugin not found' });
                }
                observer.complete();
            });
        });
    }

    /**
     * Get mock install response
     * @param pluginId Plugin ID
     * @returns Observable of mock compile response
     */
    private getMockInstallResponse(pluginId: string): Observable<CompileResponse> {
        // Simulate API delay
        return new Observable(observer => {
            setTimeout(() => {
                observer.next({
                    success: true,
                    message: `Plugin ${pluginId} installed and compiled successfully!`,
                    pluginId: pluginId
                });
                observer.complete();
            }, 2000); // 2 second delay to simulate compilation
        });
    }
}
