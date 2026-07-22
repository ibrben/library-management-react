export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
  user: AuthenticatedUser;
}

export interface EndUserListItem {
  id: string;
  username: string | null;
}

export type UserRole = "Administrator" | "Librarian" | "EndUser";
