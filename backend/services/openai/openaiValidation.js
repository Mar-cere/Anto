/**
 * Validación de mensajes y normalización de análisis emocional para OpenAI.
 * Extraído de openaiService para reducir su tamaño y separar responsabilidades.
 */
import { DEFAULT_VALUES, VALIDATION_LIMITS } from '../../constants/openai.js';

const EMOCIONES_VALIDAS = [
  'tristeza', 'ansiedad', 'enojo', 'alegria', 'miedo', 'verguenza', 'culpa', 'esperanza', 'neutral'
];

/**
 * Valida el mensaje del usuario (contenido presente, no vacío, dentro del límite de caracteres).
 * @param {Object} mensaje - Objeto con propiedad content
 * @returns {{ valid: boolean, content?: string, error?: string }}
 */
export function validateMessage(mensaje) {
  if (!mensaje?.content) {
    return { valid: false, error: 'Mensaje inválido: falta el contenido' };
  }
  const content = mensaje.content.trim();
  if (!content) {
    return { valid: false, error: 'Mensaje inválido: el contenido está vacío' };
  }
  if (content.length > VALIDATION_LIMITS.MAX_INPUT_CHARACTERS) {
    return {
      valid: false,
      error: `Mensaje inválido: el contenido excede el límite de ${VALIDATION_LIMITS.MAX_INPUT_CHARACTERS} caracteres`
    };
  }
  return { valid: true, content };
}

/**
 * Normaliza el objeto de análisis emocional para compatibilidad con el esquema de Message.
 * @param {Object} analisisEmocional - Objeto de análisis emocional
 * @returns {Object} Objeto emocional normalizado (mainEmotion, intensity, campos opcionales)
 */
export function normalizeEmotionalAnalysis(analisisEmocional) {
  if (!analisisEmocional || typeof analisisEmocional !== 'object') {
    return {
      mainEmotion: DEFAULT_VALUES.EMOTION,
      intensity: DEFAULT_VALUES.INTENSITY
    };
  }

  let mainEmotion = analisisEmocional.mainEmotion || DEFAULT_VALUES.EMOTION;
  if (!EMOCIONES_VALIDAS.includes(mainEmotion)) {
    console.warn(`⚠️ Emoción no válida detectada: "${mainEmotion}". Usando valor por defecto: "${DEFAULT_VALUES.EMOTION}"`);
    mainEmotion = DEFAULT_VALUES.EMOTION;
  }

  let intensity = analisisEmocional.intensity;
  if (typeof intensity !== 'number' || isNaN(intensity)) {
    intensity = DEFAULT_VALUES.INTENSITY;
  } else {
    intensity = Math.max(
      VALIDATION_LIMITS.INTENSITY_MIN,
      Math.min(VALIDATION_LIMITS.INTENSITY_MAX, intensity)
    );
  }

  const normalizado = { mainEmotion, intensity };

  if (Array.isArray(analisisEmocional.secondary)) normalizado.secondary = analisisEmocional.secondary;
  if (analisisEmocional.category) normalizado.category = analisisEmocional.category;
  if (typeof analisisEmocional.confidence === 'number') normalizado.confidence = analisisEmocional.confidence;
  if (typeof analisisEmocional.requiresAttention === 'boolean') normalizado.requiresAttention = analisisEmocional.requiresAttention;

  return normalizado;
}
