/**
 * Middleware de Autenticación - Gestiona la autenticación y autorización de usuarios
 */
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

// Constantes de códigos de estado HTTP
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const HTTP_INTERNAL_SERVER_ERROR = 500;

// Constantes de mensajes de error
const ERROR_MESSAGES = {
  TOKEN_NOT_PROVIDED: 'Token no proporcionado',
  TOKEN_INVALID: 'Token inválido',
  TOKEN_EXPIRED: 'Token expirado',
  TOKEN_INVALID_FORMAT: 'Token no proporcionado o formato inválido',
  USER_NOT_AUTHENTICATED: 'Usuario no autenticado',
  PERMISSION_DENIED: 'No tienes permiso para realizar esta acción',
  RESOURCE_NOT_FOUND: 'Recurso no encontrado',
  OWNERSHIP_DENIED: 'No tienes permiso para acceder a este recurso',
  OWNERSHIP_ERROR: 'Error al verificar propiedad del recurso'
};

// Constantes de nombres de errores
const ERROR_NAMES = {
  TOKEN_EXPIRED: 'TokenExpiredError'
};

// Helper: extraer token del header de autorización
const extractToken = (req) => {
  const authHeader = req.headers['authorization'] || req.header('Authorization');
  if (!authHeader) return null;
  
  // Soporta tanto 'Bearer token' como 'token'
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return authHeader.split(' ')[1] || authHeader;
};

// Helper: verificar y decodificar token JWT
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw error;
  }
};

// Helper: manejar errores de token
const handleTokenError = (error, res) => {
  if (error.name === ERROR_NAMES.TOKEN_EXPIRED) {
    return res.status(HTTP_UNAUTHORIZED).json({ 
      message: ERROR_MESSAGES.TOKEN_EXPIRED 
    });
  }
  return res.status(HTTP_UNAUTHORIZED).json({ 
    message: ERROR_MESSAGES.TOKEN_INVALID 
  });
};

/**
 * Middleware para autenticar usuarios mediante JWT
 * Extrae el token del header Authorization y lo verifica
 * Asigna req.user con los datos del usuario decodificado
 * Incluye el rol del usuario desde el token o la base de datos
 */
export async function authenticateToken(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(HTTP_UNAUTHORIZED).json({ 
      message: ERROR_MESSAGES.TOKEN_NOT_PROVIDED 
    });
  }

  try {
    const decoded = verifyToken(token);
    
    // Obtener userId del token (puede estar en userId o _id)
    const userId = decoded.userId || decoded._id;
    
    if (!userId) {
      return res.status(HTTP_UNAUTHORIZED).json({ 
        message: ERROR_MESSAGES.TOKEN_INVALID 
      });
    }
    
    // Si el token tiene rol, usarlo; si no, obtenerlo de la BD
    let userRole = decoded.role;
    if (!userRole) {
      try {
        // Verificar que MongoDB esté conectado antes de hacer la query
        const mongoose = (await import('mongoose')).default;
        if (mongoose.connection.readyState !== 1) {
          // Si MongoDB no está conectado, usar rol por defecto
          logger.warn('MongoDB no conectado, usando rol por defecto', { userId });
          userRole = 'user';
        } else {
          // Importar User dinámicamente para evitar dependencias circulares
          const User = (await import('../models/User.js')).default;
          const user = await User.findById(userId).select('role').lean();
          userRole = user?.role || 'user';
        }
      } catch (dbError) {
        // Si hay error al consultar la BD, usar rol por defecto
        logger.warn('Error al obtener rol de usuario, usando rol por defecto', { 
          userId, 
          error: dbError.message 
        });
        userRole = 'user';
      }
    }
    
    // Asegurar que userId sea un string válido
    const userIdString = userId.toString();
    
    // Asignar ambos campos para compatibilidad
    req.user = { 
      _id: userIdString, 
      userId: userIdString,
      role: userRole
    };
    next();
  } catch (error) {
    return handleTokenError(error, res);
  }
}

/**
 * Middleware simplificado para validar token sin asignar req.user
 * Útil para rutas que solo necesitan verificar que el token es válido
 */
export const validateToken = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_UNAUTHORIZED).json({ 
        message: ERROR_MESSAGES.TOKEN_INVALID_FORMAT 
      });
    }

    const token = authHeader.split(' ')[1];
    verifyToken(token);
    next();
  } catch (error) {
    return handleTokenError(error, res);
  }
};

/**
 * Middleware para autorizar acceso basado en roles
 * @param {Array<string>} roles - Array de roles permitidos
 * @returns {Function} Middleware de autorización
 */
export const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_UNAUTHORIZED).json({ 
        message: ERROR_MESSAGES.USER_NOT_AUTHENTICATED 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(HTTP_FORBIDDEN).json({ 
        message: ERROR_MESSAGES.PERMISSION_DENIED,
        required: roles,
        current: req.user.role
      });
    }
    
    next();
  };
};

/**
 * Middleware para verificar propiedad de un recurso
 * Verifica que el usuario sea propietario del recurso antes de permitir el acceso
 * @param {Object} model - Modelo de Mongoose a verificar
 * @returns {Function} Middleware de verificación de propiedad
 */
export const verifyOwnership = (model) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(HTTP_UNAUTHORIZED).json({ 
          message: ERROR_MESSAGES.USER_NOT_AUTHENTICATED 
        });
      }

      const resource = await model.findById(req.params.id);
      
      if (!resource) {
        return res.status(HTTP_NOT_FOUND).json({ 
          message: ERROR_MESSAGES.RESOURCE_NOT_FOUND,
          resourceId: req.params.id
        });
      }
      
      // Verificar si el usuario es propietario del recurso
      const isOwner = resource.userId?.toString() === req.user.id?.toString();

      if (!isOwner) {
        return res.status(HTTP_FORBIDDEN).json({ 
          message: ERROR_MESSAGES.OWNERSHIP_DENIED,
          resourceId: req.params.id
        });
      }
      
      // Asignar el recurso a la request para uso posterior
      req.resource = resource;
      next();
    } catch (error) {
      console.error('[Auth] Error en verificación de propiedad:', error);
      res.status(HTTP_INTERNAL_SERVER_ERROR).json({ 
        message: ERROR_MESSAGES.OWNERSHIP_ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};