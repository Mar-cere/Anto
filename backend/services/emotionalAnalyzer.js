/**
 * Analizador Emocional - Detecta emociones principales y secundarias en mensajes del usuario
 */
class EmotionalAnalyzer {
  constructor() {
    // Constantes de configuración
    this.INTENSITY_MIN = 1;
    this.INTENSITY_MAX = 10;
    this.INTENSITY_DEFAULT = 4;
    this.INTENSITY_NEUTRAL = 5;
    this.INTENSITY_THRESHOLD_ATTENTION = 7;
    this.INTENSITY_ADJUSTMENT = 2;
    this.INTENSITY_TREND_ADJUSTMENT = 1;
    this.INTENSITY_TREND_THRESHOLD = 2;
    this.CONFIDENCE_DEFAULT = 0.4;
    this.CONFIDENCE_MATCH = 0.8;
    this.CONFIDENCE_CONTEXTUAL = 0.1;
    this.CONFIDENCE_MAX = 1;
    this.WORD_COUNT_THRESHOLD = 20;
    this.HISTORY_WINDOW_SIZE = 3;
    this.EMOTION_NEUTRAL = 'neutral';
    this.CATEGORY_NEUTRAL = 'neutral';
    this.CATEGORY_NEGATIVE = 'negative';
    this.TREND_INCREASING = 'increasing';
    this.TREND_DECREASING = 'decreasing';
    this.TREND_STABLE = 'stable';
    
    // Patrones de detección emocional
    this.emotionPatterns = {
      tristeza: {
        patterns: /(?:triste(?:za)?|deprimi(?:do|da)|sin energía|desánimo|desmotiva(?:do|da)|solo|soledad|melancolía|nostalgia)/i,
        intensity: 7,
        category: 'negative'
      },
      ansiedad: {
        patterns: /(?:ansie(?:dad|oso)|nervios|inquiet(?:o|ud)|preocupa(?:do|ción)|angustia|miedo|pánico|estresado)/i,
        intensity: 6,
        category: 'negative'
      },
      enojo: {
        patterns: /(?:enoja(?:do|da)|ira|rabia|molest(?:o|a)|frustrad(?:o|a)|impotencia|indignación|resentimiento)/i,
        intensity: 8,
        category: 'negative'
      },
      alegria: {
        patterns: /(?:feliz|contento|alegr(?:e|ía)|satisfech(?:o|a)|motivad(?:o|a)|entusiasm(?:o|ado)|euforia|júbilo)/i,
        intensity: 7,
        category: 'positive'
      },
      neutral: {
        patterns: /(?:normal|tranquil(?:o|a)|bien|regular|más o menos|asi asi|equilibrado|estable)/i,
        intensity: this.INTENSITY_DEFAULT,
        category: this.CATEGORY_NEUTRAL
      }
    };
    
    // Patrones de modificación de intensidad
    this.intensifiersPattern = /(?:muy|mucho|demasiado|extremadamente|totalmente|absolutamente)/i;
    this.diminishersPattern = /(?:poco|algo|ligeramente|un poco|apenas)/i;
    this.contextualCluesPattern = /(?:me siento|estoy|siento que|creo que)/i;
  }
  
  // Helper: validar que el contenido es un string válido
  isValidString(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }
  
  // Helper: obtener emoción neutral por defecto
  getNeutralEmotion() {
    return {
      name: this.EMOTION_NEUTRAL,
      category: this.CATEGORY_NEUTRAL,
      baseIntensity: this.INTENSITY_DEFAULT
    };
  }
  
  // Helper: limitar intensidad dentro del rango válido
  clampIntensity(intensity) {
    return Math.max(this.INTENSITY_MIN, Math.min(intensity, this.INTENSITY_MAX));
  }

  /**
   * Analiza la emoción principal y secundaria de un mensaje
   * @param {string} content - Contenido del mensaje
   * @param {Array} previousPatterns - Historial de análisis previos (opcional)
   * @returns {Promise<Object>} Análisis emocional con emoción principal, intensidad, categoría, emociones secundarias, confianza y si requiere atención
   */
  async analyzeEmotion(content, previousPatterns = []) {
    if (!this.isValidString(content)) {
      console.warn('[EmotionalAnalyzer] Contenido inválido recibido en analyzeEmotion:', content);
      return this.getDefaultAnalysis();
    }

    try {
      const contentLower = content.toLowerCase();
      let detectedEmotion = this.detectPrimaryEmotion(contentLower);
      let intensity = this.calculateIntensity(contentLower, detectedEmotion);
      let secondaryEmotions = this.detectSecondaryEmotions(contentLower, detectedEmotion.name);

      // Ajustar basado en patrones previos si existen
      if (previousPatterns && Array.isArray(previousPatterns) && previousPatterns.length > 0) {
        const adjustedAnalysis = this.adjustBasedOnHistory(
          detectedEmotion,
          intensity,
          previousPatterns
        );
        detectedEmotion = adjustedAnalysis.emotion;
        intensity = adjustedAnalysis.intensity;
      }

      return {
        mainEmotion: detectedEmotion.name,
        intensity,
        category: detectedEmotion.category,
        secondary: secondaryEmotions,
        confidence: this.calculateConfidence(contentLower, detectedEmotion),
        requiresAttention: this.checkIfRequiresAttention(detectedEmotion, intensity)
      };
    } catch (error) {
      console.error('[EmotionalAnalyzer] Error en análisis emocional:', error, content);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Detecta la emoción principal en el contenido
   * @param {string} content - Contenido en minúsculas
   * @returns {Object} Emoción detectada con nombre, categoría e intensidad base
   */
  detectPrimaryEmotion(content) {
    if (!this.isValidString(content)) {
      return this.getNeutralEmotion();
    }
    
    for (const [emotion, data] of Object.entries(this.emotionPatterns)) {
      if (data.patterns.test(content)) {
        return {
          name: emotion,
          category: data.category,
          baseIntensity: data.intensity
        };
      }
    }
    
    return this.getNeutralEmotion();
  }

  /**
   * Calcula la intensidad emocional ajustada según modificadores en el contenido
   * @param {string} content - Contenido del mensaje
   * @param {Object} emotion - Emoción detectada
   * @returns {number} Intensidad ajustada (1-10)
   */
  calculateIntensity(content, emotion) {
    if (!this.isValidString(content) || !emotion) {
      return this.INTENSITY_DEFAULT;
    }
    
    let intensity = emotion.baseIntensity;
    
    // Ajustar según intensificadores o atenuadores
    if (this.intensifiersPattern.test(content)) {
      intensity = this.clampIntensity(intensity + this.INTENSITY_ADJUSTMENT);
    } else if (this.diminishersPattern.test(content)) {
      intensity = this.clampIntensity(intensity - this.INTENSITY_ADJUSTMENT);
    }
    
    // Ajustar según longitud del mensaje (mensajes largos pueden indicar mayor intensidad)
    const wordCount = content.split(' ').length;
    if (wordCount > this.WORD_COUNT_THRESHOLD) {
      intensity = this.clampIntensity(intensity + 1);
    }
    
    return intensity;
  }

  /**
   * Detecta emociones secundarias en el contenido (diferentes a la principal)
   * @param {string} content - Contenido del mensaje
   * @param {string} primaryEmotion - Emoción principal detectada
   * @returns {Array} Emociones secundarias detectadas
   */
  detectSecondaryEmotions(content, primaryEmotion) {
    const secondaryEmotions = [];
    
    if (!this.isValidString(content)) {
      return secondaryEmotions;
    }
    
    for (const [emotion, data] of Object.entries(this.emotionPatterns)) {
      if (emotion !== primaryEmotion && data.patterns.test(content)) {
        secondaryEmotions.push(emotion);
      }
    }
    
    return secondaryEmotions;
  }

  /**
   * Calcula la confianza del análisis emocional basado en coincidencia y pistas contextuales
   * @param {string} content - Contenido del mensaje
   * @param {Object} emotion - Emoción detectada
   * @returns {number} Confianza (0-1)
   */
  calculateConfidence(content, emotion) {
    if (!emotion || !this.isValidString(content)) {
      return this.CONFIDENCE_DEFAULT;
    }
    
    const matchStrength = emotion.patterns?.test(content) 
      ? this.CONFIDENCE_MATCH 
      : this.CONFIDENCE_DEFAULT;
    const contextualClues = this.hasContextualClues(content) 
      ? this.CONFIDENCE_CONTEXTUAL 
      : 0;
    
    return Math.min(matchStrength + contextualClues, this.CONFIDENCE_MAX);
  }

  /**
   * Verifica si el contenido tiene pistas contextuales de emoción (expresiones de sentimiento)
   * @param {string} content - Contenido del mensaje
   * @returns {boolean} True si contiene pistas contextuales
   */
  hasContextualClues(content) {
    if (!this.isValidString(content)) {
      return false;
    }
    return this.contextualCluesPattern.test(content);
  }

  /**
   * Determina si la emoción requiere atención especial (emociones negativas con alta intensidad)
   * @param {Object} emotion - Emoción detectada
   * @param {number} intensity - Intensidad emocional
   * @returns {boolean} True si requiere atención especial
   */
  checkIfRequiresAttention(emotion, intensity) {
    if (!emotion) {
      return false;
    }
    return emotion.category === this.CATEGORY_NEGATIVE && 
           intensity >= this.INTENSITY_THRESHOLD_ATTENTION;
  }

  /**
   * Ajusta el análisis emocional basado en el historial previo
   * @param {Object} currentEmotion - Emoción actual
   * @param {number} currentIntensity - Intensidad actual
   * @param {Array} previousPatterns - Historial previo
   * @returns {Object} Análisis ajustado con emoción e intensidad
   */
  adjustBasedOnHistory(currentEmotion, currentIntensity, previousPatterns) {
    if (!Array.isArray(previousPatterns) || !previousPatterns.length) {
      return { emotion: currentEmotion, intensity: currentIntensity };
    }
    
    const recentPatterns = previousPatterns.slice(-this.HISTORY_WINDOW_SIZE);
    const emotionalTrend = this.analyzeEmotionalTrend(recentPatterns);
    
    return {
      emotion: currentEmotion,
      intensity: this.adjustIntensityBasedOnTrend(currentIntensity, emotionalTrend)
    };
  }

  /**
   * Analiza la tendencia emocional en el historial (aumentando, disminuyendo o estable)
   * @param {Array} patterns - Historial de análisis
   * @returns {string} Tendencia ('increasing', 'decreasing', 'stable')
   */
  analyzeEmotionalTrend(patterns) {
    if (!Array.isArray(patterns) || !patterns.length) {
      return this.TREND_STABLE;
    }
    
    const intensities = patterns.map(p => p.intensity);
    const average = intensities.reduce((a, b) => a + b, 0) / intensities.length;
    const lastIntensity = intensities[intensities.length - 1];
    
    if (lastIntensity > average + this.INTENSITY_TREND_THRESHOLD) {
      return this.TREND_INCREASING;
    }
    if (lastIntensity < average - this.INTENSITY_TREND_THRESHOLD) {
      return this.TREND_DECREASING;
    }
    
    return this.TREND_STABLE;
  }

  /**
   * Ajusta la intensidad emocional según la tendencia detectada en el historial
   * @param {number} intensity - Intensidad actual
   * @param {string} trend - Tendencia emocional ('increasing', 'decreasing', 'stable')
   * @returns {number} Intensidad ajustada (1-10)
   */
  adjustIntensityBasedOnTrend(intensity, trend) {
    switch (trend) {
      case this.TREND_INCREASING:
        return this.clampIntensity(intensity + this.INTENSITY_TREND_ADJUSTMENT);
      case this.TREND_DECREASING:
        return this.clampIntensity(intensity - this.INTENSITY_TREND_ADJUSTMENT);
      default:
        return intensity;
    }
  }

  /**
   * Devuelve un análisis emocional por defecto cuando no se puede analizar el mensaje
   * @returns {Object} Análisis por defecto con valores seguros
   */
  getDefaultAnalysis() {
    return {
      mainEmotion: this.EMOTION_NEUTRAL,
      intensity: this.INTENSITY_NEUTRAL,
      category: this.CATEGORY_NEUTRAL,
      secondary: [],
      confidence: this.CONFIDENCE_DEFAULT,
      requiresAttention: false
    };
  }
}

export default new EmotionalAnalyzer(); 