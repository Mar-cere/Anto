/**
 * Servicio de grounding: extracción de hechos explícitos del usuario.
 * Solo incluye información que el usuario mencionó directamente en su historial.
 * 
 * ## Performance
 * 
 * Este servicio consulta el historial de mensajes del usuario para extraer hechos.
 * Para optimizar el rendimiento, se recomienda tener los siguientes índices en MongoDB:
 * 
 * ```javascript
 * db.messages.createIndex({ userId: 1, role: 1, createdAt: -1 });
 * ```
 * 
 * Este índice compuesto optimiza la query principal de `extractKnownFacts` que filtra
 * por userId, role='user' y ordena por createdAt descendente.
 * 
 * ## Límites de extracción
 * 
 * - Máximo 20 hechos extraídos por llamada
 * - Máximo 100 mensajes consultados en el historial
 * - Lookback de 30 días desde la fecha actual
 * - Mensajes de menos de 10 caracteres son ignorados
 * - Snippet final limitado a 1000 caracteres totales
 */

import Message from '../models/Message.js';
import UserFact from '../models/UserFact.js';
import { buildKnownFactsSnippet } from './chat/groundingPolicySnippet.js';

const FACT_CATEGORIES = {
  WORK: ['trabajo', 'laboral', 'empleo', 'jefe', 'colega', 'empresa', 'oficina', 'job', 'work', 'office', 'boss', 'colleague'],
  FAMILY: ['familia', 'madre', 'padre', 'hermano', 'hermana', 'hijo', 'hija', 'pareja', 'esposo', 'esposa', 'family', 'mother', 'father', 'sibling', 'child', 'partner', 'spouse'],
  STUDY: ['estudio', 'universidad', 'carrera', 'examen', 'profesor', 'study', 'university', 'exam', 'professor', 'school'],
  HEALTH: ['salud', 'médico', 'tratamiento', 'medicación', 'terapia', 'health', 'doctor', 'treatment', 'medication', 'therapy'],
  RELATIONSHIPS: ['amigo', 'amistad', 'relación', 'ex', 'friend', 'relationship', 'dating', 'breakup'],
};

/**
 * Patrones para extraer hechos biográficos explícitos del texto del usuario.
 * Solo capturan afirmaciones directas, no inferencias. Capturan máximo 3 palabras.
 * Usa Unicode property escapes (\p{L} para letras) con flag 'u' para soporte completo de acentos/ñ.
 */
const BIOGRAPHICAL_PATTERNS = [
  // Trabajo/profesión - captura 1-3 palabras después del indicador
  {
    pattern: /(?:trabajo|laboro)\s+(?:en|como|de)\s+([\p{L}\p{N}]+(?:\s+[\p{L}\p{N}]+){0,2})/iu,
    category: 'work',
    template: (m, lang) => (lang === 'en' ? `Works as/in ${m[1].trim()}` : `Trabaja como/en ${m[1].trim()}`),
  },
  {
    pattern: /soy\s+([\p{L}\p{N}]+(?:\s+[\p{L}\p{N}]+){0,2})\s+(?:de profesión|profesional)/iu,
    category: 'work',
    template: (m, lang) => (lang === 'en' ? `Is a ${m[1].trim()}` : `Es ${m[1].trim()}`),
  },
  {
    pattern: /i\s+work\s+(?:as|in)\s+([\p{L}\p{N}]+(?:\s+[\p{L}\p{N}]+){0,2})/iu,
    category: 'work',
    template: (m, lang) => (lang === 'en' ? `Works as/in ${m[1].trim()}` : `Trabaja como/en ${m[1].trim()}`),
  },

  // Familia
  {
    pattern: /tengo\s+(\d+)\s+(hijo|hija|hermano|hermana)s?/iu,
    category: 'family',
    template: (m, lang) =>
      lang === 'en' ? `Has ${m[1]} ${m[2] === 'hijo' || m[2] === 'hija' ? 'child' : 'sibling'}(s)` : `Tiene ${m[1]} ${m[2]}(s)`,
  },
  {
    pattern: /vivo\s+con\s+(?:mi|mis)\s+([\p{L}\p{N}]+(?:\s+[\p{L}\p{N}]+){0,2})/iu,
    category: 'family',
    template: (m, lang) => (lang === 'en' ? `Lives with ${m[1].trim()}` : `Vive con ${m[1].trim()}`),
  },
  {
    pattern: /i\s+have\s+(\d+)\s+(child|children|sibling|siblings)/iu,
    category: 'family',
    template: (m, lang) => (lang === 'en' ? `Has ${m[1]} ${m[2]}` : `Tiene ${m[1]} ${m[2] === 'child' || m[2] === 'children' ? 'hijo(s)' : 'hermano(s)'}`),
  },
  {
    pattern: /i\s+live\s+with\s+(?:my\s+)?([\p{L}\p{N}]+(?:\s+[\p{L}\p{N}]+){0,2})/iu,
    category: 'family',
    template: (m, lang) => (lang === 'en' ? `Lives with ${m[1].trim()}` : `Vive con ${m[1].trim()}`),
  },

  // Estudio
  {
    pattern: /estudio\s+([\p{L}\p{N}]+(?:\s+[\p{L}\p{N}]+){0,3})/iu,
    category: 'study',
    template: (m, lang) => (lang === 'en' ? `Studies ${m[1].trim()}` : `Estudia ${m[1].trim()}`),
  },
  {
    pattern: /i\s+(?:study|am\s+studying)\s+([\p{L}\p{N}]+(?:\s+[\p{L}\p{N}]+){0,3})/iu,
    category: 'study',
    template: (m, lang) => (lang === 'en' ? `Studies ${m[1].trim()}` : `Estudia ${m[1].trim()}`),
  },

  // Compromisos/metas (solo afirmaciones muy explícitas)
  {
    pattern: /me\s+propuse\s+([\p{L}\p{N}]+(?:\s+[\p{L}\p{N}]+){1,5})/iu,
    category: 'commitment',
    template: (m, lang) => (lang === 'en' ? `Committed to ${m[1].trim()}` : `Se propuso ${m[1].trim()}`),
  },
  {
    pattern: /voy\s+a\s+empezar\s+(?:a\s+)?([\p{L}\p{N}]+(?:\s+[\p{L}\p{N}]+){1,5})/iu,
    category: 'commitment',
    template: (m, lang) => (lang === 'en' ? `Plans to start ${m[1].trim()}` : `Planea empezar ${m[1].trim()}`),
  },
  {
    pattern: /i\s+plan\s+to\s+([\p{L}\p{N}]+(?:\s+[\p{L}\p{N}]+){1,5})/iu,
    category: 'commitment',
    template: (m, lang) => (lang === 'en' ? `Plans to ${m[1].trim()}` : `Planea ${m[1].trim()}`),
  },
];

/**
 * Límites de configuración para extracción de hechos
 */
const EXTRACTION_LIMITS = {
  MIN_LIMIT: 1,
  MAX_LIMIT: 20,
  DEFAULT_LIMIT: 10,
  MAX_MESSAGE_LOOKBACK: 100,
  DAYS_LOOKBACK: 30,
  MIN_CONTENT_LENGTH: 10,
  MAX_FACT_LENGTH: 150,
  MIN_FACT_LENGTH: 5,
};

/**
 * Extrae hechos conocidos del historial del usuario.
 * Solo incluye información explícita mencionada por el usuario.
 *
 * @param {string} userId - ID del usuario
 * @param {string} conversationId - ID de la conversación actual (opcional)
 * @param {number} limit - Máximo número de hechos a retornar
 * @returns {Promise<Array>} Lista de hechos estructurados
 */
export async function extractKnownFacts(userId, conversationId = null, limit = EXTRACTION_LIMITS.DEFAULT_LIMIT) {
  // Validación de userId
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    console.warn('[userFactsGroundingService] userId is required and must be a non-empty string');
    return [];
  }

  // Validación y normalización de limit
  const safeLimit = Math.min(
    Math.max(EXTRACTION_LIMITS.MIN_LIMIT, Math.floor(Number(limit) || EXTRACTION_LIMITS.DEFAULT_LIMIT)),
    EXTRACTION_LIMITS.MAX_LIMIT
  );

  if (safeLimit !== limit) {
    console.warn(`[userFactsGroundingService] limit adjusted from ${limit} to ${safeLimit}`);
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - EXTRACTION_LIMITS.DAYS_LOOKBACK * 24 * 60 * 60 * 1000);

    const messages = await Message.find({
      userId,
      role: 'user',
      createdAt: { $gte: thirtyDaysAgo },
    })
      .sort({ createdAt: -1 })
      .limit(EXTRACTION_LIMITS.MAX_MESSAGE_LOOKBACK)
      .select('content createdAt metadata conversationId')
      .lean();

    if (!messages || messages.length === 0) return [];

    const facts = [];
    const seenFacts = new Set();

    for (const msg of messages) {
      const content = msg.content || '';
      if (content.length < EXTRACTION_LIMITS.MIN_CONTENT_LENGTH) continue;

      const contentLower = content.toLowerCase();
      const msgLanguage = detectMessageLanguage(contentLower);

      for (const { pattern, category, template } of BIOGRAPHICAL_PATTERNS) {
        const match = content.match(pattern);
        if (match) {
          const rawFact = template(match, msgLanguage);
          const fact = sanitizeFact(rawFact);
          
          // Validar tanto el hecho sanitizado como el contexto original
          if (!fact || !isValidFact(fact) || !isValidFactContext(content)) {
            continue;
          }
          
          const factKey = `${category}:${fact.toLowerCase()}`;

          if (!seenFacts.has(factKey)) {
            seenFacts.add(factKey);
            facts.push({
              fact,
              category,
              context: new Date(msg.createdAt).toLocaleDateString('es-ES'),
              conversationId: msg.conversationId,
              messageId: msg._id,
            });

            if (facts.length >= safeLimit) break;
          }
        }
      }

      if (facts.length >= safeLimit) break;
    }

    // Filtrar hechos obsoletos o conflictivos
    const filteredFacts = filterObsoleteAndConflictingFacts(facts);

    return filteredFacts.slice(0, safeLimit);
  } catch (error) {
    console.error('[userFactsGroundingService] Error extracting facts:', error);
    return [];
  }
}

/**
 * Detecta si dos hechos son potencialmente conflictivos (misma categoría pero diferente información)
 */
function areFactsConflicting(fact1, fact2) {
  if (fact1.category !== fact2.category) return false;
  
  // Normalizar y tokenizar, removiendo palabras comunes de estructura
  const stopWords = new Set(['trabajo', 'trabaja', 'como', 'en', 'de', 'la', 'el', 'un', 'una', 'works', 'as', 'in', 'the', 'a', 'an']);
  
  const words1 = fact1.fact.toLowerCase().split(/\s+/).filter(w => !stopWords.has(w) && w.length > 2);
  const words2 = fact2.fact.toLowerCase().split(/\s+/).filter(w => !stopWords.has(w) && w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return false;
  
  // Calcular similitud basada en palabras sustantivas
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = [...set1].filter(word => set2.has(word)).length;
  const union = new Set([...set1, ...set2]).size;
  
  // Si la similitud es baja (< 20%), considerar conflictivo
  const similarity = union > 0 ? intersection / union : 0;
  return similarity < 0.2;
}


/**
 * Filtra hechos obsoletos o conflictivos, priorizando los más recientes
 */
function filterObsoleteAndConflictingFacts(facts) {
  if (facts.length <= 1) return facts;
  
  const filtered = [];
  
  for (const currentFact of facts) {
    let shouldInclude = true;
    
    // Verificar si hay un hecho más reciente que lo contradice
    for (const existingFact of filtered) {
      if (areFactsConflicting(currentFact, existingFact)) {
        // Ya tenemos un hecho de la misma categoría que es más reciente
        // (filtered está ordenado por recencia, los primeros son más nuevos)
        shouldInclude = false;
        console.warn(
          `[userFactsGroundingService] Skipping potentially obsolete fact: "${currentFact.fact}" ` +
          `(conflicts with "${existingFact.fact}")`
        );
        break;
      }
    }
    
    if (shouldInclude) {
      filtered.push(currentFact);
    }
  }
  
  return filtered;
}

function detectMessageLanguage(contentLower) {
  const englishIndicators = ['i am', 'i have', 'i work', 'i study', 'my job', 'my family'];
  const spanishIndicators = ['soy', 'tengo', 'trabajo', 'estudio', 'mi trabajo', 'mi familia'];

  const englishScore = englishIndicators.filter((ind) => contentLower.includes(ind)).length;
  const spanishScore = spanishIndicators.filter((ind) => contentLower.includes(ind)).length;

  return englishScore > spanishScore ? 'en' : 'es';
}

/**
 * Sanitiza un hecho extraído para prevenir inyección de prompt y problemas de formato
 */
function sanitizeFact(fact) {
  if (!fact || typeof fact !== 'string') return '';
  
  let sanitized = fact
    .replace(/[\r\n\t]+/g, ' ') // Eliminar saltos de línea y tabs
    .replace(/\s+/g, ' ') // Normalizar espacios múltiples
    .replace(/[<>{}]/g, '') // Remover caracteres problemáticos
    .trim();
  
  // Limitar longitud
  if (sanitized.length > EXTRACTION_LIMITS.MAX_FACT_LENGTH) {
    sanitized = sanitized.substring(0, EXTRACTION_LIMITS.MAX_FACT_LENGTH - 3) + '...';
  }
  
  return sanitized;
}

/**
 * Valida que el contexto del mensaje no contenga contenido sensible que descalifique el hecho
 */
function isValidFactContext(messageContent) {
  if (!messageContent) return false;
  
  // Filtros de contenido sensible que descalifican todo el mensaje
  const invalidPatterns = [
    /(suicid|muerte|morir|matar|kill|die|death)/i,
    /(droga|alcohol|cocaína|heroína|marihuana|adicci[oó]n|drug|cocaine|heroin)/i,
    /(abus|maltrat|violen|golpe|abuse|violent|beat)/i,
    /(hospital|emergencia|ambulancia|emergency)/i,
    /\b(911|112)\b/, // Números de emergencia
  ];
  
  // Filtros de PII sensible que descalifican el mensaje
  const piiPatterns = [
    /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/, // Números de teléfono
    /\d{3}-\d{2}-\d{4}/, // SSN
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, // Emails
    /\d{1,5}\s+[\w\s]{1,30}\b(street|st|avenue|ave|road|rd|calle|avenida)\b/i, // Direcciones
  ];
  
  return (
    !invalidPatterns.some((pattern) => pattern.test(messageContent)) &&
    !piiPatterns.some((pattern) => pattern.test(messageContent))
  );
}

/**
 * Valida que el hecho extraído sea útil y no contenga contenido problemático
 */
function isValidFact(fact) {
  if (!fact || fact.length < EXTRACTION_LIMITS.MIN_FACT_LENGTH || fact.length > EXTRACTION_LIMITS.MAX_FACT_LENGTH) {
    return false;
  }

  // Verificación adicional: el hecho en sí no debe tener restos de PII
  const piiPatterns = [
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // Números de teléfono
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  ];

  return !piiPatterns.some((pattern) => pattern.test(fact));
}

/**
 * Construye el snippet completo de hechos conocidos para inyectar en el prompt.
 *
 * @param {string} userId - ID del usuario
 * @param {string} conversationId - ID de la conversación (opcional)
 * @param {string} language - Idioma del snippet ('es' | 'en')
 * @returns {Promise<string>} Snippet de hechos conocidos o string vacío
 */
export async function buildFactsSnippetForPrompt(userId, conversationId = null, language = 'es') {
  if (!userId) return '';

  const facts = await extractKnownFacts(userId, conversationId);

  if (facts.length === 0) return '';

  return buildKnownFactsSnippet(facts, language);
}

/**
 * Obtiene los hechos biográficos manuales del usuario (registrados vía API).
 * Estos hechos tienen prioridad sobre los extraídos automáticamente.
 * 
 * @param {string} userId - ID del usuario
 * @param {number} limit - Máximo número de hechos a retornar
 * @returns {Promise<Array>} Lista de hechos estructurados
 */
export async function getManualUserFacts(userId, limit = EXTRACTION_LIMITS.MAX_LIMIT) {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    return [];
  }

  try {
    const manualFacts = await UserFact.find({
      userId,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('fact category source createdAt')
      .lean();

    return manualFacts.map((f) => ({
      fact: f.fact,
      category: f.category,
      context: new Date(f.createdAt).toLocaleDateString('es-ES'),
      source: f.source || 'user',
    }));
  } catch (error) {
    console.error('[userFactsGroundingService] Error fetching manual facts:', error);
    return [];
  }
}

/**
 * Combina hechos manuales y extraídos automáticamente, priorizando los manuales.
 * Elimina duplicados (hechos con contenido muy similar).
 * 
 * @param {string} userId - ID del usuario
 * @param {string} conversationId - ID de la conversación (opcional)
 * @param {string} language - Idioma del snippet ('es' | 'en')
 * @param {number} maxFacts - Máximo número de hechos en el snippet final
 * @returns {Promise<string>} Snippet combinado de hechos conocidos
 */
export async function buildCombinedFactsSnippet(userId, conversationId = null, language = 'es', maxFacts = 15) {
  if (!userId) return '';

  try {
    // Obtener hechos manuales (prioridad alta)
    const manualFacts = await getManualUserFacts(userId, maxFacts);

    // Calcular cuántos hechos extraídos podemos añadir
    const remainingSlots = maxFacts - manualFacts.length;

    if (remainingSlots <= 0) {
      // Si ya tenemos suficientes hechos manuales, solo usar esos
      return buildKnownFactsSnippet(manualFacts, language);
    }

    // Obtener hechos extraídos para completar
    const extractedFacts = await extractKnownFacts(userId, conversationId, remainingSlots);

    // Combinar: manuales primero, luego extraídos (evitando duplicados)
    const combinedFacts = [...manualFacts];
    const seenFactContent = new Set(manualFacts.map((f) => f.fact.toLowerCase().trim()));

    for (const extractedFact of extractedFacts) {
      const normalizedContent = extractedFact.fact.toLowerCase().trim();
      
      // Evitar duplicados exactos
      if (!seenFactContent.has(normalizedContent)) {
        seenFactContent.add(normalizedContent);
        combinedFacts.push(extractedFact);
      }

      if (combinedFacts.length >= maxFacts) break;
    }

    if (combinedFacts.length === 0) return '';

    return buildKnownFactsSnippet(combinedFacts, language);
  } catch (error) {
    console.error('[userFactsGroundingService] Error building combined facts snippet:', error);
    return '';
  }
}
