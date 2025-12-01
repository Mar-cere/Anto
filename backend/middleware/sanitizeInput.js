/**
 * Middleware de Sanitización de Inputs
 * 
 * Sanitiza y valida los inputs del usuario para prevenir
 * inyecciones y otros ataques.
 * 
 * @author AntoApp Team
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitiza un string removiendo caracteres peligrosos
 * @param {string} input - Input a sanitizar
 * @param {Object} options - Opciones de sanitización
 * @returns {string} - String sanitizado
 */
export const sanitizeString = (input, options = {}) => {
  if (typeof input !== 'string') {
    return input;
  }

  const {
    allowHTML = false,
    maxLength = 10000,
    trim = true,
  } = options;

  let sanitized = input;

  // Trim si está habilitado
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Limitar longitud
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Si no se permite HTML, usar DOMPurify
  if (!allowHTML) {
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  } else {
    // Si se permite HTML, sanitizar pero mantener tags seguros
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: [],
    });
  }

  return sanitized;
};

/**
 * Sanitiza un objeto recursivamente
 * @param {Object} obj - Objeto a sanitizar
 * @param {Object} options - Opciones de sanitización
 * @returns {Object} - Objeto sanitizado
 */
export const sanitizeObject = (obj, options = {}) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj, options);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, options));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitizar la clave también
      const sanitizedKey = sanitizeString(key, { allowHTML: false, trim: true });
      sanitized[sanitizedKey] = sanitizeObject(value, options);
    }
    return sanitized;
  }

  return obj;
};

/**
 * Middleware de Express para sanitizar el body de las requests
 */
export const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body, {
      allowHTML: false,
      maxLength: 10000,
      trim: true,
    });
  }
  next();
};

/**
 * Middleware de Express para sanitizar los query parameters
 */
export const sanitizeQuery = (req, res, next) => {
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query, {
      allowHTML: false,
      maxLength: 500,
      trim: true,
    });
  }
  next();
};

/**
 * Middleware de Express para sanitizar los params
 */
export const sanitizeParams = (req, res, next) => {
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params, {
      allowHTML: false,
      maxLength: 200,
      trim: true,
    });
  }
  next();
};

/**
 * Middleware combinado que sanitiza body, query y params
 */
export const sanitizeAll = (req, res, next) => {
  sanitizeBody(req, res, () => {
    sanitizeQuery(req, res, () => {
      sanitizeParams(req, res, next);
    });
  });
};

export default {
  sanitizeString,
  sanitizeObject,
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeAll,
};

