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

/** Estilo de respuesta del chat (enum Joi en backend `userRoutes`) */
export type ResponseStyle =
  | 'brief'
  | 'balanced'
  | 'deep'
  | 'empatico'
  | 'estructurado';

/** Preferencias de usuario (alineado con backend) */
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  notifications?: boolean;
  language?: 'es' | 'en';
  /** IANA time zone, p. ej. "America/Argentina/Buenos_Aires" */
  timezone?: string;
  /** ISO alpha-2 inferido del locale del dispositivo (sin GPS) */
  regionCountry?: string;
  /** País explícito (ISO, prefijo telefónico o legacy) */
  country?: string;
  privacy?: {
    profileVisibility?: 'public' | 'private' | 'friends';
  };
  responseStyle?: ResponseStyle;
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
  trialGrantedAt?: string | Date;
  plan?: string;
  [key: string]: unknown;
}

/** Config pública de la app (GET /api/health/app-config) */
export interface AppConfigResponse {
  success: boolean;
  trialDays: number;
  weeklySummaryTrialGiftDays: number;
}

/** Respuesta de registro (POST /api/auth/register) */
export interface RegisterResponse {
  message?: string;
  requiresVerification?: boolean;
  email?: string;
  trialDays: number;
  weeklySummaryTrialGiftDays?: number;
  user: Pick<User, '_id' | 'email' | 'username' | 'emailVerified'>;
}

/** Trial del usuario (GET /api/payments/trial-info) */
export interface TrialInfoResponse {
  success: boolean;
  isInTrial: boolean;
  daysRemaining: number;
  hoursRemaining?: number;
  trialEndDate?: string | Date | null;
  appTrialDays?: number;
  shouldNotify?: boolean;
  error?: string;
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
