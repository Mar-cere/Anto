/**
 * Servicio de Detección Avanzada de Distorsiones Cognitivas
 * Detecta y categoriza distorsiones cognitivas comunes según la TCC
 * Basado en el trabajo de Aaron Beck y David Burns
 */

class CognitiveDistortionDetector {
  constructor() {
    // Definición de distorsiones cognitivas comunes
    this.distortions = {
      all_or_nothing: {
        name: 'Pensamiento Todo-o-Nada (Polarizado)',
        description: 'Ver las cosas en categorías absolutas, sin términos medios',
        examples: ['siempre', 'nunca', 'todo', 'nada', 'perfecto', 'fracaso total'],
        patterns: [
          /(?:siempre|nunca|jamás|todo|nada|perfecto|fracaso.*total|completamente|absolutamente)/i,
          /(?:o.*esto.*o.*aquello|blanco.*o.*negro|todo.*o.*nada)/i
        ],
        intervention: 'Explorar matices y términos medios. Preguntar: "¿Hay algún punto intermedio?"'
      },
      overgeneralization: {
        name: 'Generalización Excesiva',
        description: 'Ver un evento negativo como un patrón permanente de derrota',
        examples: ['siempre me pasa', 'nunca funciona', 'todos son así'],
        patterns: [
          /(?:siempre.*me.*pasa|nunca.*funciona|todos.*son|nadie.*hace|siempre.*me.*sale.*mal)/i,
          /(?:cada.*vez|todas.*las.*veces|nunca.*tengo.*suerte)/i
        ],
        intervention: 'Cuestionar la evidencia. Preguntar: "¿Realmente siempre? ¿Puedes recordar alguna excepción?"'
      },
      mental_filter: {
        name: 'Filtro Mental (Visión de Túnel)',
        description: 'Enfocarse exclusivamente en aspectos negativos, filtrando lo positivo',
        examples: ['solo veo lo malo', 'nada salió bien', 'todo fue terrible'],
        patterns: [
          /(?:solo.*lo.*malo|nada.*salió.*bien|todo.*fue.*terrible|solo.*veo.*problemas)/i,
          /(?:aunque.*haya.*cosas.*buenas|ignorando.*lo.*positivo)/i
        ],
        intervention: 'Ampliar la perspectiva. Preguntar: "¿Qué cosas positivas también ocurrieron?"'
      },
      disqualifying_positive: {
        name: 'Descalificación de lo Positivo',
        description: 'Rechazar experiencias positivas insistiendo en que no cuentan',
        examples: ['no cuenta', 'fue suerte', 'no es importante'],
        patterns: [
          /(?:no.*cuenta|fue.*suerte|no.*es.*importante|eso.*no.*significa.*nada|fue.*casualidad)/i,
          /(?:cualquiera.*podría|no.*merecía|no.*lo.*hice.*bien)/i
        ],
        intervention: 'Validar logros. Preguntar: "¿Qué evidencia hay de que esto sí cuenta?"'
      },
      jumping_to_conclusions: {
        name: 'Saltar a Conclusiones',
        description: 'Hacer interpretaciones negativas sin evidencia definitiva',
        examples: ['leer la mente', 'adivinar el futuro'],
        patterns: [
          /(?:seguro.*que|probablemente|debe.*ser|sin.*duda.*va.*a|sé.*que.*va.*a.*pasar)/i,
          /(?:él.*piensa.*que|ella.*cree.*que|me.*están.*juzgando)/i
        ],
        intervention: 'Buscar evidencia. Preguntar: "¿Qué evidencia tienes de eso? ¿Hay otras explicaciones posibles?"'
      },
      mind_reading: {
        name: 'Lectura de Mente',
        description: 'Asumir que sabes qué están pensando los demás',
        examples: ['sé que piensa mal de mí', 'está enojado conmigo'],
        patterns: [
          /(?:sé.*que.*piensa|él.*cree.*que|ella.*piensa.*que|están.*pensando.*que)/i,
          /(?:me.*están.*juzgando|piensan.*mal.*de.*mí|me.*desprecian)/i
        ],
        intervention: 'Verificar suposiciones. Preguntar: "¿Cómo sabes eso? ¿Has preguntado directamente?"'
      },
      fortune_telling: {
        name: 'Adivinación del Futuro',
        description: 'Predecir que las cosas saldrán mal',
        examples: ['va a ser terrible', 'no va a funcionar', 'va a salir mal'],
        patterns: [
          /(?:va.*a.*ser.*terrible|no.*va.*a.*funcionar|va.*a.*salir.*mal|será.*un.*desastre)/i,
          /(?:seguro.*que.*fallo|probablemente.*no.*puedo|imposible.*que.*funcione)/i
        ],
        intervention: 'Cuestionar predicciones. Preguntar: "¿Qué evidencia hay de que saldrá mal? ¿Qué podría salir bien?"'
      },
      magnification_minimization: {
        name: 'Magnificación/Minimización',
        description: 'Exagerar lo negativo y minimizar lo positivo',
        examples: ['es terrible', 'no es nada', 'es lo peor'],
        patterns: [
          /(?:es.*terrible|es.*horrible|es.*lo.*peor|catastrófico|desastre.*total)/i,
          /(?:no.*es.*nada|no.*importa|es.*insignificante|minimizar.*lo.*bueno)/i
        ],
        intervention: 'Reevaluar proporción. Preguntar: "¿Qué tan grande es realmente esto? ¿Qué diría un amigo?"'
      },
      catastrophizing: {
        name: 'Catastrofismo',
        description: 'Esperar el peor resultado posible',
        examples: ['será un desastre', 'lo peor que puede pasar', 'todo va a salir mal'],
        patterns: [
          /(?:será.*un.*desastre|lo.*peor.*que.*puede.*pasar|catástrofe|terrible.*consecuencia)/i,
          /(?:y.*si.*pasa.*lo.*peor|todo.*va.*a.*salir.*mal|va.*a.*ser.*horrible)/i
        ],
        intervention: 'Explorar probabilidades. Preguntar: "¿Qué tan probable es realmente? ¿Qué otras posibilidades hay?"'
      },
      emotional_reasoning: {
        name: 'Razonamiento Emocional',
        description: 'Asumir que las emociones negativas reflejan la realidad',
        examples: ['me siento mal, entonces es malo', 'si siento miedo, es peligroso'],
        patterns: [
          /(?:me.*siento.*mal.*entonces|si.*siento.*miedo|como.*me.*siento.*mal)/i,
          /(?:debe.*ser.*malo.*porque.*me.*siento|si.*siento.*culpa.*es.*porque)/i
        ],
        intervention: 'Separar emoción de realidad. Preguntar: "¿Qué evidencia objetiva hay, independiente de cómo te sientes?"'
      },
      should_statements: {
        name: 'Declaraciones de "Debería"',
        description: 'Usar "debería", "tengo que", "debo" de manera rígida',
        examples: ['debería ser perfecto', 'tengo que hacerlo bien', 'debo complacer a todos'],
        patterns: [
          /(?:debería|tengo.*que|debo|tendría.*que|tiene.*que.*ser)/i,
          /(?:siempre.*debo|nunca.*debería|tengo.*que.*ser.*perfecto)/i
        ],
        intervention: 'Flexibilizar expectativas. Preguntar: "¿Qué pasaría si no fuera así? ¿De dónde viene este 'debería'?"'
      },
      labeling: {
        name: 'Etiquetado',
        description: 'Etiquetarse a uno mismo o a otros de manera negativa',
        examples: ['soy un fracaso', 'es un idiota', 'soy inútil'],
        patterns: [
          /(?:soy.*un.*fracaso|soy.*inútil|soy.*un.*desastre|soy.*tonto|soy.*malo)/i,
          /(?:él.*es.*un|ella.*es.*una|son.*unos)/i
        ],
        intervention: 'Desetiquetar. Preguntar: "¿Qué acciones específicas te llevan a esa conclusión? ¿Eres solo eso?"'
      },
      personalization: {
        name: 'Personalización',
        description: 'Asumir responsabilidad por eventos fuera de tu control',
        examples: ['es mi culpa', 'debería haberlo evitado', 'todo es por mí'],
        patterns: [
          /(?:es.*mi.*culpa|debería.*haberlo.*evitado|todo.*es.*por.*mí|si.*yo.*hubiera)/i,
          /(?:soy.*responsable.*de|mi.*culpa.*que|por.*mi.*causa)/i
        ],
        intervention: 'Reevaluar responsabilidad. Preguntar: "¿Qué parte es realmente tu responsabilidad? ¿Qué factores externos influyeron?"'
      },
      blame: {
        name: 'Culpar',
        description: 'Culpar a otros por tus problemas emocionales',
        examples: ['es su culpa', 'ellos me hacen sentir mal', 'si no fuera por ellos'],
        patterns: [
          /(?:es.*su.*culpa|ellos.*me.*hacen|si.*no.*fuera.*por.*ellos|por.*culpa.*de)/i,
          /(?:me.*hacen.*sentir|me.*obligan|me.*fuerzan)/i
        ],
        intervention: 'Enfocarse en lo controlable. Preguntar: "¿Qué puedes controlar tú? ¿Cómo puedes responder de manera diferente?"'
      },
      unfair_comparison: {
        name: 'Comparación Injusta',
        description: 'Compararse con otros de manera desfavorable',
        examples: ['ellos son mejores', 'yo no soy tan bueno', 'todos lo hacen mejor'],
        patterns: [
          /(?:ellos.*son.*mejores|yo.*no.*soy.*tan.*bueno|todos.*lo.*hacen.*mejor)/i,
          /(?:comparado.*con|otros.*son|mientras.*que.*yo)/i
        ],
        intervention: 'Reevaluar comparaciones. Preguntar: "¿Es una comparación justa? ¿Qué ventajas tienes tú?"'
      },
      regret_orientation: {
        name: 'Orientación al Arrepentimiento',
        description: 'Enfocarse en lo que deberías haber hecho en lugar de lo que puedes hacer ahora',
        examples: ['debería haber', 'si hubiera', 'me arrepiento de'],
        patterns: [
          /(?:debería.*haber|si.*hubiera|me.*arrepiento.*de|ojalá.*hubiera)/i,
          /(?:si.*solo.*hubiera|por.*qué.*no.*hice)/i
        ],
        intervention: 'Enfocarse en el presente. Preguntar: "¿Qué puedes hacer ahora? ¿Qué aprendiste de esa experiencia?"'
      },
      what_if: {
        name: 'Pensamiento "Qué Si"',
        description: 'Preocuparse constantemente por posibilidades negativas',
        examples: ['qué si pasa', 'qué si fallo', 'qué si sale mal'],
        patterns: [
          /(?:qué.*si.*pasa|qué.*si.*fallo|qué.*si.*sale.*mal|y.*si)/i,
          /(?:qué.*pasaría.*si|imagínate.*si)/i
        ],
        intervention: 'Enfocarse en el presente. Preguntar: "¿Qué está pasando ahora? ¿Qué puedes hacer con lo que tienes?"'
      }
    };
  }

  /**
   * Detecta distorsiones cognitivas en el contenido del mensaje
   * @param {string} content - Contenido del mensaje
   * @returns {Array} Array de distorsiones detectadas con detalles
   */
  detectDistortions(content) {
    // SEGURIDAD: Validar input
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return [];
    }

    // SEGURIDAD: Limitar longitud para evitar ReDoS
    const maxLength = 10000;
    const safeContent = content.length > maxLength 
      ? content.substring(0, maxLength) 
      : content;

    const contentLower = safeContent.toLowerCase();
    const detectedDistortions = [];

    // Verificar cada distorsión
    for (const [key, distortion] of Object.entries(this.distortions)) {
      let matched = false;
      let matchedPattern = null;

      // Verificar si algún patrón coincide
      for (const pattern of distortion.patterns) {
        if (pattern.test(contentLower)) {
          matched = true;
          matchedPattern = pattern.toString();
          break;
        }
      }

      if (matched) {
        detectedDistortions.push({
          type: key,
          name: distortion.name,
          description: distortion.description,
          intervention: distortion.intervention,
          confidence: this.calculateConfidence(contentLower, distortion.patterns),
          matchedPattern: matchedPattern
        });
      }
    }

    // Ordenar por confianza (mayor a menor)
    return detectedDistortions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calcula la confianza de la detección basada en múltiples factores
   * @param {string} content - Contenido del mensaje
   * @param {Array} patterns - Patrones de la distorsión
   * @returns {number} Confianza (0-1)
   */
  calculateConfidence(content, patterns) {
    let matches = 0;
    let totalPatterns = patterns.length;

    patterns.forEach(pattern => {
      if (pattern.test(content)) {
        matches++;
      }
    });

    // Confianza base basada en número de coincidencias
    let confidence = matches / totalPatterns;

    // Aumentar confianza si hay múltiples palabras clave relacionadas
    const keywordDensity = this.calculateKeywordDensity(content, patterns);
    confidence = Math.min(confidence + (keywordDensity * 0.2), 1.0);

    return Math.round(confidence * 100) / 100;
  }

  /**
   * Calcula la densidad de palabras clave relacionadas
   * @param {string} content - Contenido del mensaje
   * @param {Array} patterns - Patrones
   * @returns {number} Densidad (0-1)
   */
  calculateKeywordDensity(content, patterns) {
    let totalMatches = 0;
    const words = content.split(/\s+/);
    
    patterns.forEach(pattern => {
      const regex = new RegExp(pattern.source, 'i');
      words.forEach(word => {
        if (regex.test(word)) {
          totalMatches++;
        }
      });
    });

    return Math.min(totalMatches / words.length, 1.0);
  }

  /**
   * Obtiene la distorsión más prominente
   * @param {string} content - Contenido del mensaje
   * @returns {Object|null} Distorsión más prominente o null
   */
  getPrimaryDistortion(content) {
    const distortions = this.detectDistortions(content);
    return distortions.length > 0 ? distortions[0] : null;
  }

  /**
   * Genera una intervención sugerida basada en las distorsiones detectadas
   * @param {Array} distortions - Distorsiones detectadas
   * @returns {string} Intervención sugerida
   */
  generateIntervention(distortions) {
    if (!distortions || distortions.length === 0) {
      return null;
    }

    const primaryDistortion = distortions[0];
    return {
      distortion: primaryDistortion.name,
      intervention: primaryDistortion.intervention,
      allDetected: distortions.map(d => d.name)
    };
  }

  /**
   * Obtiene información sobre una distorsión específica
   * @param {string} distortionType - Tipo de distorsión
   * @returns {Object|null} Información de la distorsión
   */
  getDistortionInfo(distortionType) {
    return this.distortions[distortionType] || null;
  }

  /**
   * Obtiene todas las distorsiones disponibles
   * @returns {Object} Todas las distorsiones
   */
  getAllDistortions() {
    return this.distortions;
  }
}

export default new CognitiveDistortionDetector();

