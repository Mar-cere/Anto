/**
 * Detector de Subtipos Emocionales
 * Detecta micro-emociones y matices dentro de cada emoción principal
 */
class EmotionalSubtypeDetector {
  constructor() {
    this.suppressionRules = {
      tristeza: {
        fracaso: [
          /\bno\s+puedo\s+(?:dormir|descansar|conciliar(?:\s+el)?\s+sueño|pegar\s+ojo|comer|respirar|relajarme|calmarme|apagar\s+mi\s+mente|dejar\s+de\s+pensar)\b/i
        ]
      }
    };

    // Subtipos para cada emoción principal
    this.subtypes = {
      tristeza: {
        duelo: /(?:duelo|pérdida|extrañ(?:o|ar|o.*mucho)|ech(?:o|ar).*de.*menos|ya.*no.*está|se.*fue|mur(?:ió|ió)|fallec(?:ió|ió)|falleció|despedida|despedir|abuela.*falleció|abuela.*murió)/i,
        soledad: /(?:solo|soledad|aislado|desconectado|nadie.*me.*entiende|me.*siento.*solo|sin.*compañía|abandonad(?:o|a)|me.*siento.*abandonad(?:o|a))/i,
        // Cuidado: "no puedo" solo es fracaso cuando va ligado a valía o logro, no a funciones fisiológicas
        // (p. ej. "no puedo dormir" no debe activar plantillas de autodeprecio).
        fracaso:
          /(?:\bsoy\s+(?:un\s+)?fracaso\b|\bme\s+siento\s+(?:como\s+)?(?:un\s+)?fracaso\b|\bfracas(?:o|ado|ada|ados|adas|ar)\b|\bfall(?:é|e|ó|o)(?:\b|\s+(?:en|todo|siempre))|\bno\s+sirvo\b|\bno\s+valgo\b|\b(?:soy\s+|me\s+siento\s+)?inútil\b|incompetente|\bno\s+soy\s+capaz\b|\bno\s+me\s+sale\b|\bno\s+puedo\s+hacer\s+nada(?:\s+bien)?\b|\bno\s+puedo\s+(?:evitarlo|evitar\s+que|hacerlo|seguir|más|evitar\s+fracasar)\b|\bno\s+pude\s+(?:hacerlo|evitarlo|evitar|más|seguir|controlarlo)\b|\bsiempre\s+fallo\b|\bnada\s+me\s+sale\b)/i,
        desesperanza: /(?:sin.*esperanza|sin.*salida|sin.*futuro|no.*tiene.*sentido|para.*qué|no.*vale.*la.*pena|futuro.*negro|sin.*luz)/i,
        vacío: /(?:vacío|vacío.*interior|nada.*me.*llena|sin.*sentido|sin.*propósito|hueco|vacío.*por.*dentro)/i,
        rechazo: /(?:rechazad(?:o|a)|me.*rechazaron|no.*me.*quieren|me.*abandonaron|me.*dejaron|me.*ignoran)/i
      },
      ansiedad: {
        social: /(?:miedo.*social|ansiedad.*social|vergüenza.*social|miedo.*(?:a|de).*hablar|miedo.*(?:a|de).*hablar.*en.*público|hablar.*en.*público|miedo.*a.*gente|me.*juzgan|qué.*pensarán|me.*observan|me.*evalúan|miedo.*a.*ser.*juzgad(?:o|a)|miedo.*a.*la.*opinión)/i,
        anticipatoria: /(?:miedo.*a.*lo.*que.*puede.*pasar|ansiedad.*por.*el.*futuro|preocupación.*por.*mañana|me.*preocupa.*lo.*que.*viene|anticipación.*negativa|me.*preocupa.*mucho.*lo.*que.*puede.*pasar|preocupa.*lo.*que.*puede.*pasar|miedo.*a.*lo.*que.*viene|ansiedad.*por.*mañana)/i,
        rendimiento: /(?:ansiedad.*por.*rendir|miedo.*a.*fallar|presión.*por.*hacerlo.*bien|miedo.*a.*no.*cumplir|ansiedad.*por.*exámenes|ansiedad.*por.*trabajo)/i,
        salud: /(?:ansiedad.*por.*salud|hipocondría|miedo.*a.*enfermar|preocupación.*por.*síntomas|ansiedad.*médica)/i,
        separación: /(?:ansiedad.*de.*separación|miedo.*a.*estar.*solo|miedo.*a.*perder|miedo.*a.*que.*se.*vayan)/i,
        generalizada: /(?:ansiedad.*generalizada|preocupación.*constante|siempre.*preocupad(?:o|a)|ansiedad.*persistente)/i
      },
      enojo: {
        injusticia: /(?:injusticia|injusto|no.*es.*justo|no.*es.*fair|me.*trataron.*mal|me.*hicieron.*daño|me.*perjudicaron)/i,
        límite: /(?:me.*pasaron.*el.*límite|me.*sobrepasaron|ya.*no.*aguanto|ya.*no.*soporto|me.*cans(?:é|e)|estoy.*hart(?:o|a))/i,
        frustración: /(?:frustrad(?:o|a)|frustración|no.*puedo.*hacerlo|no.*me.*sale|no.*funciona|no.*sirve)/i,
        traición: /(?:traicionad(?:o|a)|me.*traicionaron|me.*fallaron|me.*decepcionaron|confi(?:é|e).*y.*me.*fallaron)/i,
        impotencia: /(?:impotencia|no.*puedo.*hacer.*nada|no.*tengo.*control|no.*puedo.*cambiar|estoy.*atrapad(?:o|a))/i
      },
      miedo: {
        fobia: /(?:fobia|miedo.*específico|miedo.*a.*[a-z]+|terror.*a.*[a-z]+|pánico.*a.*[a-z]+)/i,
        anticipatorio: /(?:miedo.*a.*lo.*que.*puede.*pasar|miedo.*al.*futuro|me.*aterra.*pensar|miedo.*a.*mañana)/i,
        abandono: /(?:miedo.*a.*ser.*abandonad(?:o|a)|miedo.*a.*perder|miedo.*a.*que.*se.*vayan|miedo.*al.*rechazo)/i,
        fracaso: /(?:miedo.*a.*fallar|miedo.*a.*fracasar|miedo.*a.*no.*poder|miedo.*a.*no.*ser.*capaz)/i,
        muerte: /(?:miedo.*a.*morir|miedo.*a.*la.*muerte|terror.*a.*morir|miedo.*a.*enfermar.*gravemente)/i
      },
      culpa: {
        autoculpa: /(?:todo.*es.*mi.*culpa|siempre.*arruino|soy.*el.*problema|la.*culpa.*es.*mía|me.*echo.*la.*culpa)/i,
        responsabilidad: /(?:me.*siento.*responsable|debería.*haber|tendría.*que.*haber|no.*hice.*lo.*suficiente)/i,
        daño: /(?:le.*hice.*daño|lastim(?:é|e)|her(?:í|i)|dañ(?:é|e)|perjudiqu(?:é|e))/i,
        omisión: /(?:no.*hice.*nada|debería.*haber.*hecho|no.*actu(?:é|e)|no.*interven(?:í|i))/i
      },
      verguenza: {
        exposición: /(?:me.*da.*vergüenza.*lo.*que.*pasó|me.*avergüenza|exposición.*social|me.*vieron|me.*descubrieron)/i,
        autoimagen: /(?:vergüenza.*de.*mí|me.*da.*vergüenza.*ser.*yo|no.*me.*gusto|me.*siento.*fe(?:o|a)|me.*siento.*inadecuad(?:o|a))/i,
        comportamiento: /(?:vergüenza.*por.*lo.*que.*hice|me.*avergüenza.*mi.*comportamiento|actu(?:é|e).*mal)/i
      },
      alegria: {
        logro: /(?:logr(?:é|e|ar|ado)|complet(?:é|e|ar|ado)|alcanc(?:é|e|ar|ado)|consegu(?:í|i|ir|ido)|triunf(?:é|e|ar|ado)|éxito)/i,
        conexión: /(?:me.*siento.*conectad(?:o|a)|me.*entienden|me.*comprenden|me.*sienten|compartir|compañía)/i,
        gratitud: /(?:agradecid(?:o|a)|gratitud|gracias|afortunad(?:o|a)|bendecid(?:o|a)|tengo.*suerte)/i,
        esperanza: /(?:esperanzad(?:o|a)|optimista|veo.*luz|hay.*esperanza|mejorará|todo.*irá.*bien)/i,
        placer: /(?:disfrut(?:o|ar|ando)|me.*gusta|me.*encanta|me.*divierte|me.*alegra|me.*emociona)/i
      }
    };
  }

  /**
   * Detecta el subtipo de una emoción principal
   * @param {string} emotion - Emoción principal
   * @param {string} content - Contenido del mensaje
   * @returns {string|null} Subtipo detectado o null
   */
  detectSubtype(emotion, content) {
    if (!emotion || !content || typeof content !== 'string') {
      return null;
    }

    const contentLower = content.toLowerCase();
    const emotionSubtypes = this.subtypes[emotion];

    if (!emotionSubtypes) {
      return null;
    }

    // Buscar el subtipo que mejor coincida
    for (const [subtype, pattern] of Object.entries(emotionSubtypes)) {
      if (pattern.test(contentLower)) {
        if (this.shouldSuppressSubtype(emotion, subtype, contentLower)) {
          continue;
        }
        return subtype;
      }
    }

    return null;
  }

  /**
   * Obtiene todos los subtipos posibles para una emoción
   * @param {string} emotion - Emoción principal
   * @returns {Array} Lista de subtipos disponibles
   */
  getAvailableSubtypes(emotion) {
    return this.subtypes[emotion] ? Object.keys(this.subtypes[emotion]) : [];
  }

  /**
   * Evita falsos positivos para combinaciones emoción/subtipo específicas.
   * Sirve como "guardrail" adicional cuando una regex amplia puede coincidir
   * con frases que no representan realmente ese subtipo.
   */
  shouldSuppressSubtype(emotion, subtype, content) {
    if (!emotion || !subtype || !content) return false;

    const rules = this.suppressionRules?.[emotion]?.[subtype];
    if (!Array.isArray(rules) || rules.length === 0) return false;

    return rules.some((rule) => rule.test(content));

  }
}

export default new EmotionalSubtypeDetector();

