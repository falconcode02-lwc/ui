export interface Form {
    id: number;
    code: string;
    name: string;
    formJson: string; // JSON string containing fields and configuration
    description: string;
    version: number;
    active: boolean;

    createdTime?: any;     // ISO timestamp from backend
    modifiedTime?: any;    // optional since can be null initially
}
