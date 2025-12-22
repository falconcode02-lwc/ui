export interface Column {
  name: string;
  type: string;
  length?: number;
  isPrimary: boolean;
  isNullable: boolean;
  isAutoIncrement: boolean;
isnew?: boolean;
}

export interface Table {
  id: Number,
  classType: string,
  name: string;
  columns: Column[];
}
