export interface Workspace {
  id: string;
  orgId: string;
  name: string;
  type: string;
  description?: string;
  active: boolean;
  icon?: string;
  code?: string;
  createdTime?: number[]; // [yyyy, mm, dd, hh, mm, ss, nanos]
  modifiedTime?: number[] | null;
  createdBy?: string;
  modifiedBy?: string;
}
