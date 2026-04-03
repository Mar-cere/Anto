/**
 * Tipos de API y contratos backend.
 * Alineados con frontend/src/types/api.types.ts para mantener contratos consistentes.
 */

/** Preferencias de tono del chat (UserProfile) */
export interface ChatPreferences {
  reduceStockEmpathy?: boolean;
  avoidApologyOpenings?: boolean;
  preferQuestions?: boolean;
}

/** Preferencias de usuario */
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

/** Usuario tal como lo expone el backend (login, me, userData) */
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

/** Respuesta exitosa de login */
export interface LoginResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user: User;
  message?: string;
}

/** Respuesta de error estándar del API */
export interface ApiErrorResponse {
  message?: string;
  error?: string;
  errors?: string[];
  [key: string]: unknown;
}

/** Respuesta genérica de éxito del API */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
  [key: string]: unknown;
}

/** Respuesta de error del API */
export interface ApiFailResponse {
  success: false;
  message?: string;
  error?: string;
  errors?: string[];
  [key: string]: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiFailResponse;

/** Paginación (común en listados) */
export interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
  skip?: number;
}
