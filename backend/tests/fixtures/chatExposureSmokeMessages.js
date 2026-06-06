/**
 * Mensajes canónicos para validar Jerarquía de exposición en chat (#87 / #127).
 */
export const CHAT_EXPOSURE_SMOKE_CASES = [
  {
    id: 'anxiety_medium_avoidance',
    message:
      'Tengo ansiedad social, 6/10. Evito hablar en reuniones porque me da mucho miedo quedar mal.',
    minIntensity: 5,
    maxIntensity: 7,
    expectExposure: true,
    expectExposureFirst: true,
    expectRegulation: false,
  },
  {
    id: 'anxiety_high_avoidance',
    message:
      'Tengo ansiedad social, 8/10. Evito hablar en reuniones porque me da mucho miedo quedar mal.',
    minIntensity: 8,
    expectExposure: true,
    expectExposureFirst: true,
    expectRegulation: true,
  },
  {
    id: 'anxiety_high_no_avoidance',
    message:
      'Me siento muy ansioso, corazón acelerado y no puedo dejar de anticipar lo peor. Diría un 8/10',
    minIntensity: 7,
    expectExposure: false,
    expectExposureFirst: false,
    expectRegulation: true,
  },
];

export const CHAT_EXPOSURE_SMOKE_CASES_EN = [
  {
    id: 'anxiety_high_avoidance_en',
    message:
      'I have social anxiety, 8/10. I avoid speaking in meetings because I am scared of looking bad.',
    minIntensity: 7,
    expectExposure: true,
    expectExposureFirst: true,
  },
];
