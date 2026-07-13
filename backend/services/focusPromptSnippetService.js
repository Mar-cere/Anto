/**
 * Focus context snippet para prompts del chat (#2 Fase 3).
 * Inyecta información del foco activo en el system prompt cuando corresponde.
 */
import { getFocusContextForPrompt } from './focusService.js';
import { focusApiCopy } from '../utils/focusApiCopy.js';

/**
 * Sanitizar texto de customGoal para inyección en prompt.
 * Previene prompt injection eliminando caracteres especiales de markdown y comandos.
 * @param {string} text - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
function sanitizeCustomGoalForPrompt(text) {
  if (!text || typeof text !== 'string') return '';
  
  // Limitar longitud (el schema de DB permite 200, pero limitamos a 150 en prompt)
  let sanitized = text.slice(0, 150);
  
  // Eliminar saltos de línea múltiples y tabs
  sanitized = sanitized.replace(/[\r\n\t]+/g, ' ');
  
  // Eliminar múltiples espacios
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  // Trim
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Construir snippet del foco activo para el system prompt.
 * @param {string|ObjectId} userId - ID del usuario
 * @param {string} language - 'es' o 'en'
 * @returns {Promise<string|null>} Snippet para system prompt o null si no hay foco activo
 */
export async function buildFocusPromptSnippet(userId, language = 'es') {
  // Validar userId
  if (!userId) {
    console.warn('[focusPromptSnippetService] userId is required');
    return null;
  }
  
  const focusContext = await getFocusContextForPrompt(userId);
  
  if (!focusContext) {
    return null;
  }

  const copy = await focusApiCopy(language);
  const theme = copy.themes[focusContext.themeId];
  
  if (!theme) {
    return null;
  }

  // Construir el snippet del prompt con el contexto del foco
  const lines = [];
  
  lines.push('---');
  lines.push('');
  lines.push(language === 'es' 
    ? '**Foco de acompañamiento activo:**'
    : '**Active accompaniment focus:**'
  );
  lines.push('');
  lines.push(`- ${language === 'es' ? 'Tema' : 'Theme'}: ${theme.name}`);
  lines.push(`- ${language === 'es' ? 'Semana' : 'Week'}: ${focusContext.weekNumber}/${focusContext.durationWeeks}`);
  
  if (focusContext.customGoal) {
    const sanitizedGoal = sanitizeCustomGoalForPrompt(focusContext.customGoal);
    if (sanitizedGoal) {
      lines.push(`- ${language === 'es' ? 'Objetivo del usuario' : 'User goal'}: "${sanitizedGoal}"`);
    }
  }
  
  lines.push('');
  
  // Añadir el prompt de onboarding del tema (instrucciones específicas del tema)
  if (theme.onboardingPrompt) {
    lines.push(theme.onboardingPrompt);
    lines.push('');
  }
  
  // Instrucciones generales de alineación
  if (language === 'es') {
    lines.push('Durante este proceso de acompañamiento:');
    lines.push('- Mantén presente este foco temático en tus respuestas');
    lines.push('- Conecta las situaciones del usuario con este tema cuando sea relevante');
    lines.push('- Sugiere técnicas y recursos alineados a este foco');
    lines.push('- No menciones explícitamente "el foco" o "tu foco activo" al usuario');
    lines.push('- Integra este contexto de manera natural en la conversación');
  } else {
    lines.push('During this accompaniment process:');
    lines.push('- Keep this thematic focus in mind in your responses');
    lines.push('- Connect user situations with this theme when relevant');
    lines.push('- Suggest techniques and resources aligned with this focus');
    lines.push('- Don\'t explicitly mention "the focus" or "your active focus" to the user');
    lines.push('- Integrate this context naturally in the conversation');
  }
  
  lines.push('');
  lines.push('---');
  
  return lines.join('\n');
}

/**
 * Verificar si el usuario tiene un foco activo.
 * Útil para lógica condicional en el chat sin cargar todo el contexto.
 * @param {string|ObjectId} userId - ID del usuario
 * @returns {Promise<boolean>}
 */
export async function hasActiveFocus(userId) {
  if (!userId) return false;
  
  const focusContext = await getFocusContextForPrompt(userId);
  return focusContext !== null;
}
