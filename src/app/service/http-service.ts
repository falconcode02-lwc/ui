
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../environments/environment';

type ObserveOption = 'body' | 'events';

@Injectable({ providedIn: 'root' })
export class HttpService {
    /**
     * Update an agent by ID
     */
    updateAgent<T = any>(agentId: string, payload: any): Observable<T> {
        return this.put<T>(`/api/ai/agents/${encodeURIComponent(agentId)}`, payload) as Observable<T>;
    }

    /**
     * Delete an agent by ID
     */
    deleteAgent<T = any>(agentId: string): Observable<T> {
        return this.httpClient.delete<T>(`${this.baseUrl}/api/ai/agents/${encodeURIComponent(agentId)}`, { headers: this.defaultHeaders() })
            .pipe(catchError(this.handleError));
    }
    /**
     * Fetch provider configs from backend API
     */
    getProviderConfigs<T = any>(): Observable<T> {
        return this.get<T>('/api/provider-config') as Observable<T>;
    }
    /**
     * List all agents from backend
     */
    listAgents<T = any>(): Observable<T> {
        return this.get<T>('/api/ai/agents') as Observable<T>;
    }


    /**
     * Fetch agent model providers from backend API
     */
    getAgentProviders<T = any>(): Observable<T> {
        return this.get<T>('/api/agent/providers') as Observable<T>;
    }
    /**
     * Dynamically test any API endpoint with method, headers, and body.
     */
    testAPI<T = any>(params: { url: string; method: string; headers?: any; body?: any }): Observable<T> {
        const { url, method, headers, body } = params;
        const httpHeaders = new HttpHeaders(headers || {});
        switch (method?.toUpperCase()) {
            case 'GET':
                return this.httpClient.get<T>(url, { headers: httpHeaders }).pipe(catchError(this.handleError));
            case 'POST':
                return this.httpClient.post<T>(url, body ?? {}, { headers: httpHeaders }).pipe(catchError(this.handleError));
            case 'PUT':
                return this.httpClient.put<T>(url, body ?? {}, { headers: httpHeaders }).pipe(catchError(this.handleError));
            case 'PATCH':
                return this.httpClient.patch<T>(url, body ?? {}, { headers: httpHeaders }).pipe(catchError(this.handleError));
            case 'DELETE':
                return this.httpClient.delete<T>(url, { headers: httpHeaders }).pipe(catchError(this.handleError));
            default:
                return throwError(() => new Error('Unsupported HTTP method'));
        }
    }


    private baseUrl = environment.apiUrl;

    constructor(private httpClient: HttpClient) { }

    private defaultHeaders(): HttpHeaders {
        return new HttpHeaders({ 'Content-Type': 'application/json' });
    }

    private buildParams(params?: Record<string, any>): HttpParams | undefined {
        if (!params) return undefined;
        let httpParams = new HttpParams();
        Object.keys(params).forEach((k) => {
            const v = params[k];
            if (v === null || v === undefined) return;
            if (Array.isArray(v)) {
                v.forEach((val) => (httpParams = httpParams.append(k, String(val))));
            } else {
                httpParams = httpParams.set(k, String(v));
            }
        });
        return httpParams;
    }

    private handleError(error: any) {
        console.error('HTTP Error', error);
        const msg = error?.error?.message ?? error?.message ?? 'Unknown error';
        return throwError(() => new Error(msg));
    }

    // ============================
    // GET overloads
    // ============================
    get<T>(path: string, params?: Record<string, any>): Observable<T>;
    get<T>(path: string, params: Record<string, any> | undefined, observe: 'events'): Observable<HttpEvent<T>>;
    get<T>(
        path: string,
        params?: Record<string, any>,
        observe: ObserveOption = 'body'
    ): Observable<T> | Observable<HttpEvent<T>> {
        const options: any = {
            headers: this.defaultHeaders(),
            params: this.buildParams(params),
            observe: observe === 'events' ? 'events' : 'body',
            reportProgress: observe === 'events'
        };
        return this.httpClient
            .get<T>(`${this.baseUrl}${path}`, options)
            .pipe(retry(1), catchError(this.handleError));
    }

    // ============================
    // POST overloads
    // ============================
    post<T>(path: string, body?: any): Observable<T>;
    post<T>(path: string, body: any | undefined, observe: 'events'): Observable<HttpEvent<T>>;
    post<T>(path: string, body?: any, observe: ObserveOption = 'body'): Observable<T> | Observable<HttpEvent<T>> {
        console.log(path)
        const options: any = {
            headers: this.defaultHeaders(),
            observe: observe === 'events' ? 'events' : 'body',
            reportProgress: observe === 'events'
        };
        return this.httpClient
            .post<T>(`${this.baseUrl}${path}`, body ?? {}, options)
            .pipe(retry(1), catchError(this.handleError));
    }

    // ============================
    // PUT overloads
    // ============================
    put<T>(path: string, body?: any): Observable<T>;
    put<T>(path: string, body: any | undefined, observe: 'events'): Observable<HttpEvent<T>>;
    put<T>(path: string, body?: any, observe: ObserveOption = 'body'): Observable<T> | Observable<HttpEvent<T>> {
        const options: any = {
            headers: this.defaultHeaders(),
            observe: observe === 'events' ? 'events' : 'body',
            reportProgress: observe === 'events'
        };
        return this.httpClient
            .put<T>(`${this.baseUrl}${path}`, body ?? {}, options)
            .pipe(retry(1), catchError(this.handleError));
    }

    // ============================
    // Public API using helpers
    // ============================
    getData<T = any>(): Observable<T> {
        return this.get<T>('/getFolders') as Observable<T>;
    }

    getDataFiles<T = any>(classType: String): Observable<T> {
        return this.get<T>('/getFiles?classType=' + classType) as Observable<T>;
    }

    getDataByClassTypeAndFqcn<T = any>(classType: string, fqcn: string): Observable<T> {
        return this.get<T>('/getByClassTypeAndFqcn', { classType, fqcn }) as Observable<T>;
    }

    getDataById<T = any>(id: number): Observable<T> {
        return this.get<T>('/getById', { id }) as Observable<T>;
    }

    getFunctions<T = any>(): Observable<T> {
        return this.get<T>('/getAllFunctions') as Observable<T>;
    }

    executeWorkflow<T = any>(payload: any): Observable<T> {
        return this.post<T>('/api/v1/workflowManager/createWorkflow', payload) as Observable<T>;
    }

    executeWorkflowUpdateflow<T = any>(payload: any): Observable<T> {
        return this.post<T>('/api/v1/workflowManager/updateWorkflow', payload) as Observable<T>;
    }

    savePostData<T = any>(payload: any): Observable<T> {
        return this.post<T>('/compile', payload) as Observable<T>;
    }

    executeDb<T = any>(payload: any): Observable<T> {
        return this.post<T>('/api/schema/generate', payload) as Observable<T>;
    }

    getObjectList<T = any>(): Observable<T> {
        return this.get<T>('/api/schema/getObjects') as Observable<T>;
    }

    getColumns<T = any>(tableName: string): Observable<T> {
        return this.get<T>('/api/schema/getColumns', { tableName }) as Observable<T>;
    }

    getDashboardCount<T = any>(): Observable<T> {
        return this.get<T>('/getAllCounts') as Observable<T>;
    }

    // example: request history with default body observe
    getDashboardHistory<T = any>(workflowId: string): Observable<T> {
        return this.get<T>('/getHistory', { workflowId }) as Observable<T>;
    }

    // Example file-upload method that returns HttpEvent stream for progress
    uploadFile<T = any>(path: string, formData: FormData): Observable<HttpEvent<T>> {
        // call post with observe 'events' to get progress events
        return this.post<T>(path, formData, 'events') as Observable<HttpEvent<T>>;
    }

    saveAPIData<T = any>(payload: any): Observable<T> {
        return this.post<T>('/api/saveAPI', payload) as Observable<T>;
    }

    /**
     * Call backend AI agent service. Adjust the path to match your Java service endpoint.
     * By default this posts to /api/v1/ai/agent on the configured baseUrl.
     */
    callAiAgent<T = any>(payload: any): Observable<T> {
        return this.post<T>('/api/v1/ai/agent', payload) as Observable<T>;
    }

    // New agent-based endpoints matching the backend AgentController
    createAgent<T = any>(payload: any): Observable<T> {
        return this.post<T>('/api/ai/agents', payload) as Observable<T>;
    }

    /** Send a message to an existing agent */
    messageAgent<T = any>(agentId: string, body: { message: string }): Observable<T> {
        return this.post<T>(`/api/ai/agents/${encodeURIComponent(agentId)}/message`, body) as Observable<T>;
    }

    /** Get agent memory */
    getAgentMemory<T = any>(agentId: string): Observable<T> {
        return this.get<T>(`/api/ai/agents/${encodeURIComponent(agentId)}/memory`) as Observable<T>;
    }

    /** Call n8n tool via agent */
    callAgentN8n<T = any>(agentId: string, body: any): Observable<T> {
        return this.post<T>(`/api/ai/agents/${encodeURIComponent(agentId)}/tools/n8n`, body) as Observable<T>;
    }

    // ============================
    // Secrets CRUD endpoints
    // Backend controller: POST /api/secrets, GET /api/secrets, GET /api/secrets/{id}, PUT /api/secrets/{id}, DELETE /api/secrets/{id}
    // ============================
    createSecret<T = any>(secret: any): Observable<T> {
        return this.post<T>('/api/secrets', secret) as Observable<T>;
    }

    getSecret<T = any>(id: number | string): Observable<T> {
        return this.get<T>(`/api/secrets/${encodeURIComponent(String(id))}`) as Observable<T>;
    }

    listSecrets<T = any>(): Observable<T> {
        return this.get<T>('/api/secrets') as Observable<T>;
    }

    listSecretsByType<T = any>(type: string): Observable<T> {
        return this.get<T>('/api/secrets/getByType?type=' + type) as Observable<T>;
    }

    updateSecret<T = any>(id: number | string, secret: any): Observable<T> {
        return this.put<T>(`/api/secrets/${encodeURIComponent(String(id))}`, secret) as Observable<T>;
    }

    deleteSecret<T = any>(id: number | string): Observable<T> {
        // The class doesn't currently expose a delete wrapper; use post to call DELETE via a path if backend supports it.
        // Safer: call the raw httpClient.delete by building a small helper here.
        const path = `/api/secrets/${encodeURIComponent(String(id))}`;
        return this.httpClient
            .delete<T>(`${this.baseUrl}${path}`, { headers: this.defaultHeaders() })
            .pipe(retry(1), catchError(this.handleError));
    }
}
