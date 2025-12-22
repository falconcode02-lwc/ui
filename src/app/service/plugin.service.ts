import { Injectable } from '@angular/core';
import { HttpService } from './http-service';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Plugin, PluginBlock, PluginProperty } from '../model/plugin-model';

export interface PluginDto {
  id: number;
  pluginId: string;
  pluginName: string;
  pluginDesc: string;
  pluginAuthor: string;
  pluginDocument: string;
  props: string;
  secrets?: string; // JSON schema for secured secret definitions
  icon: string;
  active: boolean;
  version: string;
  lastLoadedAt: string;
  sourceCode?: string; // Optional: original source code for editing
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PluginService {
  private pluginCache: PluginBlock[] = [];

  constructor(private httpService: HttpService) {}

  /**
   * List plugins with pagination and optional search
   * @param q Search query for pluginName or pluginId
   * @param page Page number (0-based)
   * @param size Page size
   * @returns Observable of paginated plugin DTOs
   */
  listPlugins(
    q?: string,
    page: number = 0,
    size: number = 20
  ): Observable<PageResponse<PluginDto>> {
    let url = `/api/plugins?page=${page}&size=${size}`;
    if (q && q.trim()) {
      url += `&q=${encodeURIComponent(q)}`;
    }
    return this.httpService.get<PageResponse<PluginDto>>(url) as Observable<
      PageResponse<PluginDto>
    >;
  }

  /**
   * Get a single plugin by database ID
   * @param id Database ID of the plugin
   * @returns Observable of plugin DTO
   */
  getPluginById(id: number): Observable<PluginDto> {
    return this.httpService.get<PluginDto>(
      `/api/plugins/${id}`
    ) as Observable<PluginDto>;
  }

  /**
   * Compile a plugin by plugin name
   * @param pluginName Name of the plugin to compile
   * @returns Observable of compilation result
   */
  compilePlugin(
    pluginName: string
  ): Observable<{ success: boolean; message?: string }> {
    return this.httpService.post<{ success: boolean; message?: string }>(
      `/api/plugins/compile/${encodeURIComponent(pluginName)}`,
      {}
    ) as Observable<{ success: boolean; message?: string }>;
  }

  /**
   * Search plugins from API (returns all matching plugins as PluginBlock array)
   * @param searchTerm Search term to filter plugins
   * @returns Observable of plugin blocks
   */
  searchPlugins(searchTerm: string = ''): Observable<PluginBlock[]> {
    return this.listPlugins(searchTerm, 0, 100).pipe(
      map((response) =>
        response.content.map((dto) => this.convertDtoToPluginBlock(dto))
      )
    );
  }

  /**
   * Get all active plugins (returns first 100 as PluginBlock array)
   * @returns Observable of plugin blocks
   */
  getAllPlugins(): Observable<PluginBlock[]> {
    return this.listPlugins(undefined, 0, 100).pipe(
      map((response) =>
        response.content.map((dto) => this.convertDtoToPluginBlock(dto))
      )
    );
  }

  /**
   * Convert PluginDto to PluginBlock format for workflow canvas
   * @param dto Plugin DTO from API
   * @returns PluginBlock
   */
  private convertDtoToPluginBlock(dto: PluginDto): PluginBlock {
    const isExternalIcon = this.isExternalUrl(dto.icon);

    // Parse props JSON string to get plugin_properties - handle multiple formats
    let pluginProperties: PluginProperty[] = [] as any;
    // Parse secrets JSON string to get plugin_secrets - similar flexible handling
    let pluginSecrets: PluginProperty[] = [] as any;

    let pluginPropertiesOpt: any = {};
    let pluginSecretsOpt: any = {};
    try {
      if (dto.props) {
        const propsObj = JSON.parse(dto.props);
        console.log('Parsed props for plugin', dto.pluginName, ':', propsObj);

        // Try multiple possible formats
        if (Array.isArray(propsObj)) {
          // Props is directly an array
          pluginProperties = propsObj;
        } else if (
          propsObj.plugin_properties &&
          Array.isArray(propsObj.plugin_properties)
        ) {
          // Props has plugin_properties key
          pluginProperties = propsObj.plugin_properties;
        } else if (propsObj.properties && Array.isArray(propsObj.properties)) {
          // Props has properties key
          pluginProperties = propsObj.properties;
        } else {
          // Check if any key contains an array
          for (const key in propsObj) {
            if (Array.isArray(propsObj[key])) {
              pluginProperties = propsObj[key];
              break;
            }
          }
        }

        pluginPropertiesOpt = { onInit: propsObj.onInit };

        console.log('Extracted plugin_properties:', pluginProperties);
      }
      if (dto.secrets) {
        try {
          const secObj = JSON.parse(dto.secrets);
          // Accept array directly
          if (Array.isArray(secObj)) {
            pluginSecrets = secObj as any;
          } else if (secObj.secrets && Array.isArray(secObj.secrets)) {
            pluginSecrets = secObj.secrets as any;
          } else if (secObj.fields && Array.isArray(secObj.fields)) {
            // FormBuilder style object { title, ..., fields: [] }
            pluginSecrets = secObj.fields as any;
          } else {
            // Fallback: find first array value
            for (const key in secObj) {
              if (Array.isArray(secObj[key])) {
                pluginSecrets = secObj[key] as any;
                break;
              }
            }
          }
          pluginSecretsOpt = { onInit: secObj.onInit };
          console.log('Extracted plugin_secrets:', pluginSecrets);
        } catch (e) {
          console.error(
            'Error parsing plugin secrets for',
            dto.pluginName,
            ':',
            e
          );
        }
      }
    } catch (e) {
      console.error('Error parsing plugin props for', dto.pluginName, ':', e);
    }

    // Add retry properties to all plugins
    const id = [
      {
        id: 'id',
        type: 'text',
        label: 'ID',
        placeholder: 'ID',
        defaultValue: dto.id,
        defaultEnabled: false,
        defaultVisible: false,
      },
      {
        id: 'name',
        type: 'text',
        label: 'Name',
        placeholder: 'Name',
        defaultValue: dto.pluginName,
      },
    ];
    let secretsDdl = [];
    if (pluginSecrets.length > 0) {
      secretsDdl.push({
        id: 'secret',
        type: 'autocomplete',
        label: 'Credentials',
        placeholder: 'Select Credentials',
        required: true,
        options: [],
        icon: 'search',
        defaultVisible: false,
        defaultEnabled: true,
      });
    }
    const allProperties = [
      ...id,
      ...secretsDdl,
      ...pluginProperties,
      ...this.getRetryProperties(),
    ];

    return {
      name: dto.pluginName,
      icon: dto.icon,
      type: `plugin_${dto.pluginId}`,
      description: dto.pluginDesc,
      iconColor: '',
      visible: dto.active,
      input: true,
      output: true,
      isPlugin: true,
      isExternalIcon: isExternalIcon,
      pluginData: {
        id: dto.id,
        plugin_id: dto.pluginId,
        plugin_name: dto.pluginName,
        plugin_desc: dto.pluginDesc,
        plugin_author: dto.pluginAuthor,
        plugin_version: dto.version,
        plugin_document: dto.pluginDocument,
        icon: dto.icon,
        active: dto.active,
        lastLoadedAt: dto.lastLoadedAt,
        plugin_properties: allProperties,
        plugin_secrets: pluginSecrets,
        plugin_secrets_opt: pluginSecretsOpt,
        plugin_properties_opt: pluginPropertiesOpt,
      },
    };
  }

  /**
   * Convert Plugin API response to PluginBlock format
   * @param plugin Plugin from API
   * @returns PluginBlock
   */
  private convertToPluginBlock(plugin: Plugin): PluginBlock {
    const isExternalIcon = this.isExternalUrl(plugin.icon);

    return {
      name: plugin.plugin_name,
      icon: plugin.icon,
      type: `plugin_${plugin.plugin_id}`,
      description: plugin.plugin_desc,
      iconColor: '',
      visible:
        plugin.is_active !== undefined
          ? plugin.is_active
          : plugin.active !== undefined
          ? plugin.active
          : true,
      input: true,
      output: true,
      isPlugin: true,
      pluginData: plugin,
      isExternalIcon: isExternalIcon,
    };
  }

  /**
   * Check if the icon is an external URL
   * @param icon Icon string
   * @returns boolean
   */
  private isExternalUrl(icon: string): boolean {
    return (
      icon?.startsWith('http://') ||
      icon?.startsWith('https://') ||
      icon?.startsWith('data:')
    );
  }

  /**
   * Get common retry policy properties for all plugins
   * @returns Array of retry policy properties
   */
  private getRetryProperties(): any[] {
    return [
      {
        id: 'retryDivider',
        type: 'divider',
        label: 'Retry Policy',
        placeholder: '',
        required: false,
        icon: 'minus',
        defaultVisible: true,
        defaultEnabled: true,
        layout: 'horizontal',
      },
      {
        id: 'timeoutSeconds',
        type: 'number',
        label: 'Timeout (seconds)',
        placeholder: '120',
        defaultValue: 120,
        required: false,
        info: 'Maximum execution time before timeout',
      },
      {
        id: 'maximumAttempts',
        type: 'number',
        label: 'Maximum Attempts',
        placeholder: '3',
        defaultValue: 3,
        required: false,
        info: 'Maximum number of retry attempts',
      },
      {
        id: 'initialIntervalSeconds',
        type: 'number',
        label: 'Initial Retry Interval (seconds)',
        placeholder: '2',
        defaultValue: 2,
        required: false,
        info: 'Initial delay before first retry',
      },
      {
        id: 'maximumIntervalSeconds',
        type: 'number',
        label: 'Maximum Retry Interval (seconds)',
        placeholder: '60',
        defaultValue: 60,
        required: false,
        info: 'Maximum delay between retries',
      },
      {
        id: 'backoffCoefficient',
        type: 'number',
        label: 'Backoff Coefficient',
        placeholder: '2',
        defaultValue: 2,
        required: false,
        info: 'Multiplier for exponential backoff',
      },
    ];
  }

  /**
   * Mock plugin data for testing
   * @param searchTerm Optional search filter
   * @returns Array of plugin blocks
   */
  // private getMockPlugins(searchTerm: string = ''): PluginBlock[] {
  //     const mockPlugins: Plugin[] = [
  //         {
  //             id: 1,
  //             is_active: true,
  //             icon: 'cloud-upload',
  //             plugin_author: 'System Admin',
  //             plugin_desc: 'Send emails with templates and attachments',
  //             plugin_document: 'https://docs.example.com/email-sender',
  //             plugin_version: '1.0.0',
  //             plugin_id: 'email_sender',
  //             plugin_name: 'Email Sender',
  //             raw_class: '{}',
  //             raw_process_class: '{}',
  //             plugin_properties: [
  //                 {
  //                     id: 'to',
  //                     type: 'text',
  //                     label: 'To Email',
  //                     placeholder: 'recipient@example.com',
  //                     required: true,
  //                     info: 'Email address of the recipient'
  //                 },
  //                 {
  //                     id: 'subject',
  //                     type: 'text',
  //                     label: 'Subject',
  //                     placeholder: 'Email subject',
  //                     required: true
  //                 },
  //                 {
  //                     id: 'body',
  //                     type: 'textarea',
  //                     label: 'Email Body',
  //                     placeholder: 'Email content',
  //                     required: true
  //                 },
  //                 {
  //                     id: 'cc',
  //                     type: 'text',
  //                     label: 'CC',
  //                     placeholder: 'cc@example.com',
  //                     required: false,
  //                     info: 'Carbon copy recipients'
  //                 },
  //                 ...this.getRetryProperties()
  //             ]
  //         },
  //         {
  //             id: 2,
  //             is_active: true,
  //             icon: 'database',
  //             plugin_author: 'Database Team',
  //             plugin_desc: 'Execute SQL queries and stored procedures',
  //             plugin_document: 'https://docs.example.com/sql-executor',
  //             plugin_version: '2.1.0',
  //             plugin_id: 'sql_executor',
  //             plugin_name: 'SQL Executor',
  //             raw_class: '{}',
  //             raw_process_class: '{}',
  //             plugin_properties: [
  //                 {
  //                     id: 'connection',
  //                     type: 'select',
  //                     label: 'Database Connection',
  //                     required: true,
  //                     options: [
  //                         { key: 'db1', value: 'Production DB' },
  //                         { key: 'db2', value: 'Test DB' },
  //                         { key: 'db3', value: 'Development DB' }
  //                     ],
  //                     info: 'Select database connection'
  //                 },
  //                 {
  //                     id: 'query',
  //                     type: 'codeeditor',
  //                     label: 'SQL Query',
  //                     placeholder: 'SELECT * FROM users WHERE id = ?',
  //                     required: true,
  //                     language: 'sql'
  //                 },
  //                 {
  //                     id: 'timeout',
  //                     type: 'number',
  //                     label: 'Query Timeout (seconds)',
  //                     defaultValue: 30,
  //                     required: false,
  //                     info: 'Maximum execution time for query'
  //                 },
  //                 ...this.getRetryProperties()
  //             ]
  //         },
  //         {
  //             id: 3,
  //             is_active: true,
  //             icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
  //             plugin_author: 'Integration Team',
  //             plugin_desc: 'Connect to Slack and send messages to channels',
  //             plugin_document: 'https://docs.example.com/slack-connector',
  //             plugin_version: '1.5.2',
  //             plugin_id: 'slack_connector',
  //             plugin_name: 'Slack Connector',
  //             raw_class: '{}',
  //             raw_process_class: '{}',
  //             plugin_properties: [
  //                 {
  //                     id: 'channel',
  //                     type: 'text',
  //                     label: 'Channel',
  //                     placeholder: '#general',
  //                     required: true,
  //                     info: 'Slack channel name (with #)'
  //                 },
  //                 {
  //                     id: 'message',
  //                     type: 'textarea',
  //                     label: 'Message',
  //                     placeholder: 'Enter your message',
  //                     required: true
  //                 },
  //                 {
  //                     id: 'webhook_url',
  //                     type: 'text',
  //                     label: 'Webhook URL',
  //                     placeholder: 'https://hooks.slack.com/services/...',
  //                     required: true,
  //                     info: 'Slack webhook URL for posting messages'
  //                 },
  //                 ...this.getRetryProperties()
  //             ]
  //         },
  //         {
  //             id: 4,
  //             is_active: true,
  //             icon: 'file-text',
  //             plugin_author: 'Document Team',
  //             plugin_desc: 'Generate PDF documents from HTML templates',
  //             plugin_document: 'https://docs.example.com/pdf-generator',
  //             plugin_version: '1.2.0',
  //             plugin_id: 'pdf_generator',
  //             plugin_name: 'PDF Generator',
  //             raw_class: '{}',
  //             raw_process_class: '{}',
  //             plugin_properties: [
  //                 {
  //                     id: 'template',
  //                     type: 'codeeditor',
  //                     label: 'HTML Template',
  //                     placeholder: '<html><body>{{content}}</body></html>',
  //                     required: true,
  //                     language: 'html'
  //                 },
  //                 {
  //                     id: 'filename',
  //                     type: 'text',
  //                     label: 'Output Filename',
  //                     placeholder: 'document.pdf',
  //                     required: true,
  //                     info: 'Name of the generated PDF file'
  //                 },
  //                 {
  //                     id: 'pageSize',
  //                     type: 'select',
  //                     label: 'Page Size',
  //                     required: false,
  //                     options: ['A4', 'Letter', 'Legal', 'A3'],
  //                     defaultValue: 'A4'
  //                 },
  //                 ...this.getRetryProperties()
  //             ]
  //         },
  //         {
  //             id: 5,
  //             is_active: true,
  //             icon: 'api',
  //             plugin_author: 'API Team',
  //             plugin_desc: 'Make HTTP requests to external REST APIs',
  //             plugin_document: 'https://docs.example.com/http-client',
  //             plugin_version: '3.0.1',
  //             plugin_id: 'http_client',
  //             plugin_name: 'HTTP Client',
  //             raw_class: '{}',
  //             raw_process_class: '{}',
  //             plugin_properties: [
  //                 {
  //                     id: 'method',
  //                     type: 'select',
  //                     label: 'HTTP Method',
  //                     required: true,
  //                     options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  //                     defaultValue: 'GET'
  //                 },
  //                 {
  //                     id: 'url',
  //                     type: 'text',
  //                     label: 'URL',
  //                     placeholder: 'https://api.example.com/endpoint',
  //                     required: true
  //                 },
  //                 {
  //                     id: 'headers',
  //                     type: 'codeeditor',
  //                     label: 'Headers',
  //                     placeholder: '{\n  "Content-Type": "application/json"\n}',
  //                     required: false,
  //                     language: 'json',
  //                     info: 'Request headers in JSON format'
  //                 },
  //                 {
  //                     id: 'body',
  //                     type: 'codeeditor',
  //                     label: 'Request Body',
  //                     placeholder: '{\n  "key": "value"\n}',
  //                     required: false,
  //                     language: 'json'
  //                 },
  //                 ...this.getRetryProperties()
  //             ]
  //         },
  //         {
  //             id: 6,
  //             is_active: true,
  //             icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968523.png',
  //             plugin_author: 'Cloud Team',
  //             plugin_desc: 'Upload and manage files in AWS S3 buckets',
  //             plugin_document: 'https://docs.example.com/s3-uploader',
  //             plugin_version: '2.0.0',
  //             plugin_id: 's3_uploader',
  //             plugin_name: 'AWS S3 Uploader',
  //             raw_class: '{}',
  //             raw_process_class: '{}',
  //             plugin_properties: [
  //                 {
  //                     id: 'bucket',
  //                     type: 'text',
  //                     label: 'S3 Bucket Name',
  //                     placeholder: 'my-bucket',
  //                     required: true,
  //                     info: 'Name of the S3 bucket'
  //                 },
  //                 {
  //                     id: 'key',
  //                     type: 'text',
  //                     label: 'Object Key',
  //                     placeholder: 'path/to/file.txt',
  //                     required: true,
  //                     info: 'Path and filename in S3'
  //                 },
  //                 {
  //                     id: 'region',
  //                     type: 'select',
  //                     label: 'AWS Region',
  //                     required: true,
  //                     options: [
  //                         { key: 'us-east-1', value: 'US East (N. Virginia)' },
  //                         { key: 'us-west-2', value: 'US West (Oregon)' },
  //                         { key: 'eu-west-1', value: 'EU (Ireland)' }
  //                     ],
  //                     defaultValue: 'us-east-1'
  //                 },
  //                 {
  //                     id: 'acl',
  //                     type: 'select',
  //                     label: 'Access Control',
  //                     required: false,
  //                     options: ['private', 'public-read', 'public-read-write'],
  //                     defaultValue: 'private'
  //                 },
  //                 ...this.getRetryProperties()
  //             ]
  //         },
  //         {
  //             id: 7,
  //             is_active: true,
  //             icon: 'file-excel',
  //             plugin_author: 'Data Team',
  //             plugin_desc: 'Read and write Excel files with multiple sheets',
  //             plugin_document: 'https://docs.example.com/excel-handler',
  //             plugin_version: '1.8.0',
  //             plugin_id: 'excel_handler',
  //             plugin_name: 'Excel Handler',
  //             raw_class: '{}',
  //             raw_process_class: '{}',
  //             plugin_properties: [
  //                 {
  //                     id: 'operation',
  //                     type: 'select',
  //                     label: 'Operation',
  //                     required: true,
  //                     options: ['Read', 'Write', 'Update'],
  //                     defaultValue: 'Read'
  //                 },
  //                 {
  //                     id: 'filepath',
  //                     type: 'text',
  //                     label: 'File Path',
  //                     placeholder: '/path/to/file.xlsx',
  //                     required: true
  //                 },
  //                 {
  //                     id: 'sheetName',
  //                     type: 'text',
  //                     label: 'Sheet Name',
  //                     placeholder: 'Sheet1',
  //                     required: false,
  //                     info: 'Name of the worksheet to process'
  //                 },
  //                 ...this.getRetryProperties()
  //             ]
  //         },
  //         {
  //             id: 8,
  //             is_active: true,
  //             icon: 'notification',
  //             plugin_author: 'Notification Team',
  //             plugin_desc: 'Send SMS messages via Twilio integration',
  //             plugin_document: 'https://docs.example.com/sms-sender',
  //             plugin_version: '1.3.0',
  //             plugin_id: 'sms_sender',
  //             plugin_name: 'SMS Sender',
  //             raw_class: '{}',
  //             raw_process_class: '{}',
  //             plugin_properties: [
  //                 {
  //                     id: 'to',
  //                     type: 'text',
  //                     label: 'To Phone Number',
  //                     placeholder: '+1234567890',
  //                     required: true,
  //                     info: 'Phone number with country code'
  //                 },
  //                 {
  //                     id: 'message',
  //                     type: 'textarea',
  //                     label: 'Message',
  //                     placeholder: 'Enter your SMS message',
  //                     required: true
  //                 },
  //                 {
  //                     id: 'from',
  //                     type: 'text',
  //                     label: 'From Phone Number',
  //                     placeholder: '+1234567890',
  //                     required: true,
  //                     info: 'Twilio phone number'
  //                 },
  //                 ...this.getRetryProperties()
  //             ]
  //         }
  //     ];

  //     // Convert to PluginBlock format
  //     let pluginBlocks = mockPlugins.map(plugin => this.convertToPluginBlock(plugin));

  //     // Filter by search term if provided
  //     if (searchTerm && searchTerm.trim()) {
  //         const searchLower = searchTerm.toLowerCase();
  //         pluginBlocks = pluginBlocks.filter(block =>
  //             block.name.toLowerCase().includes(searchLower) ||
  //             block.description.toLowerCase().includes(searchLower) ||
  //             block.pluginData?.plugin_author.toLowerCase().includes(searchLower)
  //         );
  //     }

  //     return pluginBlocks;
  // }

  /**
   * Cache plugins for faster access
   * @param plugins Array of plugin blocks
   */
  cachePlugins(plugins: PluginBlock[]): void {
    this.pluginCache = plugins;
  }

  /**
   * Get cached plugins
   * @returns Array of cached plugin blocks
   */
  getCachedPlugins(): PluginBlock[] {
    return this.pluginCache;
  }

  /**
   * Clear plugin cache
   */
  clearCache(): void {
    this.pluginCache = [];
  }
}
