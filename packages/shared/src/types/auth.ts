// Authentication types
export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  username: string;
  phone?: string;
  location?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: {
    id: string;
    email: string;
  };
}

export interface AuthError {
  message: string;
  status?: number;
}

export type AuthProvider = 'google' | 'apple';
