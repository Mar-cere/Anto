/**
 * Caché para Análisis Emocionales
 * 
 * Reduce la latencia cacheando análisis emocionales de mensajes similares
 * y evita recalcular análisis para contenido idéntico o muy similar
 */
class EmotionalAnalysisCache {
  constructor() {
    // Caché en memoria (Map)
    this.cache = new Map();
    
    // Configuración
    this.MAX_CACHE_SIZE = 1000; // Máximo de entradas en caché
    this.TTL = 60 * 60 * 1000; // 1 hora en milisegundos
    this.SIMILARITY_THRESHOLD = 0.85; // Umbral de similitud (0-1)
  }

  /**
   * Genera una clave de caché basada en el contenido
   * @param {string} content - Contenido del mensaje
   * @returns {string} Clave de caché
   */
  generateCacheKey(content) {
    if (!content || typeof content !== 'string') {
      return null;
    }

    // Normalizar contenido para la clave
    const normalized = content
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Normalizar espacios
      .substring(0, 200); // Limitar longitud

    // Hash simple (podría mejorarse con un hash más robusto)
    return this.simpleHash(normalized);
  }

  /**
   * Hash simple para generar clave
   * @param {string} str - String a hashear
   * @returns {string} Hash
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32 bits
    }
    return hash.toString(36);
  }

  /**
   * Obtiene un análisis del caché si existe y no ha expirado
   * @param {string} content - Contenido del mensaje
   * @returns {Object|null} Análisis cacheado o null
   */
  get(content) {
    const key = this.generateCacheKey(content);
    if (!key) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    // Verificar si ha expirado
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    // Retornar análisis (sin timestamp)
    const { timestamp, ...analysis } = cached;
    return analysis;
  }

  /**
   * Guarda un análisis en el caché
   * @param {string} content - Contenido del mensaje
   * @param {Object} analysis - Análisis emocional completo
   */
  set(content, analysis) {
    const key = this.generateCacheKey(content);
    if (!key || !analysis) return;

    // Limpiar caché si está lleno
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanup();
    }

    // Guardar con timestamp
    this.cache.set(key, {
      ...analysis,
      timestamp: Date.now()
    });
  }

  /**
   * Limpia entradas expiradas del caché
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.TTL) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    // Si aún está lleno, eliminar las más antiguas
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = sortedEntries.slice(0, Math.floor(this.MAX_CACHE_SIZE * 0.2)); // Eliminar 20% más antiguas
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Limpia todo el caché
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Obtiene estadísticas del caché
   * @returns {Object} Estadísticas
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    for (const value of this.cache.values()) {
      if (now - value.timestamp > this.TTL) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      hitRate: 0 // Se calcularía con tracking de hits/misses
    };
  }
}

export default new EmotionalAnalysisCache();

