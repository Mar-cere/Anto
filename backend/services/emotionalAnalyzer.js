/**
 * Analizador Emocional - Detecta emociones principales y secundarias en mensajes del usuario
 * 
 * Mejoras implementadas:
 * - 9 emociones detectadas: tristeza, ansiedad, enojo, alegria, miedo, verguenza, culpa, esperanza, neutral
 * - Patrones expandidos con sinónimos, variantes y expresiones coloquiales
 * - Detección de expresiones negativas indirectas ("no me siento bien", "no puedo más")
 * - Intensificadores y atenuadores ampliados para mejor precisión
 * - Pistas contextuales mejoradas para detectar expresiones de sentimiento
 * - Lógica inteligente para inferir emociones cuando no se mencionan explícitamente
 * 
 * Mejoras avanzadas:
 * - Detección de emojis emocionales (😢, 😊, 😠, etc.) con alta confianza
 * - Detección de negación emocional explícita ("no estoy triste" puede indicar que sí lo está)
 * - Detección de preguntas retóricas ("¿por qué siempre me pasa esto?")
 * - Detección de comparaciones temporales ("me siento mejor que ayer", "estoy peor")
 * - Ajuste de intensidad por repetición de palabras ("muy muy triste")
 * - Ajuste de intensidad por signos de puntuación múltiples ("!!!" o "???")
 * - Ajuste de intensidad por mayúsculas ("ESTOY MUY ENOJADO")
 * - Cálculo de confianza mejorado considerando múltiples factores
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
        patterns: /(?:triste(?:za)?|deprimi(?:do|da|r)|sin energía|desánimo|desmotiva(?:do|da|r)|solo|soledad|melancolía|nostalgia|abatid(?:o|a)|desesperanzad(?:o|a)|desconsolad(?:o|a)|llor(?:o|ar|ando)|llanto|vacío|vacío interior|sin ganas|sin ánimo|desgana|apático|apatía|hundid(?:o|a)|caíd(?:o|a)|desilusionad(?:o|a)|desencantad(?:o|a)|no.*tengo.*ganas|no.*me.*motiva|me.*siento.*mal|no.*me.*siento.*bien|estoy.*mal|me.*va.*mal)/i,
        intensity: 7,
        category: 'negative'
      },
      ansiedad: {
        patterns: /(?:ansie(?:dad|oso|ado)|nervios|inquiet(?:o|ud|o)|preocupa(?:do|da|ción|r|rme|rse)|angustia|miedo|pánico|estresad(?:o|a)|agobiad(?:o|a)|abrumad(?:o|a)|sobrecargad(?:o|a)|tens(?:o|a|ión)|intranquil(?:o|a)|agitad(?:o|a)|alterad(?:o|a)|asustad(?:o|a)|atemorizad(?:o|a)|preocupad(?:o|a)|nervios(?:o|a|ismo)|ataque.*de.*pánico|me.*preocupa|me.*da.*miedo|me.*asusta|me.*inquieta|me.*agobia|me.*abruma|no.*puedo.*relajarme|no.*puedo.*tranquilizarme|me.*siento.*nervios(?:o|a)|estoy.*nervios(?:o|a)|me.*siento.*ansios(?:o|a)|estoy.*ansios(?:o|a))/i,
        intensity: 6,
        category: 'negative'
      },
      enojo: {
        patterns: /(?:enoja(?:do|da|r|rme)|ira|rabia|molest(?:o|a|ia|arme)|frustrad(?:o|a|r|rme)|impotencia|indignación|resentimiento|irritad(?:o|a)|furios(?:o|a)|coléric(?:o|a)|exasperad(?:o|a)|hart(?:o|a)|cansad(?:o|a).*de|fastid(?:o|a|iado|iarme)|disgustad(?:o|a)|ofendid(?:o|a)|traicionad(?:o|a)|decepcionad(?:o|a)|me.*molesta|me.*enoja|me.*irrita|me.*frustra|me.*indigna|estoy.*hart(?:o|a)|estoy.*furios(?:o|a)|me.*siento.*traicionad(?:o|a)|me.*siento.*ofendid(?:o|a)|no.*aguanto|no.*soporto|me.*tiene.*hart(?:o|a))/i,
        intensity: 8,
        category: 'negative'
      },
      alegria: {
        patterns: /(?:feliz|content(?:o|a)|alegr(?:e|ía|arme)|satisfech(?:o|a)|motivad(?:o|a)|entusiasm(?:o|ado|arme)|euforia|júbilo|optimista|esperanzad(?:o|a)|ilusionad(?:o|a)|emocionad(?:o|a)|eufóric(?:o|a)|radiante|brillante|genial|fantástic(?:o|a)|maravillos(?:o|a)|increíble|excelente|perfect(?:o|a)|me.*siento.*bien|estoy.*bien|me.*va.*bien|todo.*va.*bien|me.*alegra|me.*encanta|me.*gusta|me.*emociona|estoy.*content(?:o|a)|estoy.*feliz|me.*siento.*feliz|me.*siento.*content(?:o|a)|me.*siento.*genial|estoy.*genial)/i,
        intensity: 7,
        category: 'positive'
      },
      miedo: {
        patterns: /(?:miedo|temor|terror|pavor|pánico|susto|sust(?:o|ado)|atemorizad(?:o|a)|asustad(?:o|a)|aterrad(?:o|a)|aterrorizad(?:o|a)|intimidad(?:o|a)|me.*da.*miedo|me.*asusta|me.*aterroriza|tengo.*miedo|siento.*miedo|me.*siento.*asustad(?:o|a)|estoy.*asustad(?:o|a)|me.*siento.*aterrad(?:o|a)|estoy.*aterrad(?:o|a)|tengo.*terror|siento.*terror|me.*aterroriza|me.*intimida)/i,
        intensity: 7,
        category: 'negative'
      },
      verguenza: {
        patterns: /(?:vergüenza|vergonz(?:o|a|oso)|avergonzad(?:o|a)|humillad(?:o|a)|humillación|pena|apenad(?:o|a)|me.*da.*vergüenza|me.*avergüenza|me.*siento.*avergonzad(?:o|a)|estoy.*avergonzad(?:o|a)|me.*siento.*humillad(?:o|a)|estoy.*humillad(?:o|a)|me.*da.*pena|tengo.*vergüenza|siento.*vergüenza)/i,
        intensity: 6,
        category: 'negative'
      },
      culpa: {
        patterns: /(?:culpa|culpable|culpabilid(?:ad|zarme)|responsable.*de|me.*siento.*culpable|estoy.*culpable|tengo.*culpa|siento.*culpa|me.*culpo|me.*echo.*la.*culpa|es.*mi.*culpa|fue.*mi.*culpa|la.*culpa.*es.*mía|me.*siento.*responsable)/i,
        intensity: 6,
        category: 'negative'
      },
      esperanza: {
        patterns: /(?:esperanza|esperanzad(?:o|a)|optimista|optimismo|confianza|confiad(?:o|a)|ilusionad(?:o|a)|tengo.*esperanza|siento.*esperanza|me.*siento.*esperanzad(?:o|a)|estoy.*esperanzad(?:o|a)|tengo.*fe|tengo.*confianza|me.*siento.*optimista|estoy.*optimista|veo.*luz|hay.*esperanza|me.*ilusiona)/i,
        intensity: 6,
        category: 'positive'
      },
      neutral: {
        patterns: /(?:normal|tranquil(?:o|a)|bien|regular|más o menos|asi asi|equilibrad(?:o|a)|estable|ok|okay|bien.*y.*mal|ni.*bien.*ni.*mal|ni.*feliz.*ni.*triste|estoy.*normal|me.*siento.*normal|estoy.*tranquil(?:o|a)|me.*siento.*tranquil(?:o|a)|todo.*normal|todo.*bien|todo.*regular|está.*bien|está.*ok)/i,
        intensity: this.INTENSITY_DEFAULT,
        category: this.CATEGORY_NEUTRAL
      }
    };
    
    // Patrones de modificación de intensidad
    this.intensifiersPattern = /(?:muy|mucho|demasiado|extremadamente|totalmente|absolutamente|completamente|realmente|súper|super|hiper|increíblemente|terriblemente|horriblemente|sumamente|profundamente|intensamente|realmente.*muy|muy.*muy|muchísimo|bastante|súper.*muy|extremadamente.*muy)/i;
    this.diminishersPattern = /(?:poco|algo|ligeramente|un poco|apenas|levemente|ligeramente|medianamente|moderadamente|relativamente|bastante.*poco|no.*mucho|no.*tan|no.*muy|no.*demasiado|un.*poco.*solo|solo.*un.*poco)/i;
    this.contextualCluesPattern = /(?:me siento|estoy|siento que|creo que|pienso que|me parece que|siento como|me.*siento|estoy.*sintiendo|me.*estoy.*sintiendo|siento.*como.*si|me.*parece|me.*da.*la.*sensación|tengo.*la.*sensación|me.*hace.*sentir|me.*hace.*estar|me.*provoca|me.*genera|me.*causa|me.*produce)/i;
    
    // Patrones de negación emocional (indican emoción negativa aunque no se mencione directamente)
    this.negativeIndicatorsPattern = /(?:no.*me.*siento.*bien|no.*estoy.*bien|no.*me.*va.*bien|no.*puedo|no.*puedo.*más|no.*aguanto|no.*soporto|no.*tengo.*ganas|no.*me.*motiva|no.*me.*gusta|no.*me.*agrada|no.*me.*sirve|no.*funciona|no.*sale.*bien|nada.*funciona|todo.*sale.*mal|nada.*me.*sale.*bien|todo.*me.*sale.*mal|nunca.*funciona|siempre.*sale.*mal)/i;
    
    // Patrones de negación emocional explícita (cuando se niega una emoción, puede indicar que sí la siente)
    this.denialPattern = /(?:no.*estoy.*triste|no.*me.*siento.*triste|no.*estoy.*deprimid(?:o|a)|no.*estoy.*ansios(?:o|a)|no.*me.*siento.*ansios(?:o|a)|no.*estoy.*enojad(?:o|a)|no.*me.*siento.*enojad(?:o|a)|no.*tengo.*miedo|no.*me.*da.*miedo|no.*estoy.*preocupad(?:o|a)|no.*me.*preocupa)/i;
    
    // Patrones de comparación temporal (mejor/peor que antes)
    this.temporalComparisonPattern = /(?:mejor.*que|peor.*que|igual.*que|más.*que|menos.*que|antes.*estaba|ahora.*estoy|antes.*me.*sentía|ahora.*me.*siento|me.*siento.*mejor|me.*siento.*peor|estoy.*mejor|estoy.*peor)/i;
    
    // Patrones de preguntas retóricas (indican frustración o preocupación)
    this.rhetoricalQuestionPattern = /(?:por.*qué.*siempre|por.*qué.*nunca|por.*qué.*a.*mí|qué.*hice.*yo|qué.*hice.*mal|por.*qué.*me.*pasa|por.*qué.*a.*mí.*siempre|qué.*tengo.*que.*hacer|qué.*puedo.*hacer|qué.*debo.*hacer|por.*qué.*todo|por.*qué.*nada)/i;
    
    // Emojis emocionales comunes
    this.emojiPatterns = {
      tristeza: /[😢😭😔😞😟😕🙁☹️😣😖😫😩💔]/,
      ansiedad: /[😰😨😱😳😓😥😟😦😧]/,
      enojo: /[😠😡🤬😤💢]/,
      alegria: /[😊😄😃😁😆😅😂🤣😇🙂😉😋😍🥰😘😗😙😚]/,
      miedo: /[😨😰😱😳😟😦😧]/,
      verguenza: /[😳😖😣😓😥]/,
      culpa: /[😔😞😟😕🙁]/,
      esperanza: /[😊🙂😇😌]/,
      neutral: /[😐😑😶😏]/
    };
    
    // Patrones de repetición (indican mayor intensidad)
    this.repetitionPattern = /(?:muy.*muy|mucho.*mucho|demasiado.*demasiado|super.*super|extremadamente.*extremadamente)/i;
    
    // Patrones de signos de puntuación múltiples (indican intensidad)
    this.exclamationPattern = /!{2,}/;
    this.questionPattern = /\?{2,}/;
    
    // Patrones de mayúsculas (indican intensidad o urgencia)
    this.allCapsPattern = /^[A-ZÁÉÍÓÚÑ\s]{10,}$/;
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
   * Detecta emojis en el contenido y retorna la emoción asociada
   * @param {string} content - Contenido del mensaje
   * @returns {string|null} Nombre de la emoción detectada por emoji o null
   */
  detectEmotionFromEmojis(content) {
    if (!this.isValidString(content)) {
      return null;
    }
    
    // Buscar emojis en orden de prioridad (emociones más intensas primero)
    const emotionPriority = ['enojo', 'miedo', 'tristeza', 'ansiedad', 'verguenza', 'culpa', 'alegria', 'esperanza', 'neutral'];
    
    for (const emotion of emotionPriority) {
      if (this.emojiPatterns[emotion] && this.emojiPatterns[emotion].test(content)) {
        return emotion;
      }
    }
    
    return null;
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
    
    // Primero verificar emojis (tienen alta confianza)
    const emojiEmotion = this.detectEmotionFromEmojis(content);
    if (emojiEmotion && emojiEmotion !== 'neutral') {
      const emotionData = this.emotionPatterns[emojiEmotion];
      return {
        name: emojiEmotion,
        category: emotionData.category,
        baseIntensity: emotionData.intensity
      };
    }
    
    // Verificar negación emocional explícita (puede indicar que sí siente esa emoción)
    if (this.denialPattern.test(content)) {
      // Extraer la emoción negada
      if (/no.*triste|no.*deprimid/i.test(content)) {
        return {
          name: 'tristeza',
          category: 'negative',
          baseIntensity: 5 // Intensidad menor porque está negada
        };
      } else if (/no.*ansios|no.*preocupa/i.test(content)) {
        return {
          name: 'ansiedad',
          category: 'negative',
          baseIntensity: 5
        };
      } else if (/no.*enojad/i.test(content)) {
        return {
          name: 'enojo',
          category: 'negative',
          baseIntensity: 5
        };
      } else if (/no.*miedo/i.test(content)) {
        return {
          name: 'miedo',
          category: 'negative',
          baseIntensity: 5
        };
      }
    }
    
    // Verificar preguntas retóricas (indican frustración o ansiedad)
    if (this.rhetoricalQuestionPattern.test(content)) {
      const hasAnxietyKeywords = /(?:preocupa|nervios|inquiet|agobia|abruma|tensión)/i.test(content);
      if (hasAnxietyKeywords) {
        return {
          name: 'ansiedad',
          category: 'negative',
          baseIntensity: 6
        };
      } else {
        return {
          name: 'enojo',
          category: 'negative',
          baseIntensity: 7
        };
      }
    }
    
    // Buscar emociones específicas por patrones de texto
    for (const [emotion, data] of Object.entries(this.emotionPatterns)) {
      if (emotion !== 'neutral' && data.patterns.test(content)) {
        return {
          name: emotion,
          category: data.category,
          baseIntensity: data.intensity
        };
      }
    }
    
    // Si no se detecta una emoción específica, verificar indicadores negativos
    // Estos pueden indicar tristeza o ansiedad aunque no se mencione explícitamente
    if (this.negativeIndicatorsPattern.test(content)) {
      // Determinar si es más tristeza o ansiedad basado en el contexto
      const hasAnxietyKeywords = /(?:preocupa|nervios|inquiet|agobia|abruma|tensión)/i.test(content);
      const hasSadnessKeywords = /(?:sin.*ganas|desmotiva|desánimo|vacío|hundid)/i.test(content);
      
      if (hasAnxietyKeywords) {
        return {
          name: 'ansiedad',
          category: 'negative',
          baseIntensity: 6
        };
      } else if (hasSadnessKeywords) {
        return {
          name: 'tristeza',
          category: 'negative',
          baseIntensity: 7
        };
      } else {
        // Por defecto, indicadores negativos sugieren tristeza
        return {
          name: 'tristeza',
          category: 'negative',
          baseIntensity: 6 // Intensidad ligeramente menor si no es explícita
        };
      }
    }
    
    // Si no hay indicadores, retornar neutral
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
    
    // Ajustar según repetición de palabras (muy muy, mucho mucho, etc.)
    if (this.repetitionPattern.test(content)) {
      intensity = this.clampIntensity(intensity + 1);
    }
    
    // Ajustar según signos de exclamación múltiples
    const exclamationCount = (content.match(/!/g) || []).length;
    if (exclamationCount >= 2) {
      intensity = this.clampIntensity(intensity + Math.min(exclamationCount - 1, 2));
    }
    
    // Ajustar según signos de interrogación múltiples (pueden indicar ansiedad o frustración)
    const questionCount = (content.match(/\?/g) || []).length;
    if (questionCount >= 2 && emotion.category === 'negative') {
      intensity = this.clampIntensity(intensity + 1);
    }
    
    // Ajustar según mayúsculas (TODO EN MAYÚSCULAS indica urgencia/intensidad)
    if (this.allCapsPattern.test(content)) {
      intensity = this.clampIntensity(intensity + 2);
    }
    
    // Ajustar según longitud del mensaje (mensajes largos pueden indicar mayor intensidad)
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount > this.WORD_COUNT_THRESHOLD) {
      intensity = this.clampIntensity(intensity + 1);
    }
    
    // Ajustar según comparaciones temporales
    if (this.temporalComparisonPattern.test(content)) {
      if (/peor.*que|más.*mal|menos.*bien/i.test(content)) {
        intensity = this.clampIntensity(intensity + 1);
      } else if (/mejor.*que|más.*bien|menos.*mal/i.test(content) && emotion.category === 'negative') {
        intensity = this.clampIntensity(intensity - 1);
      }
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
    
    let confidence = this.CONFIDENCE_DEFAULT;
    
    // Alta confianza si hay coincidencia directa con patrones
    if (emotion.patterns?.test(content)) {
      confidence = this.CONFIDENCE_MATCH;
    }
    
    // Aumentar confianza si hay emojis que coinciden con la emoción detectada
    const emojiEmotion = this.detectEmotionFromEmojis(content);
    if (emojiEmotion === emotion.name) {
      confidence = Math.min(confidence + 0.15, this.CONFIDENCE_MAX);
    }
    
    // Aumentar confianza si hay pistas contextuales
    if (this.hasContextualClues(content)) {
      confidence = Math.min(confidence + this.CONFIDENCE_CONTEXTUAL, this.CONFIDENCE_MAX);
    }
    
    // Aumentar confianza si hay múltiples indicadores (intensificadores + emoción)
    if (this.intensifiersPattern.test(content) && emotion.patterns?.test(content)) {
      confidence = Math.min(confidence + 0.05, this.CONFIDENCE_MAX);
    }
    
    // Reducir confianza si hay negación explícita de la emoción detectada
    if (this.denialPattern.test(content) && emotion.category === 'negative') {
      confidence = Math.max(confidence - 0.2, 0.3);
    }
    
    return Math.min(confidence, this.CONFIDENCE_MAX);
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