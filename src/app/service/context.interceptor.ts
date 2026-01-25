import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { ContextService } from "./context.service";

export const contextInterceptor: HttpInterceptorFn = (req, next) => {
  const contextService = inject(ContextService);
  const workspace = contextService.getWorkspace();
  const project = contextService.getProject();

  let authReq = req;

  const headers: { [key: string]: string } = {};
  if (workspace) {
    headers["X-Workspace-Id"] = workspace;
  }
  if (project) {
    headers["X-Project-Id"] = project;
  }

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  if (currentUser && currentUser.userId) {
    headers["X-User-Id"] = currentUser.userId;
  }
  if (currentUser && currentUser.username) {
    headers["X-Username"] = currentUser.username;
  }

  if (Object.keys(headers).length > 0) {
    authReq = req.clone({
      setHeaders: headers,
    });
  }

  return next(authReq);
};
