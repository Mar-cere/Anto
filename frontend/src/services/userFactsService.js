/**
 * Cliente API para gestión de hechos biográficos del usuario (#63 grounding).
 * Permite crear, listar, actualizar y eliminar hechos que el usuario
 * registra explícitamente para personalizar el asistente.
 */
import { api, ENDPOINTS } from '../config/api';

const VALID_CATEGORIES = new Set([
  'work',
  'family',
  'study',
  'health',
  'relationships',
  'commitment',
  'other',
]);

const VALID_SOURCES = new Set(['user', 'assistant']);

// Límites de configuración
const LIMITS = {
  MIN_FACT_LENGTH: 5,
  MAX_FACT_LENGTH: 150,
  MIN_FETCH_LIMIT: 1,
  MAX_FETCH_LIMIT: 500,
  DEFAULT_FETCH_LIMIT: 100,
};

// Pattern para validar ObjectId de MongoDB (24 caracteres hex)
const OBJECTID_PATTERN = /^[a-f\d]{24}$/i;

/**
 * Sanitiza texto removiendo caracteres problemáticos.
 * @private
 */
function sanitizeText(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/[\r\n\t]+/g, ' ') // Remover saltos de línea y tabs
    .replace(/\s+/g, ' ') // Normalizar espacios múltiples
    .replace(/[<>{}]/g, '') // Remover caracteres problemáticos
    .trim();
}

/**
 * Sanitiza un hecho antes de enviarlo al backend.
 * Protege contra datos inválidos y asegura conformidad con el schema.
 * @private
 * @throws {Error} Si el input es inválido
 */
function sanitizeFactInput(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid fact input: must be an object');
  }

  const rawFact = String(input.fact || '').trim();
  const fact = sanitizeText(rawFact);
  
  if (fact.length < LIMITS.MIN_FACT_LENGTH) {
    throw new Error(`Fact must be at least ${LIMITS.MIN_FACT_LENGTH} characters long`);
  }
  
  if (fact.length > LIMITS.MAX_FACT_LENGTH) {
    throw new Error(`Fact cannot exceed ${LIMITS.MAX_FACT_LENGTH} characters`);
  }

  const sanitized = {
    fact: fact.slice(0, LIMITS.MAX_FACT_LENGTH),
  };

  // Validar y añadir categoría si es válida
  if (input.category) {
    if (!VALID_CATEGORIES.has(input.category)) {
      throw new Error(`Invalid category. Must be one of: ${Array.from(VALID_CATEGORIES).join(', ')}`);
    }
    sanitized.category = input.category;
  }

  // Validar y añadir source si es válido
  if (input.source) {
    if (!VALID_SOURCES.has(input.source)) {
      throw new Error(`Invalid source. Must be one of: ${Array.from(VALID_SOURCES).join(', ')}`);
    }
    sanitized.source = input.source;
  }

  // Validar y añadir conversationId si es válido
  if (input.conversationId) {
    const conversationId = String(input.conversationId).trim();
    if (conversationId && !OBJECTID_PATTERN.test(conversationId)) {
      throw new Error('Invalid conversationId format');
    }
    if (conversationId) {
      sanitized.conversationId = conversationId;
    }
  }

  return sanitized;
}

/**
 * Sanitiza un hecho recibido del backend.
 * @private
 * @returns {Object|null} Hecho sanitizado o null si inválido
 */
function sanitizeFactOutput(fact) {
  if (!fact || typeof fact !== 'object') return null;

  // Validar que tenga al menos _id y fact
  if (!fact._id || !fact.fact) return null;

  return {
    _id: String(fact._id),
    fact: sanitizeText(String(fact.fact)).slice(0, LIMITS.MAX_FACT_LENGTH),
    category: VALID_CATEGORIES.has(fact.category) ? fact.category : 'other',
    source: VALID_SOURCES.has(fact.source) ? fact.source : 'user',
    conversationId: fact.conversationId ? String(fact.conversationId) : null,
    isActive: Boolean(fact.isActive !== false), // Default true si no está presente
    createdAt: fact.createdAt ? new Date(fact.createdAt) : null,
    updatedAt: fact.updatedAt ? new Date(fact.updatedAt) : null,
  };
}

/**
 * Obtiene todos los hechos biográficos del usuario autenticado.
 * 
 * @param {Object} options - Opciones de filtrado
 * @param {string} [options.category] - Filtrar por categoría
 * @param {boolean} [options.includeInactive=false] - Incluir hechos inactivos
 * @param {number} [options.limit=100] - Límite de resultados (1-500)
 * @returns {Promise<Array>} Lista de hechos sanitizados
 * @throws {Error} Si hay error de red o autenticación
 * 
 * @example
 * const facts = await fetchUserFacts({ category: 'work', limit: 50 });
 * console.log(facts); // [{ _id: '...', fact: 'Trabajo como...', category: 'work', ... }]
 */
export async function fetchUserFacts({ category, includeInactive = false, limit = 100 } = {}) {
  try {
    // Validar y sanitizar límite
    const numLimit = Number(limit);
    if (!Number.isFinite(numLimit) || numLimit < LIMITS.MIN_FETCH_LIMIT) {
      throw new Error(`Limit must be at least ${LIMITS.MIN_FETCH_LIMIT}`);
    }
    const safeLimit = Math.min(numLimit, LIMITS.MAX_FETCH_LIMIT);
    
    const params = { limit: String(safeLimit) };

    // Validar categoría si se proporciona
    if (category !== undefined && category !== null) {
      if (typeof category !== 'string' || !VALID_CATEGORIES.has(category)) {
        throw new Error(`Invalid category. Must be one of: ${Array.from(VALID_CATEGORIES).join(', ')}`);
      }
      params.category = category;
    }

    if (includeInactive === true) {
      params.includeInactive = 'true';
    }

    const res = await api.get(ENDPOINTS.USER_FACTS, params);
    const data = res?.data ?? res;
    
    // Validar que la respuesta tenga el formato esperado
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid API response format');
    }
    
    const facts = (Array.isArray(data?.data) ? data.data : [])
      .map(sanitizeFactOutput)
      .filter(Boolean);

    return facts;
  } catch (error) {
    // Re-lanzar con contexto adicional
    if (error.message?.includes('Invalid')) {
      throw error; // Errores de validación se propagan tal cual
    }
    throw new Error(`Failed to fetch user facts: ${error.message}`);
  }
}

/**
 * Crea un nuevo hecho biográfico.
 * 
 * @param {Object} factData - Datos del hecho
 * @param {string} factData.fact - Contenido del hecho (5-150 chars)
 * @param {string} [factData.category='other'] - Categoría
 * @param {string} [factData.source='user'] - Fuente
 * @param {string} [factData.conversationId] - ID de conversación opcional
 * @returns {Promise<Object>} Hecho creado y sanitizado
 * @throws {Error} Si los datos son inválidos o hay error de red
 * 
 * @example
 * const newFact = await createUserFact({
 *   fact: 'Trabajo como ingeniero de software',
 *   category: 'work',
 * });
 */
export async function createUserFact(factData) {
  try {
    const sanitized = sanitizeFactInput(factData);
    const res = await api.post(ENDPOINTS.USER_FACTS, sanitized);
    const data = res?.data ?? res;
    
    if (!data || typeof data !== 'object' || !data.data) {
      throw new Error('Invalid API response format');
    }
    
    const sanitizedOutput = sanitizeFactOutput(data.data);
    if (!sanitizedOutput) {
      throw new Error('Failed to sanitize created fact');
    }
    
    return sanitizedOutput;
  } catch (error) {
    if (error.message?.includes('Invalid') || error.message?.includes('must be')) {
      throw error;
    }
    throw new Error(`Failed to create user fact: ${error.message}`);
  }
}

/**
 * Actualiza un hecho biográfico existente.
 * 
 * @param {string} id - ID del hecho (formato MongoDB ObjectId)
 * @param {Object} updates - Campos a actualizar
 * @param {string} [updates.fact] - Nuevo contenido (5-150 chars)
 * @param {string} [updates.category] - Nueva categoría
 * @param {boolean} [updates.isActive] - Nuevo estado activo
 * @returns {Promise<Object>} Hecho actualizado y sanitizado
 * @throws {Error} Si el ID o datos son inválidos, o hay error de red
 * 
 * @example
 * const updated = await updateUserFact('507f1f77bcf86cd799439011', {
 *   fact: 'Trabajo como ingeniero senior',
 *   category: 'work',
 * });
 */
export async function updateUserFact(id, updates) {
  try {
    // Validar ID
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid fact ID: must be a non-empty string');
    }
    
    const trimmedId = id.trim();
    if (!OBJECTID_PATTERN.test(trimmedId)) {
      throw new Error('Invalid fact ID format: must be a valid MongoDB ObjectId');
    }

    // Validar que hay algo que actualizar
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      throw new Error('Updates object must contain at least one field');
    }

    const sanitized = {};
    
    // Validar y sanitizar fact si se proporciona
    if (updates.fact !== undefined) {
      const rawFact = String(updates.fact).trim();
      const fact = sanitizeText(rawFact);
      
      if (fact.length < LIMITS.MIN_FACT_LENGTH) {
        throw new Error(`Fact must be at least ${LIMITS.MIN_FACT_LENGTH} characters long`);
      }
      if (fact.length > LIMITS.MAX_FACT_LENGTH) {
        throw new Error(`Fact cannot exceed ${LIMITS.MAX_FACT_LENGTH} characters`);
      }
      
      sanitized.fact = fact.slice(0, LIMITS.MAX_FACT_LENGTH);
    }

    // Validar categoría si se proporciona
    if (updates.category !== undefined) {
      if (typeof updates.category !== 'string' || !VALID_CATEGORIES.has(updates.category)) {
        throw new Error(`Invalid category. Must be one of: ${Array.from(VALID_CATEGORIES).join(', ')}`);
      }
      sanitized.category = updates.category;
    }

    // Validar isActive si se proporciona
    if (updates.isActive !== undefined) {
      sanitized.isActive = Boolean(updates.isActive);
    }

    if (Object.keys(sanitized).length === 0) {
      throw new Error('At least one valid field must be provided for update');
    }

    const res = await api.put(ENDPOINTS.USER_FACT_BY_ID(trimmedId), sanitized);
    const data = res?.data ?? res;
    
    if (!data || typeof data !== 'object' || !data.data) {
      throw new Error('Invalid API response format');
    }
    
    const sanitizedOutput = sanitizeFactOutput(data.data);
    if (!sanitizedOutput) {
      throw new Error('Failed to sanitize updated fact');
    }
    
    return sanitizedOutput;
  } catch (error) {
    if (error.message?.includes('Invalid') || error.message?.includes('must be')) {
      throw error;
    }
    throw new Error(`Failed to update user fact: ${error.message}`);
  }
}

/**
 * Elimina un hecho biográfico (soft delete por defecto).
 * 
 * @param {string} id - ID del hecho (formato MongoDB ObjectId)
 * @param {boolean} [hard=false] - true para eliminación física
 * @returns {Promise<Object>} Resultado de la eliminación
 * @throws {Error} Si el ID es inválido o hay error de red
 * 
 * @example
 * // Soft delete (marca como inactivo)
 * await deleteUserFact('507f1f77bcf86cd799439011');
 * 
 * // Hard delete (eliminación física)
 * await deleteUserFact('507f1f77bcf86cd799439011', true);
 */
export async function deleteUserFact(id, hard = false) {
  try {
    // Validar ID
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid fact ID: must be a non-empty string');
    }
    
    const trimmedId = id.trim();
    if (!OBJECTID_PATTERN.test(trimmedId)) {
      throw new Error('Invalid fact ID format: must be a valid MongoDB ObjectId');
    }

    const params = {};
    if (hard === true) {
      params.hard = 'true';
    }

    const res = await api.delete(ENDPOINTS.USER_FACT_BY_ID(trimmedId), params);
    const data = res?.data ?? res;
    
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid API response format');
    }
    
    return data;
  } catch (error) {
    if (error.message?.includes('Invalid')) {
      throw error;
    }
    throw new Error(`Failed to delete user fact: ${error.message}`);
  }
}
