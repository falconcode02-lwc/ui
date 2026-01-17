import { Injectable } from "@angular/core";
import { HttpService } from "../../service/http-service";
import { Observable } from "rxjs";
import { Project } from "./project-model";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { ContextService } from "../../service/context.service";

@Injectable({ providedIn: "root" })
export class ProjectService {
  private readonly base = "projects";
  constructor(
    private http: HttpService,
    private httpClient: HttpClient,
    private contextService: ContextService
  ) {}

  private getSelectedWorkspace(): string {
    return this.contextService.getWorkspace() || "DEFAULT";
  }

  // list all projects in a workspace
  getAll(): Observable<Project[]> {
    const workspaceCode = this.getSelectedWorkspace();
    return this.http.get(`/api/${this.base}/workspace/${workspaceCode}`);
  }

  // get one project by id
  getById(id: string): Observable<Project> {
    return this.http.get(`/api/${this.base}/${id}`);
  }

  // create project
  create(p: Project): Observable<Project> {
    if (!p.workspaceCode) {
      p.workspaceCode = this.getSelectedWorkspace();
    }
    return this.http.post(`/api/${this.base}`, p);
  }

  // update project
  update(id: string, p: Project): Observable<Project> {
    return this.http.put(`/api/${this.base}/${id}`, p);
  }

  // delete project – uses HttpClient directly, HttpService untouched
  delete(id: string): Observable<void> {
    const url = `${environment.apiUrl}/api/${this.base}/${encodeURIComponent(
      id
    )}`;
    return this.httpClient.delete<void>(url);
  }

  // start Temporal workflow for a project
  startWorkflow(id: string): Observable<any> {
    return this.http.post(`/api/${this.base}/${id}/start`, {});
  }
}
