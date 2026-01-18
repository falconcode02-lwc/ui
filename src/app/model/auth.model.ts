export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  userId?: string;
  username?: string;
  fullName?: string;
  email?: string;
  remainingAttempts?: number;
  accountLocked?: boolean;
}
