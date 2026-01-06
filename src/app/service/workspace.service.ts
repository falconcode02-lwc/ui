import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Workspace } from '../model/workspace-model';
import { PageResponse } from '../model/workspace-page-model';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class WorkspaceService {

  private baseUrl = `${environment.apiUrl}/api/v1/workspaces`;

  constructor(private http: HttpClient) { }

  getWorkspacesByOrgId(orgId: string, page = 0, size = 20): Observable<PageResponse<Workspace>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<PageResponse<Workspace>>(`${this.baseUrl}/list/${orgId}`, { params });
  }

  getWorkspaces(page = 0, size = 20): Observable<PageResponse<Workspace>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<PageResponse<Workspace>>(`${this.baseUrl}/list`, { params });
  }

  createWorkspace(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/create`, data);
  }

  updateWorkspace(id: string, payload: any) {
    return this.http.put(`${this.baseUrl}/${id}`, payload);
  }

  deleteWorkspace(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  active(id: string, active: boolean): Observable<void> {
    const options = {
      params: new HttpParams().set('active', active)
    };
    return this.http.put<void>(`${this.baseUrl}/${id}/active`, null, options);
  }
}
