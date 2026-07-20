/**
 * Snippet dinámico: técnicas sugeridas este turno (cards UI), sin catálogo completo.
 */

const TECHNIQUE_LABELS = {
  es: {
    breathing_exercise: 'respiración',
    grounding_technique: 'grounding / anclaje',
    progressive_muscle_relaxation: 'relajación muscular',
    mindfulness_exercise: 'mindfulness breve',
    gratitude_journal: 'gratitud',
    journaling: 'escritura / diario',
    thought_record: 'registro de pensamientos',
    behavioral_activation: 'activación conductual',
  },
  en: {
    breathing_exercise: 'breathing',
    grounding_technique: 'grounding',
    progressive_muscle_relaxation: 'muscle relaxation',
    mindfulness_exercise: 'brief mindfulness',
    gratitude_journal: 'gratitude',
    journaling: 'journaling',
    thought_record: 'thought record',
    behavioral_activation: 'behavioral activation',
  },
};

/**
 * @param {unknown} id
 * @returns {boolean}
 */
function isPsychoeducationId(id) {
  return String(id || '').startsWith('psychoeducation_');
}

/**
 * @param {string[]} techniqueIds
 * @param {'es'|'en'} language
 * @returns {string}
 */
export function buildTechniqueSuggestionPromptSnippet(techniqueIds, language = 'es') {
  if (!Array.isArray(techniqueIds) || techniqueIds.length === 0) return '';

  const lang = language === 'en' ? 'en' : 'es';
  const labels = TECHNIQUE_LABELS[lang];
  const human = techniqueIds
    .filter((id) => id && !isPsychoeducationId(id))
    .slice(0, 2)
    .map((id) => labels[id] || String(id).replace(/_/g, ' '))
    .filter(Boolean);

  if (human.length === 0) return '';

  const list = human.join(lang === 'en' ? ', ' : ', ');

  if (lang === 'en') {
    return `

### Technique cards this turn
The app may show a card for: ${list}.
Do not invent other techniques. Do not push if they only want to talk. No internal IDs in the reply.`;
  }

  return `

### Tarjetas de técnica este turno
La app puede mostrar una tarjeta de: ${list}.
No inventes otras técnicas. No empujes si solo quieren hablar. Sin IDs internos en la respuesta.`;
}

/**
 * Snippet mínimo si hay gratitud/journal entre las sugerencias.
 * @param {string[]} techniqueIds
 * @param {'es'|'en'} language
 * @returns {string}
 */
export function buildGratitudeJournalPromptSnippet(techniqueIds, language = 'es') {
  if (!Array.isArray(techniqueIds)) return '';
  const has =
    techniqueIds.includes('gratitude_journal') || techniqueIds.includes('journaling');
  if (!has) return '';

  if (language === 'en') {
    return `

### Journal / gratitude card
A voluntary journal or gratitude card may appear. Do not promise it was saved. Invite only if it fits.`;
  }

  return `

### Tarjeta de diario / gratitud
Puede aparecer una tarjeta voluntaria de diario o gratitud. No prometas que se guardó. Invita solo si encaja.`;
}
