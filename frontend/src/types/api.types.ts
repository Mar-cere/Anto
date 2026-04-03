/**
 * Tipos compartidos para la API y contratos con el backend.
 * Base para migración gradual a TypeScript.
 */

/** Preferencias de tono del chat (UserProfile; expuestas en GET /me dentro de preferences) */
export interface ChatPreferences {
  reduceStockEmpathy?: boolean;
  avoidApologyOpenings?: boolean;
  preferQuestions?: boolean;
}

/** Preferencias de usuario (alineado con backend) */
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  notifications?: boolean;
  language?: 'es' | 'en';
  privacy?: {
    profileVisibility?: 'public' | 'private' | 'friends';
  };
  responseStyle?: string;
  chatPreferences?: ChatPreferences;
}

/** Estadísticas del usuario */
export interface UserStats {
  tasksCompleted?: number;
  habitsStreak?: number;
  totalSessions?: number;
  lastActive?: string | Date;
  [key: string]: unknown;
}

/** Suscripción (trial, plan, fechas) */
export interface UserSubscription {
  status?: string;
  trialStartDate?: string | Date;
  trialEndDate?: string | Date;
  plan?: string;
  [key: string]: unknown;
}

/** Usuario tal como lo devuelve el backend (login, me, userData) */
export interface User {
  _id: string;
  email: string;
  username: string;
  name?: string | null;
  emailVerified?: boolean;
  lastLogin?: string | Date;
  role?: string;
  preferences?: UserPreferences;
  stats?: UserStats;
  subscription?: UserSubscription;
  termsAccepted?: boolean;
  termsVersion?: string;
  [key: string]: unknown;
}

/** Credenciales de login */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Respuesta exitosa de login (backend) */
export interface LoginResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user: User;
  message?: string;
}

/** Resultado del helper login() en config/api */
export interface LoginResult {
  success: true;
  data: { token: string; user: User };
}

export interface LoginErrorResult {
  success: false;
  error: string;
}

export type LoginResultType = LoginResult | LoginErrorResult;

/** Resultado de checkAuthStatus() */
export interface CheckAuthResult {
  isAuthenticated: boolean;
  user?: User;
  token?: string;
}

/** Respuesta de error estándar del API */
export interface ApiErrorResponse {
  message?: string;
  error?: string;
  errors?: string[];
  [key: string]: unknown;
}

/** Error extendido con respuesta (axios/fetch style) */
export interface ApiError extends Error {
  response?: {
    status: number;
    data?: ApiErrorResponse;
  };
}

/** Respuesta genérica con notModified (304) */
export type ApiGetResponse<T> = T | { notModified: true };
