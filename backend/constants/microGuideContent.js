/**
 * Contenido de micro-guías in-app (#90–#99 y catálogo #127).
 */
import { MICRO_GUIDE_MODULES_EN } from './microGuideContent.en.js';
import { normalizeClinicalReview } from './psychoeducationClinicalReview.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';
import { INTERVENTION_CATALOG } from './interventionCatalog.js';
import { getInterventionCatalogLabel } from './interventionCatalog.js';

export const MICRO_GUIDE_IDS = Object.values(INTERVENTION_CATALOG)
  .filter((e) => e?.type === 'micro_guide')
  .map((e) => e.id);

function step(title, body) {
  return { title: String(title || '').trim(), body: String(body || '').trim() };
}

export const MICRO_GUIDE_MODULES = {
  grief_roadmap: {
    title: 'Hoja de ruta del duelo',
    intro: 'Una guía breve para acompañarte en la pérdida, sin apurar el proceso.',
    estimatedMinutes: 3,
    steps: [
      step('Reconoce lo que sientes', 'Nombra una emoción presente (tristeza, vacío, enojo). No tienes que explicarla bien.'),
      step('Un gesto simbólico', 'Escribe una frase que quieras decirle a la persona o situación que extrañas.'),
      step('Cuidado mínimo hoy', 'Elige una acción pequeña: agua, descanso, un mensaje a alguien de confianza.'),
    ],
    completionNote: 'El duelo no es lineal. Volver a esta guía cuando lo necesites está bien.',
  },
  relapse_prevention: {
    title: 'Prevención de recaída',
    intro: 'Plan breve para cuando notas que vuelves a patrones que querías cambiar.',
    estimatedMinutes: 3,
    steps: [
      step('Señal temprana', '¿Qué pensamiento, sensación corporal o situación apareció primero?'),
      step('Plan B de 5 minutos', 'Define una acción alternativa muy pequeña que sí puedas hacer ahora.'),
      step('Apoyo', '¿A quién podrías avisar o qué recurso de la app retomarías hoy?'),
    ],
    completionNote: 'Un tropiezo no borra el avance previo. Ajustar el plan es parte del cuidado.',
  },
  dbt_stop_skill: {
    title: 'Técnica STOP',
    intro: 'Cuatro pasos para frenar antes de actuar en automático.',
    estimatedMinutes: 2,
    steps: [
      step('S — Parar', 'Detén lo que haces. Pies en el suelo, manos quietas un momento.'),
      step('T — Respirar', 'Tres respiraciones lentas. Cuenta hasta cuatro al inhalar y al exhalar.'),
      step('O — Observar', 'Nota qué pasa en cuerpo y mente sin juzgar.'),
      step('P — Proceder', 'Elige el siguiente paso más alineado con tus valores, aunque sea pequeño.'),
    ],
    completionNote: 'STOP no elimina la emoción; te da espacio para elegir.',
  },
  act_values_check: {
    title: 'Revisar valores',
    intro: 'Conecta lo que haces hoy con lo que realmente importa.',
    estimatedMinutes: 3,
    steps: [
      step('Tres valores', 'Escribe tres palabras que representen cómo quieres vivir (ej. honestidad, calma, vínculo).'),
      step('Acción alineada', '¿Qué acción de 10 minutos honraría uno de esos valores hoy?'),
      step('Obstáculo', '¿Qué te aleja de ese valor? Nómbralo sin culparte.'),
    ],
    completionNote: 'Los valores guían; no exigen perfección.',
  },
  sleep_diary_lite: {
    title: 'Diario de sueño breve',
    intro: 'Registro mínimo para ver patrones sin obsesionarte con los números.',
    estimatedMinutes: 2,
    steps: [
      step('Anoche', '¿A qué hora te acostaste y cuánto tardaste en dormirte (aprox.)?'),
      step('Hoy', '¿A qué hora te despertaste y cómo te sientes de energía (1–10)?'),
      step('Un hábito', 'Elige un solo cambio para esta noche: menos pantalla, horario fijo o ambiente oscuro.'),
    ],
    completionNote: 'La regularidad suele ayudar más que la perfección del diario.',
  },
  mindfulness_sequence: {
    title: 'Secuencia mindfulness',
    intro: 'Anclaje breve en el presente (MBSR-lite).',
    estimatedMinutes: 3,
    steps: [
      step('Postura', 'Siéntate cómodo. Hombros sueltos, mandíbula relajada.'),
      step('Respiración', 'Sigue el aire entrando y saliendo durante un minuto.'),
      step('Sonidos y cuerpo', 'Nota tres sonidos y una sensación corporal sin cambiarla.'),
    ],
    completionNote: 'La mente divagará; volver a la respiración es la práctica.',
  },
  assertive_i_messages: {
    title: 'Mensajes yo',
    intro: 'Formula un límite o petición con claridad y respeto.',
    estimatedMinutes: 3,
    steps: [
      step('Cuando…', 'Describe el hecho concreto, sin insultos ni generalizaciones.'),
      step('Me siento…', 'Nombra tu emoción y su intensidad.'),
      step('Necesito…', 'Pide un cambio específico o un acuerdo posible.'),
    ],
    completionNote: 'Practica el mensaje en voz alta antes de enviarlo si ayuda.',
  },
  problem_solving_psst: {
    title: 'Resolución de problemas (PSST)',
    intro: 'Estructura un problema en pasos manejables.',
    estimatedMinutes: 4,
    steps: [
      step('Definir', 'Escribe el problema en una frase observable (qué pasa, no quién es malo).'),
      step('Opciones', 'Lista al menos tres alternativas, aunque parezcan imperfectas.'),
      step('Elegir y probar', 'Marca la opción más viable y el primer paso de menos de 15 minutos.'),
    ],
    completionNote: 'Puedes revisar el plan mañana con datos nuevos.',
  },
  performance_anxiety_tool: {
    title: 'Ansiedad por rendimiento',
    intro: 'Preparación breve antes de exponerte o rendir.',
    estimatedMinutes: 2,
    steps: [
      step('Expectativa realista', '¿Cuál es el objetivo mínimo aceptable, no el perfecto?'),
      step('Cuerpo', 'Tensa y suelta hombros y mandíbula tres veces.'),
      step('Frase de apoyo', 'Escribe una frase que dirías a un amigo en tu lugar.'),
    ],
    completionNote: 'La ansiedad es energía; puedes canalizarla hacia la preparación.',
  },
  present_moment_exercise: {
    title: 'Volver al presente',
    intro: 'Grounding rápido cuando la mente se adelanta.',
    estimatedMinutes: 2,
    steps: [
      step('5-4-3-2-1', 'Nombra 5 cosas que ves, 4 que tocas, 3 que oyes, 2 que hueles, 1 que saboreas.'),
      step('Pies', 'Nota el contacto de tus pies con el suelo.'),
    ],
    completionNote: 'Repite si la mente vuelve a acelerarse.',
  },
  social_anxiety_tool: {
    title: 'Ansiedad social',
    intro: 'Preparación para interacciones que te generan tensión.',
    estimatedMinutes: 3,
    steps: [
      step('Predicción', '¿Qué crees que ocurrirá? Escríbelo como hipótesis, no hecho.'),
      step('Evidencia alternativa', '¿Qué otra explicación es posible?'),
      step('Micro-paso', 'Define el primer gesto social mínimo (saludar, una pregunta).'),
    ],
    completionNote: 'La exposición gradual reduce el miedo con el tiempo.',
  },
  exposure_guide: {
    title: 'Exposición gradual',
    intro: 'Recuerda los principios de exposición segura.',
    estimatedMinutes: 2,
    steps: [
      step('Jerarquía', 'Empieza por el paso más bajo en tu lista, no por el más difícil.'),
      step('Quédate', 'Permanece hasta que la ansiedad baje un poco sin huir.'),
      step('Registra', 'Anota SUDS antes y después para ver el progreso.'),
    ],
    completionNote: 'Usa la jerarquía de exposición de la app para pasos estructurados.',
  },
  reframing_tool: {
    title: 'Reencuadre',
    intro: 'Cambia el ángulo de un pensamiento rígido.',
    estimatedMinutes: 3,
    steps: [
      step('Pensamiento', 'Escribe la frase automática tal como aparece.'),
      step('Evidencia a favor y en contra', 'Lista hechos, no suposiciones.'),
      step('Alternativa equilibrada', 'Redacta una versión más flexible y realista.'),
    ],
    completionNote: 'El registro AT de la app puede profundizar este ejercicio.',
  },
  task_organization: {
    title: 'Organizar tareas',
    intro: 'Desbloquea la sobrecarga con un primer paso claro.',
    estimatedMinutes: 2,
    steps: [
      step('Volcar', 'Lista todo lo pendiente sin ordenar.'),
      step('Una prioridad', 'Marca la tarea de mayor impacto o la que más te pesa.'),
      step('Primer paso de 5 min', 'Define la acción más pequeña para empezar.'),
    ],
    completionNote: 'Puedes crear la tarea en la app desde el chat si encaja.',
  },
  time_management: {
    title: 'Gestión del tiempo',
    intro: 'Recupera foco cuando el día se dispersa.',
    estimatedMinutes: 2,
    steps: [
      step('Bloque único', 'Elige un bloque de 25 minutos para una sola cosa.'),
      step('Interrupciones', 'Anota qué suele interrumpirte y una regla simple (ej. silencio).'),
      step('Descanso', 'Programa 5 minutos sin pantalla después del bloque.'),
    ],
    completionNote: 'Menos multitarea suele significar más avance real.',
  },
  anger_management: {
    title: 'Manejar el enojo',
    intro: 'Baja la intensidad antes de responder.',
    estimatedMinutes: 3,
    steps: [
      step('Pausa', 'Cuenta hasta 10 antes de escribir o hablar.'),
      step('Cuerpo', 'Nota tensión en mandíbula, puños o pecho.'),
      step('Necesidad', '¿Qué límite o necesidad está detrás del enojo?'),
    ],
    completionNote: 'El enojo suele señalar algo importante; nombrarlo ayuda.',
  },
  physical_activity: {
    title: 'Movimiento suave',
    intro: 'Activación corporal mínima cuando el ánimo está bajo.',
    estimatedMinutes: 2,
    steps: [
      step('Elegir', 'Caminar 5 min, estirar o subir escaleras una vez.'),
      step('Hacerlo ahora o agendar', 'Si no puedes ahora, pon hora concreta hoy.'),
      step('Después', 'Anota cómo se siente el cuerpo (sin exigir euforia).'),
    ],
    completionNote: 'El movimiento suave apoya el ánimo; no sustituye descanso.',
  },
  forgiveness_work: {
    title: 'Perdón (ejercicio breve)',
    intro: 'Trabajo personal sobre culpa o rencor; no es excusar daño.',
    estimatedMinutes: 3,
    steps: [
      step('Qué ocurrió', 'Describe los hechos en pocas líneas.'),
      step('Carga', '¿Qué te cuesta cargar (culpa, rabia, vergüenza)?'),
      step('Liberación parcial', '¿Qué podrías soltar hoy aunque sea un 1%?'),
    ],
    completionNote: 'El perdón profundo puede requerir apoyo profesional.',
  },
  values_exploration: {
    title: 'Explorar valores',
    intro: 'Aclara qué dirección quieres dar a tus decisiones.',
    estimatedMinutes: 3,
    steps: [
      step('Momentos vivos', '¿Cuándo te sentiste más tú mismo/a recientemente?'),
      step('Valor detrás', '¿Qué valor había en esa experiencia?'),
      step('Acción pequeña', 'Un paso de hoy alineado con ese valor.'),
    ],
    completionNote: 'Los valores evolucionan; revísalos con calma.',
  },
  apology_guide: {
    title: 'Pedir disculpas',
    intro: 'Reparar un vínculo con responsabilidad genuina.',
    estimatedMinutes: 3,
    steps: [
      step('Hecho específico', 'Qué hiciste o dijiste, sin «si te ofendiste».'),
      step('Impacto', 'Cómo pudo haber afectado a la otra persona.'),
      step('Compromiso', 'Qué harás distinto a partir de ahora.'),
    ],
    completionNote: 'Una disculpa sincera no exige perdón inmediato.',
  },
};

export function normalizeMicroGuideId(raw) {
  const key = String(raw || '').trim().toLowerCase();
  return MICRO_GUIDE_IDS.includes(key) ? key : null;
}

export function getMicroGuideModule(guideId, language = 'es') {
  const id = normalizeMicroGuideId(guideId);
  if (!id) return null;
  const lang = normalizeApiLanguage(language);
  const catalog = lang === 'en' ? MICRO_GUIDE_MODULES_EN : MICRO_GUIDE_MODULES;
  const body = catalog[id];
  if (!body) return null;
  const entry = INTERVENTION_CATALOG[id];
  return {
    ...body,
    guideId: id,
    interventionId: id,
    title: body.title || getInterventionCatalogLabel(entry, lang),
    disclaimer:
      lang === 'en'
        ? 'Educational guide; not a substitute for professional care.'
        : 'Guía educativa; no sustituye atención profesional.',
    clinicalReview: normalizeClinicalReview(lang),
  };
}

export function getMicroGuideBrowseItems(language = 'es') {
  const lang = normalizeApiLanguage(language);
  return MICRO_GUIDE_IDS.map((id) => {
    const mod = getMicroGuideModule(id, lang);
    const entry = INTERVENTION_CATALOG[id];
    if (!mod || !entry) return null;
    return {
      guideId: id,
      interventionId: id,
      title: mod.title,
      intro: mod.intro,
      estimatedMinutes: mod.estimatedMinutes || 2,
      stepCount: mod.steps?.length || 0,
      icon: entry.icon,
      clinicalReview: mod.clinicalReview,
    };
  }).filter(Boolean);
}

export function getMicroGuideCardFields(guideId, language = 'es') {
  const mod = getMicroGuideModule(guideId, language);
  if (!mod) return null;
  const steps = (mod.steps || []).slice(0, 2).map((s) => s.body);
  return {
    previewTitle: mod.title,
    previewSummary: mod.intro,
    microSteps: steps,
    estimatedMinutes: mod.estimatedMinutes || 2,
    clinicalReview: mod.clinicalReview,
    cardVariant: 'micro_guide_native',
  };
}
