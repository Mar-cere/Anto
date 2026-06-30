/**
 * Copy del protocolo de crisis v1 (#93, #10) — es/en.
 * @see docs/PROTOCOLO_CRISIS_V1.md
 */
import { normalizeApiLanguage } from '../utils/apiLanguage.js';

const COPY = {
  es: {
    transparencyWhy:
      'Detectamos señales de riesgo elevado en lo que compartiste.',
    transparencyWhat:
      'Priorizamos contención y recursos humanos en lugar de ejercicios.',
    transparencyLimit:
      'Anto complementa, no sustituye, ayuda profesional o una línea de crisis.',
    transparencyAccompaniment:
      'Seguiremos aquí hasta que indiques que te sientes mejor o las señales se estabilicen.',
    transparencyContactAlert:
      'Si tenías contactos de emergencia activos, les enviamos un aviso breve de que podrías necesitar apoyo. No incluye el texto de esta conversación. Puedes revisar tus contactos en Perfil.',
    postContactAlertNotice:
      'Si tenías contactos de emergencia activos, les enviamos un aviso breve de que podrías necesitar apoyo. No incluye el texto de esta conversación.',
    offerContactAlert: (name) =>
      name
        ? `¿Quieres que avise a ${name}? No compartiré lo que escribiste.`
        : '¿Quieres que avise a tus contactos de emergencia? No compartiré lo que escribiste.',
    offerContactAlertMulti: (count) =>
      `¿Quieres que avise a ${count} contacto(s) de emergencia? No compartiré lo que escribiste.`,
  },
  en: {
    transparencyWhy:
      'We detected elevated risk signals in what you shared.',
    transparencyWhat:
      'We prioritize containment and human resources over exercises.',
    transparencyLimit:
      'Anto complements—it does not replace—professional help or a crisis line.',
    transparencyAccompaniment:
      'We will stay with you until you say you feel better or signals stabilize.',
    transparencyContactAlert:
      'If you had active emergency contacts, we sent them a brief notice that you might need support. It does not include this conversation. You can review contacts in Profile.',
    postContactAlertNotice:
      'If you had active emergency contacts, we sent them a brief notice that you might need support. It does not include this conversation.',
    offerContactAlert: (name) =>
      name
        ? `Would you like me to notify ${name}? I will not share what you wrote.`
        : 'Would you like me to notify your emergency contacts? I will not share what you wrote.',
    offerContactAlertMulti: (count) =>
      `Would you like me to notify ${count} emergency contact(s)? I will not share what you wrote.`,
  },
};

export function getCrisisProtocolCopy(language = 'es') {
  const lang = normalizeApiLanguage(language);
  return COPY[lang] || COPY.es;
}

/**
 * Bloques T1–T5 para el panel de recursos (#10).
 * @param {{ language?: string, showContactAlertNotice?: boolean }} [opts]
 */
export function buildCrisisProtocolTransparency({ language = 'es', showContactAlertNotice = false } = {}) {
  const c = getCrisisProtocolCopy(language);
  const blocks = [
    { id: 'why', text: c.transparencyWhy },
    { id: 'what', text: c.transparencyWhat },
    { id: 'limit', text: c.transparencyLimit },
    { id: 'accompaniment', text: c.transparencyAccompaniment },
  ];
  if (showContactAlertNotice) {
    blocks.push({ id: 'contact_alert', text: c.transparencyContactAlert });
  }
  return blocks;
}

export default {
  getCrisisProtocolCopy,
  buildCrisisProtocolTransparency,
};
