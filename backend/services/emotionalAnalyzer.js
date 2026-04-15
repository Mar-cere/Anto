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
    this.BRIEF_FOLLOWUP_MAX_WORDS = 7;
    this.BRIEF_FOLLOWUP_MAX_CHARS = 48;
    this.EMOTION_NEUTRAL = 'neutral';
    this.CATEGORY_NEUTRAL = 'neutral';
    this.CATEGORY_NEGATIVE = 'negative';
    this.TREND_INCREASING = 'increasing';
    this.TREND_DECREASING = 'decreasing';
    this.TREND_STABLE = 'stable';
    
    // Patrones de detección emocional
    this.emotionPatterns = {
      tristeza: {
        patterns: /(?:triste(?:za)?|deprimi(?:do|da|r)|sin energía|desánimo|desmotiva(?:do|da|r)|(?:^|[^a-z])(?:solo|soledad)(?:[^a-z]|$)(?!.*estoy.*bien)(?!.*me.*siento.*bien)(?!.*todo.*bien)|melancolía|nostalgia|abatid(?:o|a)|desesperanzad(?:o|a)|desconsolad(?:o|a)|llor(?:o|ar|ando)|llanto|vacío|vacío interior|sin ganas|sin ánimo|desgana|apático|apatía|hundid(?:o|a)|caíd(?:o|a)|desilusionad(?:o|a)|desencantad(?:o|a)|no.*tengo.*ganas|no.*me.*motiva|me.*siento.*mal(?!.*genial)(?!.*bien)|no.*me.*siento.*bien|estoy.*mal(?!.*genial)(?!.*bien)|me.*va.*mal|me.*siento.*peor|estoy.*peor|peor.*que|me.*siento.*peor.*que|estoy.*peor.*que|peor.*que.*antes|estoy.*peor.*que.*antes|me.*siento.*peor.*que.*antes|tengo.*ganas.*de.*hacerme.*daño|quiero.*hacerme.*daño|me.*quiero.*cortar|quiero.*cortarme|me.*corto|me.*quemo|me.*golpeo|autolesi(?:ón|on|arme)|hacerme.*daño|hacerse.*daño|el.*dolor.*físico.*me.*hace.*sentir.*mejor.*que.*el.*dolor.*emocional|cicatrices.*de.*cuando.*me.*cortaba|necesito.*hacerme.*daño|urgencia.*de.*hacerme.*daño|no.*puedo.*dejar.*de.*pensar.*en.*hacerme.*daño|pensar.*en.*hacerme.*daño|sería.*mejor.*si.*no.*existiera|mejor.*si.*no.*existiera|pienso.*que.*sería.*mejor.*si.*no.*existiera|terminar.*con.*todo.*esto|pensado.*en.*cómo.*terminar|nadie.*me.*extrañaría.*si.*me.*fuera|me.*extrañaría.*si.*me.*fuera|no.*veo.*ninguna.*salida|sin.*salida|futuro.*se.*ve.*completamente.*negro|futuro.*negro|mi.*vida.*no.*puedo.*ser.*peor|mi.*vida.*no.*puede.*ser.*peor|ya.*no.*puedo.*más.*estoy.*al.*límite|estoy.*al.*límite|me.*siento.*desconectado.*de.*todos|desconectado.*de.*todos|estoy.*hecho.*polvo|hecho.*polvo|completamente.*destrozado|destrozado|extrañ(?:o|ar|o.*mucho)|ech(?:o|ar).*de.*menos|pérdida|duelo|ya.*no.*está|se.*fue|mur(?:ió|ió)|fallec(?:ió|ió)|falleció|despedida|despedir|abuela.*falleció|abuela.*murió|madre.*falleció|madre.*murió|padre.*falleció|padre.*murió|familiar.*falleció|familiar.*murió)/i,
        intensity: 7,
        category: 'negative'
      },
      ansiedad: {
        patterns: /(?:ansie(?:dad|oso|ado)|nervios|inquiet(?:o|ud|o)|preocupa(?:do|da|ción|r|rme|rse)|angustia|pánico|estresad(?:o|a)|agobiad(?:o|a)|abrumad(?:o|a)|sobrecargad(?:o|a)|tens(?:o|a|ión)|intranquil(?:o|a)|agitad(?:o|a)|alterad(?:o|a)|asustad(?:o|a)|atemorizad(?:o|a)|preocupad(?:o|a)|nervios(?:o|a|ismo)|ataque.*de.*pánico|ataque.*de.*ansiedad|me.*preocupa|me.*inquieta|me.*agobia|me.*abruma|no.*puedo.*relajarme|no.*puedo.*tranquilizarme|no.*puedo.*calmarme|me.*siento.*nervios(?:o|a)|estoy.*nervios(?:o|a)|me.*siento.*ansios(?:o|a)|estoy.*ansios(?:o|a)|no.*puedo.*respirar|me.*ahogo|mi.*corazón.*late.*muy.*rápido|palpitaciones|siento.*que.*me.*voy.*a.*morir|siento.*que.*me.*desmayo|pérdida.*de.*control|no.*puedo.*pensar.*claramente|siento.*que.*no.*soy.*yo|fuera.*de.*mi.*cuerpo|despersonalización|siento.*que.*no.*estoy.*en.*mi.*cuerpo|como.*si.*fuera.*un.*sueño|no.*estoy.*en.*mi.*cuerpo|los.*ruidos.*fuertes.*me.*abrum|sobrecarga.*sensorial|estímulos.*sensoriales|me.*sobrecarga|dificultad.*con.*estímulos|ruidos.*de.*fondo.*me.*distra|luces.*brillantes.*me.*molest|texturas.*me.*dan.*ansiedad|dificultad.*con.*texturas|dificultad.*con.*cambios|los.*cambios.*me.*generan.*ansiedad|dificultad.*con.*rutinas|necesito.*seguir.*mis.*rutinas|dificultad.*con.*transiciones|cambiar.*de.*actividad.*me.*cuesta|dificultad.*con.*multitarea|no.*puedo.*hacer.*varias.*cosas|me.*siento.*abrumado.*con.*tareas|dificultad.*con.*contacto.*físico|no.*me.*gusta.*que.*me.*toquen|dificultad.*con.*contacto.*visual|no.*puedo.*mantener.*contacto.*visual|dificultad.*con.*comunicación|me.*cuesta.*expresar|las.*palabras.*no.*salen|dificultad.*con.*señales.*sociales|no.*entiendo.*las.*señales.*sociales|me.*siento.*fuera.*de.*lugar|me.*obsesiono.*con.*cosas|hiperfoco|no.*puedo.*pensar.*en.*nada.*más|tengo.*crisis.*donde.*no.*puedo.*controlar|meltdown|burnout|me.*siento.*completamente.*agotado|mi.*cerebro.*se.*hubiera.*apagado|tengo.*que.*fingir.*ser.*normal|enmascaramiento|estoy.*agotado.*de.*fingir|no.*entiendo.*las.*bromas|tomo.*todo.*literalmente|no.*sé.*qué.*siento|todas.*las.*emociones.*se.*mezclan|no.*entiendo.*cómo.*se.*sienten.*los.*demás|me.*siento.*desconectado)/i,
        intensity: 6,
        category: 'negative'
      },
      enojo: {
        patterns: /(?:enoja(?:do|da|r|rme)|ira|rabia|molest(?:o|a|ia|arme)|frustrad(?:o|a|r|rme)|impotencia|indignación|resentimiento|irritad(?:o|a)|furios(?:o|a)|coléric(?:o|a)|exasperad(?:o|a)|hart(?:o|a)|cansad(?:o|a).*de|fastid(?:o|a|iado|iarme)|disgustad(?:o|a)|ofendid(?:o|a)|traicionad(?:o|a)|decepcionad(?:o|a)|me.*molesta|me.*enoja|me.*irrita|me.*frustra|me.*indigna|estoy.*hart(?:o|a)|estoy.*furios(?:o|a)|me.*siento.*traicionad(?:o|a)|me.*siento.*ofendid(?:o|a)|no.*aguanto|no.*soporto|me.*tiene.*hart(?:o|a))/i,
        intensity: 8,
        category: 'negative'
      },
      alegria: {
        patterns: /(?:feliz|content(?:o|a)|alegr(?:e|ía|arme)|satisfech(?:o|a)|motivad(?:o|a)|entusiasm(?:o|ado|arme)|euforia|júbilo|optimista|esperanzad(?:o|a)|ilusionad(?:o|a)|emocionad(?:o|a)|eufóric(?:o|a)|radiante|brillante|genial|fantástic(?:o|a)|maravillos(?:o|a)|increíble|excelente|perfect(?:o|a)|me.*siento.*bien|estoy.*bien|me.*va.*bien|todo.*va.*bien|me.*alegra|me.*encanta|me.*gusta|me.*emociona|estoy.*content(?:o|a)|estoy.*feliz|me.*siento.*feliz|me.*siento.*content(?:o|a)|me.*siento.*genial|estoy.*genial|gusta.*mucho|me.*gusta.*la|me.*gusta.*el|me.*gusta.*los|me.*gusta.*las|logr(?:é|e|ar|ado)|complet(?:é|e|ar|ado).*meta|complet(?:é|e|ar|ado).*objetivo|alcanc(?:é|e|ar|ado).*meta|alcanc(?:é|e|ar|ado).*objetivo|me.*siento.*mejor|estoy.*mejor|mejor.*que)/i,
        intensity: 7,
        category: 'positive'
      },
      miedo: {
        patterns: /(?:miedo|temor|terror|pavor|susto|sust(?:o|ado)|atemorizad(?:o|a)|asustad(?:o|a)|aterrad(?:o|a)|aterrorizad(?:o|a)|intimidad(?:o|a)|me.*da.*miedo|me.*asusta|me.*aterroriza|tengo.*miedo|siento.*miedo|me.*siento.*asustad(?:o|a)|estoy.*asustad(?:o|a)|me.*siento.*aterrad(?:o|a)|estoy.*aterrad(?:o|a)|tengo.*terror|siento.*terror|me.*aterroriza|me.*intimida|miedo.*de.*lo.*que|me.*aterra.*pensar|aterroriza.*pensar)/i,
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
        patterns: /(?:^normal$|^estoy.*normal$|^me.*siento.*normal$|tranquil(?:o|a)|bien|regular|más o menos|asi asi|equilibrad(?:o|a)|estable|ok|okay|bien.*y.*mal|ni.*bien.*ni.*mal|ni.*feliz.*ni.*triste|estoy.*tranquil(?:o|a)|me.*siento.*tranquil(?:o|a)|todo.*normal|todo.*bien|todo.*regular|está.*bien|está.*ok)/i,
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
      // NUEVO: Verificar caché antes de analizar
      let cachedAnalysis = null;
      try {
        const { default: analysisCache } = await import('./emotionalAnalysisCache.js');
        cachedAnalysis = analysisCache.get(content);
        
        if (cachedAnalysis && (!previousPatterns || previousPatterns.length === 0)) {
          // Si hay análisis cacheado y no hay patrones previos, usar caché
          return cachedAnalysis;
        }
      } catch (error) {
        // Si falla el caché, continuar con análisis normal
        console.warn('[EmotionalAnalyzer] Error al acceder al caché:', error);
      }

      const contentLower = content.toLowerCase();
      let detectedEmotion = this.detectPrimaryEmotion(contentLower);
      let intensity = this.calculateIntensity(contentLower, detectedEmotion);
      let secondaryEmotions = this.detectSecondaryEmotions(contentLower, detectedEmotion.name);

      // Ajustar basado en patrones previos si existen
      if (previousPatterns && Array.isArray(previousPatterns) && previousPatterns.length > 0) {
        const adjustedAnalysis = this.adjustBasedOnHistory(
          contentLower,
          detectedEmotion,
          intensity,
          previousPatterns
        );
        detectedEmotion = adjustedAnalysis.emotion;
        intensity = adjustedAnalysis.intensity;
      }

      // NUEVO: Detectar subtipo emocional
      let subtype = null;
      try {
        const { default: subtypeDetector } = await import('./emotionalSubtypeDetector.js');
        subtype = subtypeDetector.detectSubtype(detectedEmotion.name, content);
      } catch (error) {
        console.warn('[EmotionalAnalyzer] Error al detectar subtipo:', error);
      }

      // NUEVO: Detectar tema/contexto del mensaje
      let topic = 'general';
      let topics = ['general'];
      try {
        const { default: topicDetector } = await import('./topicDetector.js');
        topic = topicDetector.detectTopic(content);
        topics = topicDetector.detectMultipleTopics(content);
      } catch (error) {
        console.warn('[EmotionalAnalyzer] Error al detectar tema:', error);
      }

      const analysis = {
        mainEmotion: detectedEmotion.name,
        intensity,
        category: detectedEmotion.category,
        secondary: secondaryEmotions,
        confidence: this.calculateConfidence(contentLower, detectedEmotion),
        requiresAttention: this.checkIfRequiresAttention(detectedEmotion, intensity),
        // NUEVOS CAMPOS
        subtype: subtype, // Subtipo emocional (micro-emoción)
        topic: topic, // Tema principal del mensaje
        topics: topics // Múltiples temas detectados
      };

      // NUEVO: Guardar en caché si no hay patrones previos
      if (!previousPatterns || previousPatterns.length === 0) {
        try {
          const { default: analysisCache } = await import('./emotionalAnalysisCache.js');
          analysisCache.set(content, analysis);
        } catch (error) {
          // Si falla, continuar sin caché
        }
      }

      return analysis;
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
    // IMPORTANTE: Priorizar emojis positivos si hay texto positivo, y negativos si hay texto negativo
    const hasPositiveText = /(?:genial|feliz|contento|alegre|bien|bueno)/i.test(content);
    const hasNegativeText = /(?:mal|triste|malo|deprimido|ansioso)/i.test(content);
    
    // Si hay texto positivo, priorizar emojis positivos
    if (hasPositiveText && !hasNegativeText) {
      const positiveEmotions = ['alegria', 'esperanza', 'neutral'];
      for (const emotion of positiveEmotions) {
        if (this.emojiPatterns[emotion] && this.emojiPatterns[emotion].test(content)) {
          return emotion;
        }
      }
    }
    
    // Si hay texto negativo, priorizar emojis negativos
    if (hasNegativeText && !hasPositiveText) {
      const negativeEmotions = ['tristeza', 'ansiedad', 'miedo', 'enojo', 'verguenza', 'culpa'];
      for (const emotion of negativeEmotions) {
        if (this.emojiPatterns[emotion] && this.emojiPatterns[emotion].test(content)) {
          return emotion;
        }
      }
    }
    
    // Orden por defecto (emociones más intensas primero)
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
    
    // IMPORTANTE: Verificar primero frases positivas completas para evitar falsos positivos
    // Esto previene que "solo estoy bien" se detecte como tristeza
    const positivePhrases = [
      /(?:^|[^a-z])(?:solo|solamente).*estoy.*bien/i,
      /(?:^|[^a-z])(?:solo|solamente).*me.*siento.*bien/i,
      /estoy.*bien/i,
      /me.*siento.*bien/i,
      /todo.*bien/i,
      /está.*bien/i,
      /están.*bien/i,
      /muy.*bien/i,
      /todo.*está.*bien/i
    ];
    
    // Si el mensaje contiene una frase positiva clara, retornar neutral o alegría
    for (const phrase of positivePhrases) {
      if (phrase.test(content)) {
        // Verificar que no haya negación antes
        const beforeMatch = content.substring(0, content.search(phrase));
        if (!/(?:no|nunca|jamás|tampoco)/i.test(beforeMatch)) {
          return {
            name: 'neutral',
            category: 'neutral',
            baseIntensity: this.INTENSITY_NEUTRAL
          };
        }
      }
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
    
    // IMPORTANTE: Verificar indicadores negativos ANTES de buscar emociones positivas
    // Esto previene que "no me siento bien" se detecte como "alegria"
    if (this.negativeIndicatorsPattern.test(content)) {
      // Verificar casos específicos de "no me siento bien" o variantes
      if (/no.*me.*siento.*(?:bien|muy.*bien|tan.*bien|muy.*bien)/i.test(content)) {
        return {
          name: 'tristeza',
          category: 'negative',
          baseIntensity: 6
        };
      }
      if (/no.*estoy.*(?:bien|muy.*bien|tan.*bien)/i.test(content)) {
        return {
          name: 'tristeza',
          category: 'negative',
          baseIntensity: 6
        };
      }
      // Otros indicadores negativos generales
      if (/no.*puedo.*más|no.*aguanto|no.*soporto/i.test(content)) {
        return {
          name: 'ansiedad',
          category: 'negative',
          baseIntensity: 7
        };
      }
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
    // IMPORTANTE: Verificar primero si hay negaciones explícitas que invalidan emociones positivas
    // Por ejemplo: "no me gusta" no debe detectarse como "alegria"
    const hasNegativePrefix = /^(?:no|nunca|jamás|tampoco)\s+/i.test(content.trim());
    
    // Priorizar emociones positivas primero, PERO solo si no hay prefijo negativo
    // IMPORTANTE: Priorizar miedo antes que ansiedad para evitar confusión
    // IMPORTANTE: Priorizar neutral para mensajes simples como "estoy normal"
    // IMPORTANTE: NO considerar mensajes simples si tienen comparaciones temporales negativas
    // IMPORTANTE: Si hay contexto de autolesión o crisis, priorizar emociones negativas
    const hasTemporalComparison = this.temporalComparisonPattern.test(content);
    const hasNegativeComparison = /(?:peor|más.*mal|menos.*bien)/i.test(content);
    const hasSelfHarmContext = /(?:dolor.*físico|dolor.*emocional|hacerme.*daño|autolesi|me.*corto|me.*quemo|me.*golpeo|hacerse.*daño|sería.*mejor.*si.*no.*existiera|mejor.*si.*no.*existiera|pienso.*que.*sería.*mejor.*si.*no.*existiera|terminar.*con.*todo.*esto|pensado.*en.*cómo.*terminar|nadie.*me.*extrañaría.*si.*me.*fuera|me.*extrañaría.*si.*me.*fuera|no.*veo.*ninguna.*salida|sin.*salida|futuro.*se.*ve.*completamente.*negro|futuro.*negro|ya.*no.*puedo.*más.*estoy.*al.*límite|estoy.*al.*límite|estoy.*hecho.*polvo|hecho.*polvo|completamente.*destrozado|destrozado)/i.test(content);
    const hasCrisisContext = /(?:ataque.*de.*pánico|ataque.*de.*ansiedad|no.*puedo.*respirar|me.*ahogo|palpitaciones|siento.*que.*me.*voy.*a.*morir|siento.*que.*no.*estoy.*en.*mi.*cuerpo|como.*si.*fuera.*un.*sueño|no.*estoy.*en.*mi.*cuerpo|no.*puedo.*calmarme)/i.test(content);
    const isSimpleMessage = /^(estoy|me siento|soy|está|están)\s+\w+$/i.test(content.trim()) && !hasNegativeComparison;
    
    // Si hay contexto de autolesión o crisis, priorizar emociones negativas
    const emotionPriority = (hasSelfHarmContext || hasCrisisContext)
      ? ['tristeza', 'ansiedad', 'miedo', 'enojo', 'verguenza', 'culpa', 'alegria', 'esperanza', 'neutral']
      : isSimpleMessage 
        ? ['neutral', 'alegria', 'esperanza', 'miedo', 'tristeza', 'ansiedad', 'enojo', 'verguenza', 'culpa']
        : ['alegria', 'esperanza', 'miedo', 'tristeza', 'ansiedad', 'enojo', 'verguenza', 'culpa', 'neutral'];
    
    // Patrones para casos especiales
    const sarcasmPositivePattern = /(?:¡?qué genial!?[^a-zA-Z0-9]*otro problema más|otro problema más)/i;
    const mixedTemporalPattern = /me.*siento.*mejor.*que.*hace.*una.*semana.*pero.*peor.*que.*ayer/i;
    const cycleTemporalPattern = /algunos.*d[ií]as.*estoy.*bien.*otros.*d[ií]as.*muy.*mal/i;
    const emojisNegative = /[\u{1F622}\u{1F62D}\u{1F61E}\u{1F625}\u{1F614}\u{2639}\u{1F641}]/u;
    const textoMuyPositivo = /(?:todo.*está.*perfecto|todo.*perfecto|está.*perfecto)/i;

    // Caso especial antes de todo: texto muy positivo + emoji muy negativo => tristeza
    if (emojisNegative.test(content) && textoMuyPositivo.test(content)) {
      return {
        name: 'tristeza',
        category: 'negative',
        baseIntensity: 7
      };
    }

    // Primero buscar emociones prioritarias
    for (const emotion of emotionPriority) {
      if (this.emotionPatterns[emotion] && this.emotionPatterns[emotion].patterns.test(content)) {
        const emotionData = this.emotionPatterns[emotion];
        
        // IMPORTANTE: Si es una emoción positiva, verificar que NO haya indicadores negativos
        // Ejemplo: "no me siento bien" NO debe ser "alegria"
        if (emotionData.category === 'positive') {
          // Verificar si hay un prefijo negativo
          if (hasNegativePrefix) {
            // Verificar patrones específicos que no deben coincidir con negación
            const positivePatternsWithNegation = [
              /no\s+me\s+siento\s+(?:bien|muy\s+bien|tan\s+bien)/i,
              /no\s+estoy\s+(?:bien|muy\s+bien|tan\s+bien)/i,
              /no\s+me\s+gusta/i,
              /no\s+me\s+encanta/i,
              /no\s+me\s+alegra/i,
              /no\s+me\s+emociona/i
            ];
            
            const hasNegativePositivePattern = positivePatternsWithNegation.some(pattern => 
              pattern.test(content)
            );
            
            if (hasNegativePositivePattern) {
              // Saltar esta emoción positiva, continuar buscando
              continue;
            }
          }
          
          // También verificar indicadores negativos generales
          if (this.negativeIndicatorsPattern.test(content)) {
            // Si hay indicadores negativos, no aplicar emoción positiva
            continue;
          }
        }
        
        // IMPORTANTE: Si hay contexto de autolesión o crisis, priorizar emociones negativas
        // Ejemplo: "El dolor físico me hace sentir mejor que el dolor emocional" debe ser tristeza, no alegria
        const hasSelfHarmContextForPositive = /(?:dolor.*físico|dolor.*emocional|hacerme.*daño|autolesi|me.*corto|me.*quemo|me.*golpeo|hacerse.*daño)/i.test(content);
        if (emotionData.category === 'positive' && hasSelfHarmContextForPositive) {
          // Si hay contexto de autolesión, no aplicar emoción positiva
          continue;
        }

        // Caso especial: sarcasmo con frase aparentemente positiva
        if (emotionData.category === 'positive' && sarcasmPositivePattern.test(content)) {
          return {
            name: 'enojo',
            category: 'negative',
            baseIntensity: 7
          };
        }

        // Caso especial: ciclo temporal "algunos días bien, otros muy mal"
        if (cycleTemporalPattern.test(content) && emotion === 'alegria') {
          return {
            name: 'tristeza',
            category: 'negative',
            baseIntensity: 7
          };
        }

        // Caso especial: texto muy positivo con emoji claramente negativo -> tristeza
        if (emotion === 'alegria' && textoMuyPositivo.test(content) && emojisNegative.test(content)) {
          return {
            name: 'tristeza',
            category: 'negative',
            baseIntensity: 7
          };
        }
        
        return {
          name: emotion,
          category: emotionData.category,
          baseIntensity: emotionData.intensity
        };
      }
    }
    
    // Luego buscar otras emociones
    for (const [emotion, data] of Object.entries(this.emotionPatterns)) {
      if (emotion !== 'neutral' && !emotionPriority.includes(emotion) && data.patterns.test(content)) {
        // Misma validación para prefijos negativos
        if (data.category === 'positive' && hasNegativePrefix) {
          const positivePatterns = ['me.*gusta', 'me.*encanta', 'me.*alegra', 'me.*emociona'];
          const hasPositivePattern = positivePatterns.some(pattern => {
            const regex = new RegExp(pattern, 'i');
            return regex.test(content);
          });
          
          if (hasPositivePattern && /no\s+me/i.test(content)) {
            continue;
          }
        }
        
        // IMPORTANTE: Si hay contexto de autolesión o crisis, priorizar emociones negativas
        const hasSelfHarmContext = /(?:dolor.*físico|dolor.*emocional|hacerme.*daño|autolesi|me.*corto|me.*quemo|me.*golpeo|hacerse.*daño)/i.test(content);
        if (data.category === 'positive' && hasSelfHarmContext) {
          // Si hay contexto de autolesión, no aplicar emoción positiva
          continue;
        }
        
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
      // Verificar primero casos críticos de ideación suicida y desesperanza
      const hasSuicidalIdeation = /(?:sería.*mejor.*si.*no.*existiera|mejor.*si.*no.*existiera|pienso.*que.*sería.*mejor.*si.*no.*existiera|terminar.*con.*todo.*esto|pensado.*en.*cómo.*terminar|nadie.*me.*extrañaría.*si.*me.*fuera|me.*extrañaría.*si.*me.*fuera)/i.test(content);
      const hasHopelessness = /(?:no.*veo.*ninguna.*salida|sin.*salida|futuro.*se.*ve.*completamente.*negro|futuro.*negro)/i.test(content);
      const hasDesperation = /(?:ya.*no.*puedo.*más.*estoy.*al.*límite|estoy.*al.*límite)/i.test(content);
      const hasDisconnection = /(?:me.*siento.*desconectado.*de.*todos|desconectado.*de.*todos)/i.test(content);
      const hasColloquialNegative = /(?:estoy.*hecho.*polvo|hecho.*polvo)/i.test(content);
      const hasExtremeNegative = /(?:completamente.*destrozado|destrozado)/i.test(content);
      
      if (hasSuicidalIdeation || hasHopelessness || hasDesperation) {
        return {
          name: 'tristeza',
          category: 'negative',
          baseIntensity: 9
        };
      }
      
      if (hasDisconnection) {
        return {
          name: 'tristeza',
          category: 'negative',
          baseIntensity: 7
        };
      }
      
      if (hasColloquialNegative || hasExtremeNegative) {
        return {
          name: 'tristeza',
          category: 'negative',
          baseIntensity: 8
        };
      }
      
      // Determinar si es más tristeza o ansiedad basado en el contexto
      const hasAnxietyKeywords = /(?:preocupa|nervios|inquiet|agobia|abruma|tensión|me.*aterra.*pensar|aterroriza.*pensar)/i.test(content);
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
    
    // ========== AJUSTES ESPECIALES PARA CRISIS Y AUTOLESIÓN ==========
    
    // Patrones de crisis de pánico (alta intensidad)
    const panicPatterns = /(?:ataque.*de.*pánico|ataque.*de.*ansiedad|no.*puedo.*respirar|me.*ahogo|mi.*corazón.*late.*muy.*rápido|palpitaciones|siento.*que.*me.*voy.*a.*morir|siento.*que.*me.*desmayo|pérdida.*de.*control|no.*puedo.*pensar.*claramente|no.*puedo.*calmarme|siento.*que.*no.*soy.*yo|fuera.*de.*mi.*cuerpo|despersonalización|siento.*que.*no.*estoy.*en.*mi.*cuerpo|como.*si.*fuera.*un.*sueño|no.*estoy.*en.*mi.*cuerpo)/i;
    if (panicPatterns.test(content) && emotion.name === 'ansiedad') {
      intensity = Math.max(this.clampIntensity(intensity + 3), 9); // Aumentar significativamente, mínimo 9
    }

    // Miedo anticipatorio ("me aterra pensar...") debe ser al menos 8
    if (emotion.name === 'miedo' && /me.*aterra.*pensar|aterroriza.*pensar/i.test(content)) {
      intensity = Math.max(intensity, 8);
    }
    
    // Patrones de autolesión (alta intensidad)
    // IMPORTANTE: Verificar primero autolesión pasada para evitar falsos positivos
    const pastSelfHarmPatterns = /(?:cicatrices.*de.*cuando.*me.*cortaba|cuando.*me.*cortaba|cuando.*me.*quemaba|cuando.*me.*golpeaba|de.*cuando.*me.*cortaba|me.*cortaba.*antes|me.*quemaba.*antes)/i;
    const isPastSelfHarm = pastSelfHarmPatterns.test(content);
    
    if (isPastSelfHarm && emotion.name === 'tristeza') {
      // Autolesión pasada: intensidad moderada-alta (7-9), no máxima
      // Establecer intensidad base para autolesión pasada (no aplicar otros ajustes de autolesión)
      intensity = this.clampIntensity(7 + 1); // Base 7 + 1 = 8, máximo 9 con otros ajustes
    } else if (emotion.name === 'tristeza') {
      // Patrones de alta urgencia (intensidad máxima)
      // Incluir también expresiones que indican que es la única forma de sentir algo
      const urgentSelfHarmPatterns = /(?:tengo.*ganas.*de.*hacerme.*daño|quiero.*hacerme.*daño|me.*quiero.*cortar|quiero.*cortarme|necesito.*hacerme.*daño|urgencia.*de.*hacerme.*daño|no.*puedo.*dejar.*de.*pensar.*en.*hacerme.*daño|pensar.*en.*hacerme.*daño|es.*la.*única.*forma.*de.*sentir|única.*forma.*de.*sentir.*algo)/i;
      if (urgentSelfHarmPatterns.test(content)) {
        // Para autolesión urgente, establecer intensidad mínima de 9
        intensity = Math.max(this.clampIntensity(intensity + 3), 9);
      }
      
      // Patrones de autolesión activa (alta intensidad)
      const activeSelfHarmPatterns = /(?:me.*corto(?!.*cuando)|me.*quemo(?!.*cuando)|me.*golpeo(?!.*cuando)|autolesi(?:ón|on|arme)|el.*dolor.*físico.*me.*hace.*sentir.*mejor)/i;
      if (activeSelfHarmPatterns.test(content)) {
        if (/a veces/i.test(content)) {
          // Si hay "a veces", intensidad moderada-alta (8-10) pero no máxima
          intensity = Math.max(this.clampIntensity(intensity + 2), 8);
        } else {
          intensity = this.clampIntensity(intensity + 3); // Aumentar significativamente
        }
      }
    }
    
    // Guardar intensidad después de ajustes especiales para evitar que se reduzca
    const intensityAfterSpecialAdjustments = intensity;
    const hasUrgentSelfHarm = emotion.name === 'tristeza' && /(?:tengo.*ganas.*de.*hacerme.*daño|quiero.*hacerme.*daño|me.*quiero.*cortar|quiero.*cortarme|necesito.*hacerme.*daño|urgencia.*de.*hacerme.*daño|no.*puedo.*dejar.*de.*pensar.*en.*hacerme.*daño|pensar.*en.*hacerme.*daño|es.*la.*única.*forma.*de.*sentir|única.*forma.*de.*sentir.*algo)/i.test(content);
    const hasActiveSelfHarmWithAveces = emotion.name === 'tristeza' && /(?:me.*corto|me.*quemo|me.*golpeo)/i.test(content) && /a veces/i.test(content);
    const hasSuicidalIdeation = /(?:sería.*mejor.*si.*no.*existiera|mejor.*si.*no.*existiera|pienso.*que.*sería.*mejor.*si.*no.*existiera|terminar.*con.*todo.*esto|pensado.*en.*cómo.*terminar|nadie.*me.*extrañaría.*si.*me.*fuera|me.*extrañaría.*si.*me.*fuera)/i.test(content);
    const hasHopelessness = /(?:no.*veo.*ninguna.*salida|sin.*salida|futuro.*se.*ve.*completamente.*negro|futuro.*negro)/i.test(content);
    const hasDesperation = /(?:ya.*no.*puedo.*más.*estoy.*al.*límite|estoy.*al.*límite)/i.test(content);
    
    // Ajustar según intensificadores o atenuadores
    // IMPORTANTE: No aplicar atenuadores si hay contexto de autolesión o crisis (son situaciones críticas)
    const hasSelfHarmOrCrisis = /(?:hacerme.*daño|autolesi|ataque.*de.*pánico|no.*puedo.*respirar|me.*ahogo|pensar.*en.*hacerme.*daño|quiero.*cortarme|me.*quemo|me.*corto|me.*golpeo)/i.test(content);
    if (this.intensifiersPattern.test(content)) {
      intensity = this.clampIntensity(intensity + this.INTENSITY_ADJUSTMENT);
    } else if (this.diminishersPattern.test(content) && !hasSelfHarmOrCrisis) {
      // Solo aplicar atenuadores si NO hay contexto de autolesión o crisis
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
    // IMPORTANTE: No aplicar ajustes de comparación temporal si hay contexto de autolesión o crisis
    if (this.temporalComparisonPattern.test(content) && !hasSelfHarmOrCrisis) {
      if (/peor.*que|más.*mal|menos.*bien/i.test(content)) {
        intensity = this.clampIntensity(intensity + 1);
      } else if (/mejor.*que|más.*bien|menos.*mal/i.test(content) && emotion.category === 'negative') {
        intensity = this.clampIntensity(intensity - 1);
      }
    }

    // Ajustes para comparaciones temporales complejas
    const hasMixedTemporal = /me.*siento.*mejor.*que.*hace.*una.*semana.*pero.*peor.*que.*ayer/i.test(content);
    const hasCycleTemporal = /algunos.*d[ií]as.*estoy.*bien.*otros.*d[ií]as.*muy.*mal/i.test(content);
    if (hasMixedTemporal) {
      intensity = Math.min(intensity, 7);
    }
    if (hasCycleTemporal) {
      intensity = Math.min(intensity, 8);
    }
    
    // IMPORTANTE: Asegurar intensidades mínimas después de todos los ajustes
    if (hasUrgentSelfHarm || hasSuicidalIdeation) {
      intensity = Math.max(intensity, 9); // Mínimo 9 para autolesión urgente o ideación suicida
    } else if (hasActiveSelfHarmWithAveces) {
      intensity = Math.max(intensity, 8); // Mínimo 8 para autolesión activa con "a veces"
    }
    
    // Ajustes adicionales para casos específicos
    if (hasHopelessness && emotion.name === 'tristeza') {
      intensity = Math.max(intensity, 8); // Mínimo 8 para desesperanza
    }
    
    if (hasDesperation && emotion.name === 'tristeza') {
      intensity = Math.max(intensity, 9); // Mínimo 9 para desesperación
    }
    
    // Caso especial: planificación explícita "terminar con todo esto" debe ser 10
    if (hasSuicidalIdeation && /terminar.*con.*todo.*esto/i.test(content)) {
      intensity = 10;
    }

    // Ajuste para culpa y vergüenza con intensificadores
    if ((emotion.name === 'culpa' || emotion.name === 'verguenza') &&
        /(?:todo.*es.*mi.*culpa|siempre.*arruino.*todo|mucha.*vergüenza|mucha.*verguenza)/i.test(content)) {
      intensity = Math.max(intensity, 8); // Mínimo 8 para culpa/vergüenza intensa
    }

    // Ajuste para minimización suave de tristeza ("solo estoy un poco triste")
    if (emotion.name === 'tristeza' &&
        /(?:solo.*estoy.*un.*poco.*triste|un.*poco.*triste)/i.test(content)) {
      intensity = Math.max(intensity, 5);
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
   * @param {string} content - Contenido actual en minúsculas
   * @param {Object} currentEmotion - Emoción actual
   * @param {number} currentIntensity - Intensidad actual
   * @param {Array} previousPatterns - Historial previo
   * @returns {Object} Análisis ajustado con emoción e intensidad
   */
  adjustBasedOnHistory(content, currentEmotion, currentIntensity, previousPatterns) {
    if (!Array.isArray(previousPatterns) || !previousPatterns.length) {
      return { emotion: currentEmotion, intensity: currentIntensity };
    }
    
    const recentPatterns = previousPatterns.slice(-this.HISTORY_WINDOW_SIZE);
    const carryover = this.applyBriefFollowUpCarryover(
      content,
      currentEmotion,
      currentIntensity,
      recentPatterns
    );
    if (carryover) {
      return carryover;
    }
    const emotionalTrend = this.analyzeEmotionalTrend(recentPatterns);
    
    return {
      emotion: currentEmotion,
      intensity: this.adjustIntensityBasedOnTrend(currentIntensity, emotionalTrend)
    };
  }

  /**
   * Mantiene continuidad emocional en respuestas muy breves de seguimiento
   * (ej: "las pastillas"), evitando caer a neutral si el estado previo era alto.
   * @param {string} content
   * @param {Object} currentEmotion
   * @param {number} currentIntensity
   * @param {Array} recentPatterns
   * @returns {{emotion: Object, intensity: number}|null}
   */
  applyBriefFollowUpCarryover(content, currentEmotion, currentIntensity, recentPatterns) {
    if (!this.isValidString(content) || !Array.isArray(recentPatterns) || recentPatterns.length === 0) {
      return null;
    }
    const words = content.trim().split(/\s+/).filter(Boolean);
    const isBrief = words.length <= this.BRIEF_FOLLOWUP_MAX_WORDS && content.length <= this.BRIEF_FOLLOWUP_MAX_CHARS;
    if (!isBrief) return null;

    const hasFollowUpCue = /(?:pastillas?|medicaci[oó]n|medicinas?|dosis|lorazepam|citalopram|escitalopram|ansiol[ií]tico|benzodiazep|eso|esto)/i.test(content);
    const last = recentPatterns[recentPatterns.length - 1];
    if (!last || !last.mainEmotion) return null;

    const wasHighNegative = ['miedo', 'ansiedad', 'tristeza', 'enojo'].includes(last.mainEmotion) && (last.intensity || 0) >= 8;
    const collapsedNow = currentEmotion?.name === this.EMOTION_NEUTRAL || currentIntensity <= 5;

    if (wasHighNegative && collapsedNow && hasFollowUpCue) {
      const carriedEmotionData = this.emotionPatterns[last.mainEmotion];
      if (!carriedEmotionData) return null;
      return {
        emotion: {
          name: last.mainEmotion,
          category: carriedEmotionData.category,
          baseIntensity: carriedEmotionData.intensity
        },
        intensity: this.clampIntensity(Math.max((last.intensity || 8) - 1, 7))
      };
    }
    return null;
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
      requiresAttention: false,
      subtype: null,
      topic: 'general',
      topics: ['general']
    };
  }
}

export default new EmotionalAnalyzer(); 