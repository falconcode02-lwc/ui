export interface User {
  userId?: string;
  username: string;
  email: string;
  fullName: string;
  status: "ACTIVE" | "INACTIVE";
  password?: string; // Optional, only used for create/update
  createdAt?: Date;
  updatedAt?: Date;
}
