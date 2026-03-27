/**
 * Middleware de Performance
 * 
 * Mide tiempos de respuesta y proporciona métricas de performance
 * 
 * @author AntoApp Team
 */

import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import { performance } from 'node:perf_hooks';

/**
 * Middleware para medir tiempo de respuesta de requests
 */
export const performanceMiddleware = (req, res, next) => {
  const startTime = performance.now();
  const startMem = process.memoryUsage();

  // Umbrales más realistas para evitar "ruido" en endpoints que dependen de IA/red.
  // (Los logs actuales saltan con duration > 1000ms o heap delta > 10MB.)
  const getThresholdsForPath = () => {
    const path = req.path || '';
    // Chat suele ser más lento por llamadas externas y generación de texto.
    if (path.startsWith('/api/chat/messages')) {
      return { durationMs: 4000, memoryDeltaMb: 25 };
    }
    return { durationMs: 2000, memoryDeltaMb: 20 };
  };

  // Para poder setear headers en desarrollo, necesitamos hacerlo ANTES de que se envíen.
  // Express/Node suelen enviar headers cuando se llama a res.end().
  const originalEnd = res.end;
  res.end = function patchedEnd(...args) {
    try {
      const duration = performance.now() - startTime;
      const endMem = process.memoryUsage();
      const heapDeltaMb = (endMem.heapUsed - startMem.heapUsed) / 1024 / 1024;

      if (process.env.NODE_ENV === 'development') {
        // Estos headers son best-effort; si algo ya los envió, no hacemos nada.
        if (!res.headersSent) {
          res.setHeader('X-Response-Time', `${Math.round(duration)}ms`);
          res.setHeader('X-Memory-Heap-Delta', `${heapDeltaMb.toFixed(2)}MB`);
        }
      }
    } catch {
      // No queremos que la instrumentación rompa la respuesta.
    }
    return originalEnd.apply(this, args);
  };

  // Agregar listener para cuando termine la respuesta (solo logging; aquí ya no tocamos headers)
  res.on('finish', () => {
    const duration = performance.now() - startTime;
    const endMem = process.memoryUsage();
    const heapDeltaMb = (endMem.heapUsed - startMem.heapUsed) / 1024 / 1024;

    const { durationMs, memoryDeltaMb } = getThresholdsForPath();

    // Nota: el delta de heap no es una métrica "por request" perfecta (GC/concurrencia),
    // lo dejamos como señal, y agregamos memoria absoluta para diagnóstico.
    if (duration > durationMs || heapDeltaMb > memoryDeltaMb) {
      logger.warn('Request lento o uso alto de memoria', {
        method: req.method,
        path: req.path,
        duration: `${Math.round(duration)}ms`,
        heapDelta: `${heapDeltaMb.toFixed(2)}MB`,
        heapUsed: `${(endMem.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        rss: `${(endMem.rss / 1024 / 1024).toFixed(2)}MB`,
        statusCode: res.statusCode,
        userId: req.user?._id || req.user?.userId
      });
    }

    if (process.env.NODE_ENV === 'production') {
      logger.http('Request completada', {
        method: req.method,
        path: req.path,
        duration: `${Math.round(duration)}ms`,
        statusCode: res.statusCode,
        heapDelta: `${heapDeltaMb.toFixed(2)}MB`
      });
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
    // IMPORTANTE: no parchear mongoose por request (genera overhead y puede degradar performance).
    // Aplicamos el patch una sola vez por proceso.
    if (process.env.NODE_ENV !== 'production') {
      patchMongooseSlowQueryLogger(threshold);
    }

    next();
  };
};

let mongooseExecPatched = false;
let slowQueryThresholdMs = 1000;

function patchMongooseSlowQueryLogger(threshold) {
  slowQueryThresholdMs = threshold;
  if (mongooseExecPatched) return;
  mongooseExecPatched = true;

  const originalExec = mongoose.Query.prototype.exec;

  mongoose.Query.prototype.exec = function patchedExec(...args) {
    const start = performance.now();
    const result = originalExec.apply(this, args);

    // Mongoose exec devuelve entoncesable/Promise
    if (result && typeof result.then === 'function') {
      return result.then(
        (data) => {
          const duration = performance.now() - start;
          if (duration > slowQueryThresholdMs) {
            logger.warn('Query lenta detectada', {
              duration: `${Math.round(duration)}ms`,
              model: this.model?.modelName,
              op: this.op
            });
          }
          return data;
        },
        (err) => {
          // Igual registramos duración en caso de error, por si hay timeouts/retries.
          const duration = performance.now() - start;
          if (duration > slowQueryThresholdMs) {
            logger.warn('Query lenta con error', {
              duration: `${Math.round(duration)}ms`,
              model: this.model?.modelName,
              op: this.op
            });
          }
          throw err;
        }
      );
    }

    return result;
  };
}

export default {
  performanceMiddleware,
  logSlowQueries
};

