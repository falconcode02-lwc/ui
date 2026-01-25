export interface RolePermissions {
  workspace?: {
    view?: boolean;
    edit?: boolean;
  };
  project?: {
    view?: boolean;
    edit?: boolean;
    delete?: boolean;
  };
  workflow?: {
    view?: boolean;
    edit?: boolean;
    create?: boolean;
    transfer?: boolean;
    delete?: boolean;
  };
  plugin?: {
    view?: boolean;
    edit?: boolean;
    deploy?: boolean;
    delete?: boolean;
  };
}

export interface Role {
  roleId?: string;
  roleName: string;
  description: string;
  permissions?: RolePermissions | string;
  createdTime?: number[];
  modifiedTime?: number[] | null;
  createdBy?: string;
  modifiedBy?: string;
}
