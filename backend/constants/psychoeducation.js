/**
 * Módulos de psicoeducación estructurada (#85).
 * Lenguaje no diagnóstico; fuentes en cada módulo.
 */
import { PSYCHOEDUCATION_MODULES_EN } from './psychoeducation.en.js';
import {
  PSYCHOEDUCATION_CLINICAL_REVIEW,
  PSYCHOEDUCATION_TOPIC_ORDER,
  PSYCHOEDUCATION_VERSION,
  getPsychoeducationBrowseItems,
  getPsychoeducationDisclaimer,
  getTopicMeta,
  normalizeClinicalReview,
} from './psychoeducationTopics.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';
import { normalizePsychoeducationTopic } from './psychoeducationTopicNormalize.js';

export { normalizePsychoeducationTopic, isValidPsychoeducationTopic } from './psychoeducationTopicNormalize.js';

export {
  PSYCHOEDUCATION_CLINICAL_REVIEW,
  PSYCHOEDUCATION_TOPIC_ORDER,
  PSYCHOEDUCATION_VERSION,
  getPsychoeducationBrowseItems,
  getPsychoeducationDisclaimer,
  getTopicMeta,
  getPsychoeducationCardFields,
  normalizeClinicalReview,
} from './psychoeducationTopics.js';

function psychoeducationCatalogForLanguage(language = 'es') {
  return normalizeApiLanguage(language) === 'en'
    ? PSYCHOEDUCATION_MODULES_EN
    : PSYCHOEDUCATION_MODULES;
}

export const PSYCHOEDUCATION_MODULES = {
  anxiety: {
    whatIs:
      'La ansiedad es una respuesta natural del cuerpo al estrés o a la incertidumbre. Puede ser útil en pequeñas dosis; se vuelve más difícil cuando es muy intensa, dura mucho o limita tu día a día.',
    symptoms: [
      'Físicos: palpitaciones, tensión muscular, sensación de falta de aire',
      'En la mente: preocupación repetitiva, anticipar lo peor, dificultad para concentrarte',
      'En la conducta: evitar situaciones, inquietud, buscar mucha seguridad',
    ],
    causes: [
      'Experiencias estresantes o cambios importantes',
      'Estrés sostenido',
      'Patrones de pensamiento muy exigentes o catastróficos',
      'Factores familiares o biológicos (sin que eso defina quién eres)',
    ],
    whatHelps: [
      'Terapia cognitivo-conductual (TCC) y técnicas de exposición gradual',
      'Respiración, relajación y ejercicio regular',
      'Rutinas de sueño y límites con la preocupación (p. ej. tiempo dedicado a pensar)',
      'Apoyo profesional si lo necesitas; la medicación solo bajo indicación médica',
    ],
    whenToSeekHelp:
      'Si la ansiedad interfiere con sueño, trabajo, estudios o relaciones durante varias semanas, conviene hablar con un profesional.',
    sources: [
      {
        label: 'OMS — Salud mental',
        url: 'https://www.who.int/es/health-topics/mental-health',
      },
      {
        label: 'NIMH — Trastornos de ansiedad (información general)',
        url: 'https://www.nimh.nih.gov/health/topics/anxiety-disorders',
      },
    ],
  },

  depression: {
    whatIs:
      'El bajo ánimo persistente afecta cómo piensas, sientes y actúas. No es “flojera” ni falta de voluntad: es una experiencia real que merece cuidado y apoyo.',
    symptoms: [
      'Ánimo bajo la mayor parte del día',
      'Menos interés o placer en actividades que antes disfrutabas',
      'Cambios en sueño o apetito',
      'Cansancio, culpa excesiva o dificultad para concentrarte',
      'Pensamientos de muerte o de hacerte daño (requieren atención urgente)',
    ],
    causes: [
      'Eventos vitales difíciles o pérdidas',
      'Aislamiento o falta de apoyo',
      'Estrés prolongado',
      'Factores biológicos y familiares (sin etiquetarte)',
    ],
    whatHelps: [
      'Terapia (TCC, interpersonal) y activación conductual (pequeños pasos)',
      'Rutinas de sueño, movimiento y contacto social gradual',
      'Apoyo profesional; medicación solo si un médico lo indica',
    ],
    whenToSeekHelp:
      'Si el bajo ánimo dura más de dos semanas o aparecen pensamientos de autolesión, busca ayuda profesional cuanto antes.',
    sources: [
      {
        label: 'OMS — Depresión (información para el público)',
        url: 'https://www.who.int/es/news-room/fact-sheets/detail/depression',
      },
      {
        label: 'NIMH — Depresión',
        url: 'https://www.nimh.nih.gov/health/topics/depression',
      },
    ],
  },

  emotionRegulation: {
    whatIs:
      'Regular emociones no es reprimirlas: es reconocerlas, entender para qué sirven y elegir respuestas que te cuiden a ti y a tus vínculos.',
    skills: [
      'Nombrar la emoción con precisión (“irritación” vs “rabia”)',
      'Notar señales corporales antes de que suba la intensidad',
      'Pausar, respirar y elegir el siguiente paso',
      'Aceptar emociones difíciles sin actuar en automático',
    ],
    techniques: [
      'Mindfulness breve y respiración diafragmática',
      'Reestructuración de pensamientos muy rígidos',
      'Activación conductual y límites asertivos',
      'Técnicas de tolerancia al malestar (DBT-lite)',
    ],
    benefits: [
      'Menos conflictos impulsivos',
      'Mejor recuperación después del estrés',
      'Decisiones más alineadas con tus valores',
    ],
    whenToSeekHelp:
      'Si las emociones te desbordan con frecuencia, te llevan a conductas de las que te arrepientes o dañan tus relaciones, hablar con un profesional puede ayudarte.',
    sources: [
      {
        label: 'APA — Gestión del estrés y emociones',
        url: 'https://www.apa.org/topics/stress',
      },
    ],
  },

  stress: {
    whatIs:
      'El estrés es la respuesta del cuerpo a demandas o retos. Puede motivarte (eustrés) o agotarte cuando es crónico y sin descanso (distrés).',
    symptoms: [
      'Cuerpo: tensión, dolores de cabeza, fatiga',
      'Emociones: irritabilidad, ansiedad o tristeza',
      'Mente: rumiación, dificultad para concentrarte',
      'Conducta: cambios en sueño, apetito o aislamiento',
    ],
    causes: [
      'Presión laboral o académica',
      'Problemas económicos o de salud',
      'Conflictos en relaciones',
      'Demasiadas responsabilidades sin pausas',
    ],
    management: [
      'Identificar qué está bajo tu control y qué no',
      'Pausas breves, movimiento y sueño regular',
      'Límites y delegar cuando sea posible',
      'Apoyo social y, si hace falta, terapia',
    ],
    whenToSeekHelp:
      'Si el estrés te agota durante semanas, afecta tu salud física o no logras descansar aunque lo intentes, conviene buscar apoyo profesional.',
    sources: [
      {
        label: 'OMS — Estrés laboral (marco general)',
        url: 'https://www.who.int/news-room/questions-and-answers/item/stress-at-the-workplace',
      },
    ],
  },

  anger: {
    whatIs:
      'El enojo es una emoción normal que suele señalar límites, injusticia o necesidades no atendidas. Puede ser útil en dosis breves; se vuelve más difícil cuando es muy intenso, dura mucho o se expresa de forma que lastima.',
    signs: [
      'Cuerpo: calor, tensión en mandíbula o puños, palpitaciones',
      'Mente: pensamientos de injusticia, deseo de “cortar” la situación',
      'Conducta: gritar, sarcasmo, evitar o explotar',
    ],
    triggers: [
      'Sentirte desrespetado/a o ignorado/a',
      'Fatiga, hambre o sueño insuficiente',
      'Estrés acumulado sin descarga',
      'Expectativas muy rígidas hacia ti o hacia otros',
    ],
    whatHelps: [
      'Pausa física (salir, respirar, contar hasta diez)',
      'Nombrar la emoción y la necesidad detrás (“necesito que me escuchen”)',
      'Límites asertivos en lugar de ataques',
      'Terapia si el enojo es frecuente o te arrepientes después',
    ],
    whenToSeekHelp:
      'Si el enojo te lleva a conductas que te arrepientes, a violencia o a aislamiento, busca apoyo profesional.',
    sources: [
      {
        label: 'APA — Control de la ira',
        url: 'https://www.apa.org/topics/anger/control',
      },
    ],
  },

  sleep: {
    whatIs:
      'Dormir bien sostiene el ánimo, la concentración y la recuperación del estrés. Los problemas de sueño son muy frecuentes y no significan que haya algo “defectuoso” en ti.',
    hygiene: [
      'Horario regular de acostarte y levantarte (también fines de semana, en la medida posible)',
      'Rutina tranquila 30–60 min antes de dormir (luz baja, sin discusiones difíciles)',
      'Evitar cafeína tarde y pantallas muy estimulantes justo antes de dormir',
      'Usar la cama sobre todo para dormir (no para trabajar o rumiar)',
      'Si no concilias el sueño en ~20 min, levántate a otra actividad calmada y vuelve cuando tengas sueño',
    ],
    whenWorry: [
      'Insomnio o sueño muy fragmentado varias noches por semana',
      'Somnolencia diurna que pone en riesgo la conducción o el trabajo',
      'Ronquidos fuertes o pausas de respiración (consultar salud)',
    ],
    whenToSeekHelp:
      'Si el sueño no mejora con hábitos básicos durante varias semanas, o si hay somnolencia peligrosa, consulta con un profesional de salud.',
    sources: [
      {
        label: 'CDC — Higiene del sueño',
        url: 'https://www.cdc.gov/sleep/about/index.html',
      },
      {
        label: 'NHLBI — Insomnio (información general)',
        url: 'https://www.nhlbi.nih.gov/health/insomnia',
      },
    ],
  },

  trauma: {
    whatIs:
      'Después de experiencias muy estresantes o amenazantes, el cuerpo y la mente pueden quedar en alerta o evitar recordatorios. Esto es una respuesta humana común, no un “defecto” de carácter.',
    symptoms: [
      'Recuerdos o sensaciones que vuelven sin aviso',
      'Evitar lugares, personas o temas relacionados',
      'Hiperalerta, sobresaltos o dificultad para relajarte',
      'Cambios en el ánimo o en cómo ves el mundo',
    ],
    types: [
      'Evento único muy intenso',
      'Exposición repetida a situaciones amenazantes',
      'Varias experiencias difíciles a lo largo del tiempo',
    ],
    whatHelps: [
      'Terapia especializada en trauma cuando estés listo/a (EMDR, TCC, procesamiento cognitivo)',
      'Técnicas de estabilización y apoyo social seguro',
      'Ir a tu ritmo; no estás obligado/a a “contarlo todo” de inmediato',
    ],
    whenToSeekHelp:
      'Si los síntomas limitan tu vida diaria, el sueño o las relaciones, busca un profesional con formación en trauma.',
    sources: [
      {
        label: 'OMS — Salud mental y emergencias',
        url: 'https://www.who.int/teams/mental-health-and-substance-use',
      },
      {
        label: 'NIMH — TEPT (información general)',
        url: 'https://www.nimh.nih.gov/health/publications/post-traumatic-stress-disorder-ptsd',
      },
    ],
  },
};

/**
 * @param {string} topic
 * @param {string} [language='es']
 * @returns {Object|null} Módulo con disclaimer y metadatos de tema
 */
export const getPsychoeducationModule = (topic, language = 'es') => {
  const normalizedTopic = normalizePsychoeducationTopic(topic);
  if (!normalizedTopic) return null;
  const catalog = psychoeducationCatalogForLanguage(language);
  const body = catalog[normalizedTopic];
  if (!body) return null;
  const meta = getTopicMeta(normalizedTopic);
  const lang = normalizeApiLanguage(language);
  return {
    ...body,
    topic: normalizedTopic,
    title: lang === 'en' ? meta?.titleEn : meta?.titleEs,
    version: PSYCHOEDUCATION_VERSION,
    interventionId: meta?.interventionId || null,
    disclaimer: getPsychoeducationDisclaimer(language),
    clinicalReview: {
      ...normalizeClinicalReview(lang),
    },
    mechanismLine:
      lang === 'en' ? meta?.mechanismLineEn : meta?.mechanismLineEs,
  };
};

/**
 * @param {string} [language='es']
 * @returns {string[]}
 */
export const getAvailableTopics = (language = 'es') => {
  const catalog = psychoeducationCatalogForLanguage(language);
  return PSYCHOEDUCATION_TOPIC_ORDER.filter((t) => catalog[t]);
};
