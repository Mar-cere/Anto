/**
 * Tipos de autenticación y JWT.
 * Usados por middleware/auth y rutas protegidas.
 */

/** Payload del JWT (lo que se guarda en el token) */
export interface JwtPayload {
  userId: string;
  _id?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/** Usuario autenticado en req.user (tras authenticateToken) */
export interface AuthUser {
  _id: string;
  userId: string;
  role: string;
}

/** Request de Express con usuario autenticado (para rutas protegidas) */
export interface AuthenticatedRequest {
  user: AuthUser;
}
