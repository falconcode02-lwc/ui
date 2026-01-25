export interface Project {
  id?: string;
  code: string;
  name: string;
  icon?: string;
  description?: string;
  accessibility: "PUBLIC" | "PRIVATE";
  workspaceCode?: string;
  createdTime?: number[];
  modifiedTime?: number[] | null;
  createdBy?: string;
  modifiedBy?: string;
}
