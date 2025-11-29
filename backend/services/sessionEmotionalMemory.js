/**
 * Memoria Emocional de Sesión
 * Mantiene un buffer de las últimas emociones detectadas en la sesión actual
 * para proporcionar contexto y detectar tendencias
 */
class SessionEmotionalMemory {
  constructor() {
    // Buffer por usuario (userId -> array de análisis emocionales)
    this.sessionBuffers = new Map();
    this.MAX_BUFFER_SIZE = 20; // Máximo de mensajes a recordar por sesión
  }

  /**
   * Agrega un análisis emocional al buffer de sesión
   * @param {string} userId - ID del usuario
   * @param {Object} emotionalAnalysis - Análisis emocional completo
   */
  addAnalysis(userId, emotionalAnalysis) {
    if (!userId || !emotionalAnalysis) {
      return;
    }

    if (!this.sessionBuffers.has(userId)) {
      this.sessionBuffers.set(userId, []);
    }

    const buffer = this.sessionBuffers.get(userId);
    
    // Agregar timestamp si no existe
    const analysisWithTimestamp = {
      ...emotionalAnalysis,
      timestamp: emotionalAnalysis.timestamp || new Date()
    };

    buffer.push(analysisWithTimestamp);

    // Mantener solo los últimos N análisis
    if (buffer.length > this.MAX_BUFFER_SIZE) {
      buffer.shift(); // Eliminar el más antiguo
    }
  }

  /**
   * Obtiene el buffer de análisis emocionales de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Array} Buffer de análisis emocionales
   */
  getBuffer(userId) {
    if (!userId) {
      return [];
    }

    return this.sessionBuffers.get(userId) || [];
  }

  /**
   * Analiza las tendencias emocionales en la sesión actual
   * @param {string} userId - ID del usuario
   * @returns {Object} Análisis de tendencias
   */
  analyzeTrends(userId) {
    const buffer = this.getBuffer(userId);
    
    if (buffer.length === 0) {
      return {
        streakNegative: 0,
        streakAnxiety: 0,
        streakSadness: 0,
        recentTopics: [],
        emotionalVolatility: 0,
        averageIntensity: 0,
        dominantEmotion: null,
        trend: 'stable'
      };
    }

    // Calcular streaks (racha de emociones consecutivas)
    let streakNegative = 0;
    let streakAnxiety = 0;
    let streakSadness = 0;
    
    for (let i = buffer.length - 1; i >= 0; i--) {
      const analysis = buffer[i];
      
      if (analysis.category === 'negative') {
        streakNegative++;
      } else {
        break;
      }
      
      if (analysis.mainEmotion === 'ansiedad') {
        streakAnxiety++;
      } else {
        break;
      }
      
      if (analysis.mainEmotion === 'tristeza') {
        streakSadness++;
      } else {
        break;
      }
    }

    // Obtener temas recientes
    const recentTopics = buffer
      .slice(-10) // Últimos 10 mensajes
      .map(a => a.topic || 'general')
      .filter(t => t !== 'general');

    // Calcular volatilidad emocional (cambios de emoción)
    let emotionalVolatility = 0;
    for (let i = 1; i < buffer.length; i++) {
      if (buffer[i].mainEmotion !== buffer[i - 1].mainEmotion) {
        emotionalVolatility++;
      }
    }
    emotionalVolatility = emotionalVolatility / buffer.length; // Normalizar

    // Calcular intensidad promedio
    const averageIntensity = buffer.reduce((sum, a) => sum + (a.intensity || 0), 0) / buffer.length;

    // Emoción dominante (más frecuente)
    const emotionCounts = {};
    buffer.forEach(a => {
      emotionCounts[a.mainEmotion] = (emotionCounts[a.mainEmotion] || 0) + 1;
    });
    const dominantEmotion = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Determinar tendencia general
    let trend = 'stable';
    if (buffer.length >= 3) {
      const recent = buffer.slice(-3);
      const intensities = recent.map(a => a.intensity || 0);
      const isIncreasing = intensities[0] < intensities[1] && intensities[1] < intensities[2];
      const isDecreasing = intensities[0] > intensities[1] && intensities[1] > intensities[2];
      
      if (isIncreasing && recent[2].category === 'negative') {
        trend = 'worsening';
      } else if (isDecreasing && recent[0].category === 'negative') {
        trend = 'improving';
      }
    }

    return {
      streakNegative,
      streakAnxiety,
      streakSadness,
      recentTopics: [...new Set(recentTopics)], // Únicos
      emotionalVolatility,
      averageIntensity,
      dominantEmotion,
      trend,
      messageCount: buffer.length
    };
  }

  /**
   * Limpia el buffer de un usuario (útil al cerrar sesión)
   * @param {string} userId - ID del usuario
   */
  clearBuffer(userId) {
    if (userId) {
      this.sessionBuffers.delete(userId);
    }
  }

  /**
   * Limpia todos los buffers (útil para limpieza periódica)
   */
  clearAllBuffers() {
    this.sessionBuffers.clear();
  }
}

export default new SessionEmotionalMemory();

