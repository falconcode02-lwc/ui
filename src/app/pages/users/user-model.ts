export interface User {
  userId?: string;
  username: string;
  email: string;
  fullName: string;
  status: "ACTIVE" | "INACTIVE";
  password?: string; // Optional, only used for create/update
  roleId?: string;
  roleName?: string;
  workspaceIds?: string[];
  projectIds?: string[];
  createdTime?: number[];
  modifiedTime?: number[] | null;
  createdBy?: string;
  modifiedBy?: string;
  createdAt?: any;
  updatedAt?: any;
}
