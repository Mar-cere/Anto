/**
 * Autenticación por JWT de sesión invitada (chat sin cuenta)
 */
import jwt from 'jsonwebtoken';
import GuestSession from '../models/GuestSession.js';

export async function authenticateGuest(req, res, next) {
  const authHeader = req.headers.authorization || req.header('Authorization');
  let token = null;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers['x-guest-token']) {
    token = req.headers['x-guest-token'];
  }

  if (!token) {
    return res.status(401).json({ message: 'Token de invitado requerido', code: 'GUEST_TOKEN_MISSING' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.typ !== 'guest' || !decoded.gsid) {
      return res.status(401).json({ message: 'Token de invitado inválido', code: 'GUEST_TOKEN_INVALID' });
    }

    const guestSession = await GuestSession.findById(decoded.gsid).lean();
    if (!guestSession) {
      return res.status(401).json({ message: 'Sesión invitada no encontrada', code: 'GUEST_SESSION_NOT_FOUND' });
    }

    if (new Date(guestSession.expiresAt).getTime() < Date.now()) {
      return res.status(401).json({ message: 'Sesión invitada expirada', code: 'GUEST_SESSION_EXPIRED' });
    }

    req.guestSession = guestSession;
    req.guestTokenPayload = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Token de invitado inválido', code: 'GUEST_TOKEN_INVALID' });
  }
}
