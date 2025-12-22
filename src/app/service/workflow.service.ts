import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Workflow, WorkflowExportData, ValidationResult } from '../model/workflow-model';
import { environment } from '../environments/environment';
@Injectable({ providedIn: 'root' })
export class WorkflowService {
    private apiUrl = environment.apiUrl + '/api/v1/workflows'; // backend endpoint
    private apiUrlWkflows = environment.apiUrl + '/api/v1/workflowManager'
    constructor(private http: HttpClient) { }

    getAll(): Observable<Workflow[]> {
        return this.http.get<Workflow[]>(this.apiUrl);
    }

    getById(id: number): Observable<Workflow[]> {
        return this.http.get<Workflow[]>(`${this.apiUrl}/${id}`);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    active(id: number, active: boolean): Observable<void> {
        return this.http.get<void>(`${this.apiUrl}/${id}/active/${active}`);
    }

    update(id: number, data: Workflow): Observable<Workflow> {
        return this.http.put<Workflow>(`${this.apiUrl}/${id}`, data);
    }

    create(data: Workflow): Observable<Workflow> {
        return this.http.post<Workflow>(`${this.apiUrl}`, data);
    }

    getWorkflows(namespace: string, query: string, pageSize: number, nextPageToken: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrlWkflows}/list?namespace=${namespace}&query=${query}&pageSize=${pageSize}&nextPageToken=${nextPageToken}`);
    }

    terminateWorkflows(workflowId: string, reason: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrlWkflows}/terminate?workflowId=${workflowId}&reason=${reason}`);
    }


    getWorkflowStepsStatus(namespace: string, workflowId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrlWkflows}/getStepsStatus?namespace=${namespace}&workflowId=${workflowId}`);
    }

    getActiveWorkflow(): Observable<void> {
        return this.http.get<void>(`${this.apiUrl}/active`);
    }

    /**
     * Export workflow as .ffw file
     * @param workflow Workflow to export
     */
    exportWorkflow(workflow: Workflow): void {
        const exportData: WorkflowExportData = {
            metadata: {
                name: workflow.name,
                description: workflow.description,
                code: workflow.code,
                controller: workflow.controller,
                version: workflow.version,
                exportedAt: new Date().toISOString()
            },
            workflowJsonRaw: typeof workflow.workflowJsonRaw === 'string'
                ? JSON.parse(workflow.workflowJsonRaw)
                : workflow.workflowJsonRaw,
            workflowJson: typeof workflow.workflowJson === 'string'
                ? JSON.parse(workflow.workflowJson)
                : workflow.workflowJson
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        // Create download link
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${workflow.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ffw`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Validate imported workflow data
     * @param workflowData Imported workflow data
     * @returns Validation result with missing dependencies
     */
    validateWorkflowImport(workflowData: any): Observable<ValidationResult> {
        const result: ValidationResult = {
            valid: true,
            missingCalls: [],
            missingPlugins: [],
            warnings: [],
            errors: []
        };

        try {
            // Parse workflowJsonRaw to find all referenced calls and plugins
            const workflowJsonRaw = workflowData.workflowJsonRaw;

            if (workflowJsonRaw && workflowJsonRaw.nodes) {
                const nodes = workflowJsonRaw.nodes;

                nodes.forEach((node: any) => {
                    // Check for call nodes
                    if (node.data?.call && node.data.call.trim() !== '') {
                        const callName = node.data.call;
                        // Note: In real scenario, we'd check against available calls
                        // For now, we'll just track them
                        if (!result.missingCalls.includes(callName)) {
                            result.missingCalls.push(callName);
                        }
                    }

                    // Check for plugin nodes
                    if (node.type === 'plugin' || node.data?.isPlugin || node.meta?.isPlugin) {
                        const pluginId = node.meta?.pluginData?.plugin_id ||
                            node.data?.pluginData?.plugin_id ||
                            'Unknown Plugin';

                        if (!result.missingPlugins.includes(pluginId)) {
                            result.missingPlugins.push(pluginId);
                        }
                    }
                });

                // Add warnings if there are potential issues
                if (result.missingCalls.length > 0) {
                    result.warnings.push(`This workflow references ${result.missingCalls.length} call(s). Please ensure they exist in your environment.`);
                }

                if (result.missingPlugins.length > 0) {
                    result.warnings.push(`This workflow uses ${result.missingPlugins.length} plugin(s). Please ensure they are installed.`);
                }
            }

            // Validate required metadata
            if (!workflowData.metadata?.name || workflowData.metadata.name.trim() === '') {
                result.errors.push('Workflow name is required');
                result.valid = false;
            }

            if (!workflowData.metadata?.code || workflowData.metadata.code.trim() === '') {
                result.errors.push('Workflow code is required');
                result.valid = false;
            }

            // Controller is optional, no validation needed

        } catch (error) {
            result.valid = false;
            result.errors.push('Invalid workflow file format');
        }

        return of(result);
    }
}
