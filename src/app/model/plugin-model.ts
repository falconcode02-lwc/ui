export interface PluginProperty {
    id: string;
    type: string;
    label: string;
    placeholder?: string;
    required: boolean;
    defaultValue?: any;
    defaultEnabled?:boolean;
    options?: string[] | { key: string; value: string }[];
    info?: string;
    language?: string; // For code editor
}

export interface Plugin {
    id: number;
    is_active?: boolean; // Legacy field name
    active?: boolean; // New field name from DTO
    icon: string; // Can be external URL or internal icon name
    plugin_author: string;
    plugin_desc: string;
    plugin_document: string;
    plugin_version: string;
    plugin_id: string;
    plugin_name: string;
    raw_class?: string;
    raw_process_class?: string;
    plugin_properties?: PluginProperty[]; // Properties for the plugin
    plugin_secrets?: PluginProperty[]; // Secret definitions (secured) produced by plugin.setSercrets(...)
    plugin_properties_opt?: any; // Optional properties for the plugin
    plugin_secrets_opt?: any; // Optional secret definitions (secured) produced by plugin.setSercrets(...)
    lastLoadedAt?: string; // Timestamp of last load
}

export interface PluginBlock {
    name: string;
    icon: string;
    type: string;
    description: string;
    iconColor: string;
    visible: boolean;
    input: boolean;
    output: boolean;
    isPlugin: boolean;
    pluginData?: Plugin;
    isExternalIcon?: boolean; // True if icon is a URL
}

export interface ToolboxSection {
    name: string;
    blocks: PluginBlock[];
}
