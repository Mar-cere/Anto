/**
 * Opciones de enfoque del onboarding (fuente de verdad ES/EN).
 * Deben coincidir con REGISTER.QUESTIONS_FOCUS_OPTIONS en el frontend.
 */
export const ONBOARDING_FOCUS_LABELS = {
  es: [
    'Apoyo emocional',
    'Ansiedad o estrés',
    'Sueño y descanso',
    'Hábitos y rutinas',
    'Enfoque y organización',
  ],
  en: [
    'Emotional support',
    'Anxiety or stress',
    'Sleep and rest',
    'Habits and routines',
    'Focus and organization',
  ],
};

/** Valores históricos (formulario anterior de 3 preguntas). */
export const LEGACY_ONBOARDING_LABELS = {
  es: [
    'Autoestima',
    'Paso a paso',
    'Escucha y compañía',
    'Ideas prácticas',
  ],
  en: [
    'Self-esteem',
    'Step by step',
    'Listening and support',
    'Practical ideas',
  ],
};

export const ALL_ONBOARDING_FOCUS_LABELS = [
  ...ONBOARDING_FOCUS_LABELS.es,
  ...ONBOARDING_FOCUS_LABELS.en,
  ...LEGACY_ONBOARDING_LABELS.es,
  ...LEGACY_ONBOARDING_LABELS.en,
];
