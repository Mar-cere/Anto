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
        patterns: /(?:salud|enfermedad|dolor|duele|dolores|síntoma|médico|doctor|hospital|medicina|tratamiento|terapia|físico|mental|psicológico|ansiedad|depresión|fatiga|energía|comer|alimentación|peso|ejercicio|gimnasio|me.*duele|tengo.*dolor|dolor.*de|duele.*la|duele.*el|duele.*mi)/i,
        keywords: ['salud', 'enfermedad', 'dolor', 'duele', 'médico', 'terapia']
      },
      sueño: {
        patterns:
          /(?:insomnio|no\s+(?:puedo|lograr|consigo)\s+dormir|me\s+cuesta\s+(?:dormir(?:me|te|se)?|despertar)|problemas?\s+para\s+dormir|dormir\s+mal|falta\s+de\s+(?:sueño|descanso)|no\s+descanso|sueño\s+cortado|antes\s+de\s+acost|rutina\s+nocturna|despert(?:ar|é|arse)|conciliar\s+el\s+sueño|dormir(?:me|te)?)/i,
        keywords: ['insomnio', 'dormir', 'dormirme', 'despertar', 'descansar', 'acostarme', 'acostarte'],
      },
      autoimagen: {
        patterns: /(?:autoestima|autoimagen|me.*siento.*fe(?:o|a)|no.*me.*gusto|no.*me.*gusta.*cómo.*me.*veo|no.*me.*gusta.*mi.*apariencia|mi.*cuerpo|mi.*apariencia|soy.*[a-z]+|no.*valgo|no.*sirvo|inútil|incompetente|no.*soy.*capaz|me.*siento.*inadecuad(?:o|a)|me.*siento.*menos|inferior|cómo.*me.*veo|mi.*aspecto|mi.*físico)/i,
        keywords: ['autoestima', 'autoimagen', 'apariencia', 'cuerpo', 'valgo', 'veo']
      },
      futuro: {
        patterns: /(?:futuro|mañana|próximo|siguiente|plan|meta|objetivo|aspiración|esperanza|miedo.*al.*futuro|ansiedad.*por.*el.*futuro|qué.*pasará|incertidumbre)/i,
        keywords: ['futuro', 'mañana', 'plan', 'meta', 'objetivo', 'aspiración']
      },
      pasado: {
        patterns: /(?:pasado|ayer|antes|anterior|recuerdo|memoria|trauma|experiencia.*pasada|lo.*que.*pasó|lo.*que.*ocurrió|historia)/i,
        keywords: ['pasado', 'ayer', 'recuerdo', 'memoria', 'trauma']
      },
      soledad: {
        patterns:
          /(?:\bsoledad\b|aislado|desconectado|sin\s+compañía|nadie\s+me\s+entiende|me\s+siento\s+sol[oa]\b|abandonad(?:o|a)|me\s+siento\s+abandonad(?:o|a)|vacío\s+social)/i,
        keywords: ['soledad', 'aislado', 'desconectado', 'me siento solo', 'me siento sola'],
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
      
      // Contar keywords (evitar matches parciales tipo "solo" dentro de otras palabras)
      for (const keyword of config.keywords) {
        const kw = String(keyword || '').toLowerCase();
        if (!kw) continue;
        if (kw.includes(' ')) {
          if (contentLower.includes(kw)) score += 1;
        } else if (new RegExp(`(?:^|[^\\p{L}])${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[^\\p{L}]|$)`, 'iu').test(contentLower)) {
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
        const kw = String(keyword || '').toLowerCase();
        if (!kw) continue;
        if (kw.includes(' ')) {
          if (contentLower.includes(kw)) score += 1;
        } else if (new RegExp(`(?:^|[^\\p{L}])${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[^\\p{L}]|$)`, 'iu').test(contentLower)) {
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

