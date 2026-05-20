/**
 * Servicio de Plantillas Terapéuticas por Emoción + Subtipo
 * Proporciona plantillas estructuradas para respuestas terapéuticas
 * basadas en la emoción principal y su subtipo detectado
 */
import { THERAPEUTIC_TEMPLATES_ES } from '../constants/therapeuticTemplates.es.js';
import { THERAPEUTIC_TEMPLATES_EN } from '../constants/therapeuticTemplates.en.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';

function templatesForLanguage(language = 'es') {
  return normalizeApiLanguage(language) === 'en'
    ? THERAPEUTIC_TEMPLATES_EN
    : THERAPEUTIC_TEMPLATES_ES;
}

class TherapeuticTemplateService {
  /**
   * Obtiene una plantilla terapéutica para una emoción + subtipo
   * @param {string} emotion - Emoción principal
   * @param {string} subtype - Subtipo emocional
   * @param {string} [language='es'] - Idioma (es|en)
   * @returns {Object|null} Plantilla con validation, psychoeducation y question
   */
  getTemplate(emotion, subtype, language = 'es') {
    if (!emotion || !subtype) {
      return null;
    }

    const templates = templatesForLanguage(language);
    const emotionTemplates = templates[emotion];
    if (!emotionTemplates) {
      return null;
    }

    return emotionTemplates[subtype] || null;
  }

  /**
   * Construye una base de respuesta terapéutica usando la plantilla
   * @param {string} emotion - Emoción principal
   * @param {string} subtype - Subtipo emocional
   * @param {Object} options - Opciones adicionales { style, language }
   * @returns {string} Base de respuesta estructurada
   */
  buildTherapeuticBase(emotion, subtype, options = {}) {
    const { style = 'balanced', language = 'es' } = options;
    const template = this.getTemplate(emotion, subtype, language);

    if (!template) {
      return null;
    }

    const validation = this.selectPhrase(template.validation, style);
    const psychoeducation = this.selectPhrase(template.psychoeducation, style);
    const question = this.selectPhrase(template.question, style);

    if (style === 'brief') {
      return `${validation} ${question}`;
    }
    if (style === 'deep') {
      return `${validation}\n\n${psychoeducation}\n\n${question}`;
    }
    return `${validation} ${psychoeducation}\n\n${question}`;
  }

  /**
   * Construye una guía breve para mezclar con la respuesta del modelo.
   */
  buildTherapeuticHint(emotion, subtype, options = {}) {
    const { maxLength = 180, language = 'es' } = options;
    const template = this.getTemplate(emotion, subtype, language);
    if (!template) return null;

    const candidates = [...(template.validation || []), ...(template.psychoeducation || [])]
      .filter((s) => typeof s === 'string' && s.trim().length > 0);

    if (candidates.length === 0) return null;

    const concise = candidates.filter((s) => s.length <= maxLength);
    const pool = concise.length > 0 ? concise : candidates;
    return this.selectPhrase(pool, 'brief');
  }

  /**
   * Selecciona una frase de un array según el estilo
   */
  selectPhrase(phrases, style) {
    if (!phrases || phrases.length === 0) {
      return '';
    }

    if (style === 'brief') {
      const shortPhrases = phrases.filter((p) => p.length < 100);
      if (shortPhrases.length > 0) {
        return shortPhrases[Math.floor(Math.random() * shortPhrases.length)];
      }
    }

    return phrases[Math.floor(Math.random() * phrases.length)];
  }
}

export default new TherapeuticTemplateService();
