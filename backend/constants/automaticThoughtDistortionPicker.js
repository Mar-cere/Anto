/**
 * Lista curada para el wizard de pensamiento automático (#89).
 * Lenguaje accesible; el detector completo sigue en cognitiveDistortionDetector.
 */
import { normalizeApiLanguage } from '../utils/apiLanguage.js';

/** Orden fijo en UI (máx. 8 + sugeridos extra). */
export const AT_PICKER_DISTORTION_TYPES = [
  'all_or_nothing',
  'overgeneralization',
  'mind_reading',
  'fortune_telling',
  'catastrophizing',
  'should_statements',
  'labeling',
  'emotional_reasoning',
];

const PICKER_COPY = {
  es: {
    all_or_nothing: {
      label: 'Todo o nada',
      hint: 'Solo veo blanco o negro, sin matices',
    },
    overgeneralization: {
      label: 'Siempre / nunca',
      hint: 'Un error se convierte en «siempre me pasa»',
    },
    mind_reading: {
      label: 'Creo saber qué piensan',
      hint: 'Asumo lo que otros piensan de mí',
    },
    fortune_telling: {
      label: 'Predigo lo peor',
      hint: 'Doy por hecho que saldrá mal',
    },
    catastrophizing: {
      label: 'Imagino lo peor',
      hint: 'Amplío hasta un desastre',
    },
    should_statements: {
      label: 'Debería / tengo que',
      hint: 'Exigencias muy rígidas conmigo o con otros',
    },
    labeling: {
      label: 'Etiquetas duras',
      hint: '«Soy un…» en lugar de lo que pasó',
    },
    emotional_reasoning: {
      label: 'Si lo siento, es verdad',
      hint: 'La emoción manda sobre los hechos',
    },
  },
  en: {
    all_or_nothing: {
      label: 'All or nothing',
      hint: 'Only black or white, no in-between',
    },
    overgeneralization: {
      label: 'Always / never',
      hint: 'One setback becomes «it always happens»',
    },
    mind_reading: {
      label: 'Mind reading',
      hint: 'Assuming what others think of me',
    },
    fortune_telling: {
      label: 'Predicting the worst',
      hint: 'Assuming it will go badly',
    },
    catastrophizing: {
      label: 'Worst-case scenario',
      hint: 'Blowing things up into a disaster',
    },
    should_statements: {
      label: 'Should / must',
      hint: 'Very rigid rules for yourself or others',
    },
    labeling: {
      label: 'Harsh labels',
      hint: '«I am a…» instead of what happened',
    },
    emotional_reasoning: {
      label: 'Feelings = facts',
      hint: 'Because I feel it, it must be true',
    },
  },
};

/** Etiquetas cortas si el detector sugiere un tipo fuera del picker. */
const FALLBACK_COPY = {
  es: {
    mental_filter: { label: 'Solo lo malo', hint: 'Ignoro lo que sí salió bien' },
    jumping_to_conclusions: { label: 'Conclusión apresurada', hint: 'Decido sin pruebas' },
    disqualifying_positive: { label: 'Lo bueno no cuenta', hint: 'Resto valor a lo positivo' },
    magnification_minimization: { label: 'Exagero o minimizo', hint: 'Lo malo enorme, lo bueno pequeño' },
    personalization: { label: 'Todo es por mí', hint: 'Me culpo de más' },
    blame: { label: 'Culpo a otros', hint: 'Otros «me hacen» sentir así' },
    unfair_comparison: { label: 'Me comparo mal', hint: 'Me mido siempre en contra' },
    regret_orientation: { label: 'Atascado en el pasado', hint: 'Repaso lo que debí hacer' },
    what_if: { label: '¿Y si…?', hint: 'Me quedo en escenarios negativos' },
  },
  en: {
    mental_filter: { label: 'Only the bad', hint: 'I ignore what went well' },
    jumping_to_conclusions: { label: 'Jumping to conclusions', hint: 'Deciding without proof' },
    disqualifying_positive: { label: 'Good stuff doesn\'t count', hint: 'I dismiss positives' },
    magnification_minimization: { label: 'Blow up or shrink', hint: 'Bad feels huge, good feels tiny' },
    personalization: { label: 'It\'s all on me', hint: 'I over-blame myself' },
    blame: { label: 'Blaming others', hint: 'Others «make me» feel this way' },
    unfair_comparison: { label: 'Unfair comparison', hint: 'I always compare down' },
    regret_orientation: { label: 'Stuck in the past', hint: 'I replay what I should have done' },
    what_if: { label: 'What if…', hint: 'I stay in negative scenarios' },
  },
};

function resolveLang(language = 'es') {
  return normalizeApiLanguage(language);
}

/**
 * @param {string} type
 * @param {string} [language='es']
 * @returns {{ label: string, hint: string }|null}
 */
export function getAutomaticThoughtDistortionDisplay(type, language = 'es') {
  const key = String(type || '').trim().toLowerCase();
  if (!key) return null;
  const lang = resolveLang(language);
  const copy = PICKER_COPY[lang]?.[key] || FALLBACK_COPY[lang]?.[key];
  if (copy) return copy;
  return null;
}

/**
 * @param {string} type
 * @param {string} [language='es']
 * @returns {string}
 */
export function getAutomaticThoughtDistortionLabel(type, language = 'es') {
  return getAutomaticThoughtDistortionDisplay(type, language)?.label || '';
}

/**
 * @param {string} [language='es']
 * @param {{ suggestedTypes?: string[] }} [options]
 * @returns {Array<{ type: string, label: string, hint: string, inCuratedList: boolean, suggested?: boolean }>}
 */
export function getAutomaticThoughtDistortionPickerOptions(language = 'es', options = {}) {
  const lang = resolveLang(language);
  const picker = PICKER_COPY[lang] || PICKER_COPY.es;
  const fallback = FALLBACK_COPY[lang] || FALLBACK_COPY.es;
  const suggested = [...new Set((options.suggestedTypes || []).map((t) => String(t || '').trim()))].filter(
    Boolean,
  );

  const out = [];
  const seen = new Set();

  suggested.forEach((type) => {
    if (seen.has(type)) return;
    seen.add(type);
    const curated = picker[type];
    const extra = fallback[type];
    if (curated) {
      out.push({ type, label: curated.label, hint: curated.hint, inCuratedList: true, suggested: true });
    } else if (extra) {
      out.push({ type, label: extra.label, hint: extra.hint, inCuratedList: false, suggested: true });
    }
  });

  AT_PICKER_DISTORTION_TYPES.forEach((type) => {
    if (seen.has(type)) return;
    seen.add(type);
    const curated = picker[type];
    if (curated) {
      out.push({ type, label: curated.label, hint: curated.hint, inCuratedList: true });
    }
  });

  return out;
}
