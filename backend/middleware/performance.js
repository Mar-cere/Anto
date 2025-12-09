/**
 * Middleware de Performance
 * 
 * Mide tiempos de respuesta y proporciona métricas de performance
 * 
 * @author AntoApp Team
 */

import logger from '../utils/logger.js';

/**
 * Middleware para medir tiempo de respuesta de requests
 */
export const performanceMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  // Agregar listener para cuando termine la respuesta
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage().heapUsed;
    const memoryUsed = (endMemory - startMemory) / 1024 / 1024; // MB

    // Log solo si es lento o usa mucha memoria
    if (duration > 1000 || memoryUsed > 10) {
      logger.warn('Request lento o uso alto de memoria', {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        memoryUsed: `${memoryUsed.toFixed(2)}MB`,
        statusCode: res.statusCode,
        userId: req.user?._id || req.user?.userId
      });
    }

    // En producción, log todas las requests para análisis
    if (process.env.NODE_ENV === 'production') {
      logger.http('Request completada', {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
        memoryUsed: `${memoryUsed.toFixed(2)}MB`
      });
    }

    // Agregar headers de performance (opcional, para debugging)
    if (process.env.NODE_ENV === 'development') {
      res.setHeader('X-Response-Time', `${duration}ms`);
      res.setHeader('X-Memory-Used', `${memoryUsed.toFixed(2)}MB`);
    }
  });

  next();
};

/**
 * Middleware para detectar queries lentas de MongoDB
 * (Se puede usar con mongoose.set('debug', true) en desarrollo)
 */
export const logSlowQueries = (threshold = 1000) => {
  return (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
      // En desarrollo, log todas las queries lentas
      const mongoose = require('mongoose');
      const originalExec = mongoose.Query.prototype.exec;

      mongoose.Query.prototype.exec = function(...args) {
        const startTime = Date.now();
        const result = originalExec.apply(this, args);

        if (result && typeof result.then === 'function') {
          return result.then(data => {
            const duration = Date.now() - startTime;
            if (duration > threshold) {
              logger.warn('Query lenta detectada', {
                duration: `${duration}ms`,
                model: this.model?.modelName,
                op: this.op,
                path: req.path
              });
            }
            return data;
          });
        }

        return result;
      };
    }

    next();
  };
};

export default {
  performanceMiddleware,
  logSlowQueries
};

