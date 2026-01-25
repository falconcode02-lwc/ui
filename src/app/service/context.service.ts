import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class ContextService {
  private workspaceSubject = new BehaviorSubject<string | null>(
    localStorage.getItem("selectedWorkspace"),
  );
  private projectSubject = new BehaviorSubject<string | null>(
    localStorage.getItem("selectedProject"),
  );

  workspace$ = this.workspaceSubject.asObservable();
  project$ = this.projectSubject.asObservable();

  setWorkspace(id: string | null): void {
    if (id) {
      localStorage.setItem("selectedWorkspace", id);
    } else {
      localStorage.removeItem("selectedWorkspace");
    }
    this.workspaceSubject.next(id);
  }

  getWorkspace(): string | null {
    return this.workspaceSubject.value;
  }

  setProject(id: string | null): void {
    if (id) {
      localStorage.setItem("selectedProject", id);
    } else {
      localStorage.removeItem("selectedProject");
    }
    this.projectSubject.next(id);
  }

  getProject(): string | null {
    return this.projectSubject.value;
  }

  clear(): void {
    this.workspaceSubject.next(null);
    this.projectSubject.next(null);
  }
}
