/**
 * Extensión de tipos de Express para req.user y respuestas.
 */
import type { AuthUser } from './auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
