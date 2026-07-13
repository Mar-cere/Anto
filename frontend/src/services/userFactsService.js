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

/**
 * Sanitiza un hecho antes de enviarlo al backend.
 * Protege contra datos inválidos y asegura conformidad con el schema.
 */
function sanitizeFactInput(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid fact input');
  }

  const fact = String(input.fact || '').trim();
  if (fact.length < 5 || fact.length > 150) {
    throw new Error('Fact must be between 5 and 150 characters');
  }

  const sanitized = {
    fact: fact.slice(0, 150),
  };

  if (input.category && VALID_CATEGORIES.has(input.category)) {
    sanitized.category = input.category;
  }

  if (input.source && VALID_SOURCES.has(input.source)) {
    sanitized.source = input.source;
  }

  if (input.conversationId && typeof input.conversationId === 'string') {
    sanitized.conversationId = input.conversationId.trim();
  }

  return sanitized;
}

/**
 * Sanitiza un hecho recibido del backend.
 */
function sanitizeFactOutput(fact) {
  if (!fact || typeof fact !== 'object') return null;

  return {
    _id: String(fact._id || ''),
    fact: String(fact.fact || '').slice(0, 150),
    category: VALID_CATEGORIES.has(fact.category) ? fact.category : 'other',
    source: VALID_SOURCES.has(fact.source) ? fact.source : 'user',
    conversationId: fact.conversationId ? String(fact.conversationId) : null,
    isActive: Boolean(fact.isActive),
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
 * @param {number} [options.limit=100] - Límite de resultados
 * @returns {Promise<Array>} Lista de hechos
 */
export async function fetchUserFacts({ category, includeInactive = false, limit = 100 } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
  const params = {};

  if (category && VALID_CATEGORIES.has(category)) {
    params.category = category;
  }

  if (includeInactive === true) {
    params.includeInactive = 'true';
  }

  params.limit = String(safeLimit);

  const res = await api.get(ENDPOINTS.USER_FACTS, params);
  const data = res?.data ?? res;
  const facts = (Array.isArray(data?.data) ? data.data : [])
    .map(sanitizeFactOutput)
    .filter(Boolean);

  return facts;
}

/**
 * Crea un nuevo hecho biográfico.
 * 
 * @param {Object} factData - Datos del hecho
 * @param {string} factData.fact - Contenido del hecho (5-150 chars)
 * @param {string} [factData.category='other'] - Categoría
 * @param {string} [factData.source='user'] - Fuente
 * @param {string} [factData.conversationId] - ID de conversación opcional
 * @returns {Promise<Object>} Hecho creado
 */
export async function createUserFact(factData) {
  const sanitized = sanitizeFactInput(factData);
  const res = await api.post(ENDPOINTS.USER_FACTS, sanitized);
  const data = res?.data ?? res;
  return sanitizeFactOutput(data?.data);
}

/**
 * Actualiza un hecho biográfico existente.
 * 
 * @param {string} id - ID del hecho
 * @param {Object} updates - Campos a actualizar
 * @param {string} [updates.fact] - Nuevo contenido
 * @param {string} [updates.category] - Nueva categoría
 * @param {boolean} [updates.isActive] - Nuevo estado activo
 * @returns {Promise<Object>} Hecho actualizado
 */
export async function updateUserFact(id, updates) {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid fact ID');
  }

  const sanitized = {};
  
  if (updates.fact !== undefined) {
    const fact = String(updates.fact).trim();
    if (fact.length < 5 || fact.length > 150) {
      throw new Error('Fact must be between 5 and 150 characters');
    }
    sanitized.fact = fact.slice(0, 150);
  }

  if (updates.category !== undefined) {
    if (VALID_CATEGORIES.has(updates.category)) {
      sanitized.category = updates.category;
    }
  }

  if (updates.isActive !== undefined) {
    sanitized.isActive = Boolean(updates.isActive);
  }

  if (Object.keys(sanitized).length === 0) {
    throw new Error('At least one field must be provided for update');
  }

  const res = await api.put(ENDPOINTS.USER_FACT_BY_ID(id), sanitized);
  const data = res?.data ?? res;
  return sanitizeFactOutput(data?.data);
}

/**
 * Elimina un hecho biográfico (soft delete por defecto).
 * 
 * @param {string} id - ID del hecho
 * @param {boolean} [hard=false] - true para eliminación física
 * @returns {Promise<Object>} Resultado de la eliminación
 */
export async function deleteUserFact(id, hard = false) {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid fact ID');
  }

  const params = {};
  if (hard === true) {
    params.hard = 'true';
  }

  const res = await api.delete(ENDPOINTS.USER_FACT_BY_ID(id), params);
  return res?.data ?? res;
}
