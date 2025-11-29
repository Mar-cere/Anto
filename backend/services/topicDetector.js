/**
 * Detector de Temas y Contextos
 * Detecta el tema principal del mensaje (relaciones, trabajo, salud, etc.)
 */
class TopicDetector {
  constructor() {
    // Patrones para detectar temas
    this.topics = {
      relaciones: {
        patterns: /(?:pareja|novi(?:o|a)|espos(?:o|a)|relación|amor|amante|romance|matrimonio|divorcio|separación|ruptura|conflicto.*con.*[a-z]+|discusión.*con.*[a-z]+|pelea.*con.*[a-z]+|amig(?:o|a|os|as)|amistad|amigos|familia|padre|madre|herman(?:o|a|os|as)|hij(?:o|a|os|as)|familiar|parentesco)/i,
        keywords: ['pareja', 'amor', 'amistad', 'familia', 'relación']
      },
      trabajo: {
        patterns: /(?:trabajo|empleo|jefe|compañero.*de.*trabajo|colega|oficina|proyecto|tarea|deadline|reunión|presentación|despedid(?:o|a)|despido|ascenso|promoción|carrera|profesión|estudio|universidad|colegio|examen|prueba|tarea|deberes|profesor|maestro)/i,
        keywords: ['trabajo', 'empleo', 'estudio', 'carrera', 'examen']
      },
      salud: {
        patterns: /(?:salud|enfermedad|dolor|síntoma|médico|doctor|hospital|medicina|tratamiento|terapia|físico|mental|psicológico|ansiedad|depresión|insomnio|fatiga|energía|dormir|comer|alimentación|peso|ejercicio|gimnasio)/i,
        keywords: ['salud', 'enfermedad', 'dolor', 'médico', 'terapia']
      },
      autoimagen: {
        patterns: /(?:autoestima|autoimagen|me.*siento.*fe(?:o|a)|no.*me.*gusto|mi.*cuerpo|mi.*apariencia|soy.*[a-z]+|no.*valgo|no.*sirvo|inútil|incompetente|no.*soy.*capaz|me.*siento.*inadecuad(?:o|a)|me.*siento.*menos|inferior)/i,
        keywords: ['autoestima', 'autoimagen', 'apariencia', 'cuerpo', 'valgo']
      },
      futuro: {
        patterns: /(?:futuro|mañana|próximo|siguiente|plan|meta|objetivo|sueño|aspiración|esperanza|miedo.*al.*futuro|ansiedad.*por.*el.*futuro|qué.*pasará|incertidumbre)/i,
        keywords: ['futuro', 'mañana', 'plan', 'meta', 'objetivo']
      },
      pasado: {
        patterns: /(?:pasado|ayer|antes|anterior|recuerdo|memoria|trauma|experiencia.*pasada|lo.*que.*pasó|lo.*que.*ocurrió|historia)/i,
        keywords: ['pasado', 'ayer', 'recuerdo', 'memoria', 'trauma']
      },
      soledad: {
        patterns: /(?:solo|soledad|aislado|desconectado|sin.*compañía|nadie.*me.*entiende|me.*siento.*solo|abandonad(?:o|a)|me.*siento.*abandonad(?:o|a)|vacío.*social)/i,
        keywords: ['solo', 'soledad', 'aislado', 'desconectado']
      },
      pérdida: {
        patterns: /(?:pérdida|duelo|muerte|fallec(?:ió|ió)|mur(?:ió|ió)|se.*fue|ya.*no.*está|extrañ(?:o|ar)|ech(?:o|ar).*de.*menos|despedida)/i,
        keywords: ['pérdida', 'duelo', 'muerte', 'falleció', 'extraño']
      },
      dinero: {
        patterns: /(?:dinero|finanzas|económico|deuda|pago|gasto|ingreso|salario|sueldo|ahorro|pobreza|riqueza|bancarrota|quiebra)/i,
        keywords: ['dinero', 'finanzas', 'económico', 'deuda']
      },
      general: {
        patterns: /(?:vida|existencia|sentido|propósito|vacío|nada.*tiene.*sentido|para.*qué|qué.*hago|quién.*soy)/i,
        keywords: ['vida', 'sentido', 'propósito', 'existencia']
      }
    };
  }

  /**
   * Detecta el tema principal del mensaje
   * @param {string} content - Contenido del mensaje
   * @returns {string|null} Tema detectado o 'general' si no se detecta ninguno específico
   */
  detectTopic(content) {
    if (!content || typeof content !== 'string') {
      return 'general';
    }

    const contentLower = content.toLowerCase();
    const topicScores = {};

    // Calcular puntuación para cada tema
    for (const [topic, config] of Object.entries(this.topics)) {
      let score = 0;
      
      // Contar coincidencias de patrones
      const patternMatches = (contentLower.match(config.patterns) || []).length;
      score += patternMatches * 2; // Patrones tienen más peso
      
      // Contar keywords
      for (const keyword of config.keywords) {
        if (contentLower.includes(keyword)) {
          score += 1;
        }
      }
      
      if (score > 0) {
        topicScores[topic] = score;
      }
    }

    // Retornar el tema con mayor puntuación
    if (Object.keys(topicScores).length === 0) {
      return 'general';
    }

    const topTopic = Object.entries(topicScores)
      .sort((a, b) => b[1] - a[1])[0][0];

    return topTopic;
  }

  /**
   * Detecta múltiples temas en el mensaje (si hay más de uno)
   * @param {string} content - Contenido del mensaje
   * @returns {Array} Lista de temas detectados ordenados por relevancia
   */
  detectMultipleTopics(content) {
    if (!content || typeof content !== 'string') {
      return ['general'];
    }

    const contentLower = content.toLowerCase();
    const topicScores = {};

    // Calcular puntuación para cada tema
    for (const [topic, config] of Object.entries(this.topics)) {
      let score = 0;
      
      const patternMatches = (contentLower.match(config.patterns) || []).length;
      score += patternMatches * 2;
      
      for (const keyword of config.keywords) {
        if (contentLower.includes(keyword)) {
          score += 1;
        }
      }
      
      if (score > 0) {
        topicScores[topic] = score;
      }
    }

    if (Object.keys(topicScores).length === 0) {
      return ['general'];
    }

    // Retornar temas ordenados por puntuación
    return Object.entries(topicScores)
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic);
  }
}

export default new TopicDetector();

