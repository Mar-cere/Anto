/**
 * Servicio de Caché
 * 
 * Proporciona un sistema de caché con soporte para Redis (si está disponible)
 * y fallback a caché en memoria.
 * 
 * @author AntoApp Team
 */

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.redisClient = null;
    this.useRedis = false;
    this.defaultTTL = 3600; // 1 hora por defecto
    this.locks = new Map(); // Locks para evitar cache stampede
    
    // Intentar inicializar Redis si está disponible
    this.initializeRedis();
  }

  /**
   * Inicializa Redis si está disponible
   */
  async initializeRedis() {
    try {
      // Solo intentar cargar Redis si está disponible
      const redis = await import('redis').catch(() => null);
      if (!redis) {
        console.log('[CacheService] Redis no disponible, usando caché en memoria');
        return;
      }

      const redisUrl = process.env.REDIS_URL || process.env.REDISCLOUD_URL;
      if (!redisUrl) {
        console.log('[CacheService] REDIS_URL no configurada, usando caché en memoria');
        return;
      }

      this.redisClient = redis.createClient({
        url: redisUrl
      });

      this.redisClient.on('error', (err) => {
        console.error('[CacheService] Error de Redis:', err);
        this.useRedis = false;
      });

      this.redisClient.on('connect', () => {
        console.log('[CacheService] ✅ Conectado a Redis');
        this.useRedis = true;
      });

      await this.redisClient.connect();
    } catch (error) {
      console.warn('[CacheService] Redis no disponible, usando caché en memoria:', error.message);
      this.useRedis = false;
    }
  }

  /**
   * Genera una clave de caché
   * @param {string} prefix - Prefijo de la clave
   * @param {string|Object} key - Clave o objeto para generar clave
   * @returns {string} Clave de caché
   */
  generateKey(prefix, key) {
    if (typeof key === 'object') {
      const keyStr = JSON.stringify(key);
      return `${prefix}:${Buffer.from(keyStr).toString('base64')}`;
    }
    return `${prefix}:${key}`;
  }

  /**
   * Obtiene un valor del caché
   * @param {string} key - Clave del caché
   * @returns {Promise<any|null>} Valor en caché o null
   */
  async get(key) {
    try {
      if (this.useRedis && this.redisClient) {
        const value = await this.redisClient.get(key);
        if (value) {
          return JSON.parse(value);
        }
        return null;
      } else {
        // Usar caché en memoria
        const cached = this.memoryCache.get(key);
        if (cached && cached.expiresAt > Date.now()) {
          return cached.value;
        }
        // Eliminar si expiró
        if (cached) {
          this.memoryCache.delete(key);
        }
        return null;
      }
    } catch (error) {
      console.error('[CacheService] Error obteniendo del caché:', error);
      return null;
    }
  }

  /**
   * Guarda un valor en el caché
   * @param {string} key - Clave del caché
   * @param {any} value - Valor a guardar
   * @param {number} ttl - Tiempo de vida en segundos (opcional)
   * @returns {Promise<boolean>} True si se guardó exitosamente
   */
  async set(key, value, ttl = null) {
    try {
      const ttlSeconds = ttl || this.defaultTTL;
      
      if (this.useRedis && this.redisClient) {
        await this.redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
        return true;
      } else {
        // Usar caché en memoria
        this.memoryCache.set(key, {
          value,
          expiresAt: Date.now() + (ttlSeconds * 1000)
        });
        return true;
      }
    } catch (error) {
      console.error('[CacheService] Error guardando en caché:', error);
      return false;
    }
  }

  /**
   * Elimina un valor del caché
   * @param {string} key - Clave del caché
   * @returns {Promise<boolean>} True si se eliminó exitosamente
   */
  async delete(key) {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.del(key);
        return true;
      } else {
        this.memoryCache.delete(key);
        return true;
      }
    } catch (error) {
      console.error('[CacheService] Error eliminando del caché:', error);
      return false;
    }
  }

  /**
   * Elimina múltiples valores del caché por patrón
   * @param {string} pattern - Patrón de claves (ej: 'user:*')
   * @returns {Promise<number>} Número de claves eliminadas
   */
  async deletePattern(pattern) {
    try {
      if (this.useRedis && this.redisClient) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
        return keys.length;
      } else {
        // Para caché en memoria, buscar claves que coincidan
        let deleted = 0;
        const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
            deleted++;
          }
        }
        return deleted;
      }
    } catch (error) {
      console.error('[CacheService] Error eliminando patrón del caché:', error);
      return 0;
    }
  }

  /**
   * Limpia todo el caché
   * @returns {Promise<boolean>} True si se limpió exitosamente
   */
  async clear() {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.flushDb();
        return true;
      } else {
        this.memoryCache.clear();
        return true;
      }
    } catch (error) {
      console.error('[CacheService] Error limpiando caché:', error);
      return false;
    }
  }

  /**
   * Obtiene o establece un valor en caché (patrón común)
   * Con protección contra cache stampede usando locks
   * @param {string} key - Clave del caché
   * @param {Function} fetchFn - Función para obtener el valor si no está en caché
   * @param {number} ttl - Tiempo de vida en segundos (opcional)
   * @param {number} lockTimeout - Tiempo máximo de espera del lock en ms (default: 5000)
   * @returns {Promise<any>} Valor del caché o resultado de fetchFn
   */
  async getOrSet(key, fetchFn, ttl = null, lockTimeout = 5000) {
    // Intentar obtener del caché primero
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Verificar si hay un lock activo para esta clave
    const lockKey = `lock:${key}`;
    const lockPromise = this.locks.get(lockKey);
    
    if (lockPromise) {
      // Hay otro proceso obteniendo este valor, esperar a que termine
      try {
        // Esperar a que el lock termine (puede ser éxito o error)
        await Promise.race([
          lockPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Lock timeout')), lockTimeout)
          )
        ]);
        
        // Después de que termine, intentar obtener del caché nuevamente
        const cachedAfterLock = await this.get(key);
        if (cachedAfterLock !== null) {
          return cachedAfterLock;
        }
        
        // Si no hay caché después del lock, el lock falló
        // Continuar con la obtención normal (reintentar)
      } catch (error) {
        // Si el lock falló o hubo timeout, verificar si hay caché antes de reintentar
        const cachedAfterError = await this.get(key);
        if (cachedAfterError !== null) {
          return cachedAfterError;
        }
        
        // Si es timeout y no hay caché, continuar con la obtención normal
        if (error.message === 'Lock timeout') {
          console.warn(`[CacheService] Timeout esperando lock para ${key}, reintentando...`);
        } else {
          // Si el error es del fetchFn, relanzarlo
          throw error;
        }
      }
    }

    // Crear un nuevo lock para esta clave
    const lock = (async () => {
      try {
        const value = await fetchFn();
        await this.set(key, value, ttl);
        return value;
      } catch (error) {
        // Si hay error, no guardar en caché pero propagar el error
        // El lock se eliminará en el finally
        throw error;
      } finally {
        // Liberar el lock siempre, incluso si hay error
        this.locks.delete(lockKey);
      }
    })();

    // Guardar el lock
    this.locks.set(lockKey, lock);

    try {
      const value = await lock;
      return value;
    } catch (error) {
      // Si hay error, el lock ya se eliminó en el finally
      // Relanzar el error para que el llamador lo maneje
      throw error;
    }
  }

  /**
   * Invalida el caché de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<number>} Número de claves eliminadas
   */
  async invalidateUserCache(userId) {
    const patterns = [
      `user:${userId}:*`,
      `profile:${userId}:*`,
      `subscription:${userId}:*`,
      `stats:${userId}:*`
    ];

    let totalDeleted = 0;
    for (const pattern of patterns) {
      const deleted = await this.deletePattern(pattern);
      totalDeleted += deleted;
    }

    return totalDeleted;
  }

  /**
   * Limpia entradas expiradas del caché en memoria
   * (Solo necesario para caché en memoria, Redis maneja esto automáticamente)
   */
  cleanExpired() {
    if (this.useRedis) {
      return; // Redis maneja la expiración automáticamente
    }

    const now = Date.now();
    for (const [key, cached] of this.memoryCache.entries()) {
      if (cached.expiresAt <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Obtiene estadísticas del caché
   * @returns {Promise<Object>} Estadísticas del caché
   */
  async getStats() {
    if (this.useRedis && this.redisClient) {
      try {
        const info = await this.redisClient.info('stats');
        const keys = await this.redisClient.dbSize();
        return {
          type: 'redis',
          keys,
          info
        };
      } catch (error) {
        return {
          type: 'redis',
          error: error.message
        };
      }
    } else {
      return {
        type: 'memory',
        keys: this.memoryCache.size,
        maxSize: 'unlimited'
      };
    }
  }
}

// Inicializar limpieza periódica de entradas expiradas (solo para memoria)
const cacheService = new CacheService();

// Limpiar entradas expiradas cada 5 minutos
if (!cacheService.useRedis) {
  setInterval(() => {
    cacheService.cleanExpired();
  }, 5 * 60 * 1000);
}

export default cacheService;

