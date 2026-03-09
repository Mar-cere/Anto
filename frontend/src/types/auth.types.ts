/**
 * Tipos para el contexto de autenticación.
 */
import type { User } from './api.types';

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<{
    success: boolean;
    data?: { token: string; user: User };
    error?: string;
  }>;
  register: () => Promise<null>;
  logout: () => Promise<void>;
  updateUser: (userId: string, data: Partial<User>) => Promise<unknown>;
  refreshSession: () => Promise<void>;
}
