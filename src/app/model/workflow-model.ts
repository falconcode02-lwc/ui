export interface Workflow {
    id: number;
    name: string;
    version: number;
    workflowJson: any; // or use object if parsed JSON preferred
    workflowJsonRaw: any;
    description: string;
    active: boolean;
    code: string;
    controller: string;

    createdTime?: any;     // ISO timestamp from backend
    modifiedTime?: any;   // optional since can be null initially
}

export interface WorkflowExportData {
    metadata: {
        name: string;
        description: string;
        code: string;
        controller: string;
        version: number;
        exportedAt: string;
    };
    workflowJsonRaw: any;
    workflowJson: any;
}

export interface WorkflowImportData {
    metadata: {
        name: string;
        description: string;
        code: string;
        controller: string;
        version: number;
        exportedAt: string;
    };
    workflowJsonRaw: any;
    workflowJson: any;
}

export interface ValidationResult {
    valid: boolean;
    missingCalls: string[];
    missingPlugins: string[];
    warnings: string[];
    errors: string[];
}