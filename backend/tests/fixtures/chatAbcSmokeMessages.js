/**
 * Mensajes canónicos para validar sugerencia ABC en chat (#86 / #127).
 * ABC aparece en intensidad media (5–7) para tristeza, enojo y culpa.
 * Intensidad alta (≥8) prioriza regulación / contención, no ABC.
 */
export const CHAT_ABC_SMOKE_CASES = [
  {
    id: 'sadness_medium_abc',
    message:
      'Me siento triste y apagado, 7/10. Noto que siempre pienso lo peor después de discutir con mi pareja.',
    allowedEmotions: ['tristeza'],
    minIntensity: 6,
    maxIntensity: 7,
    expectAbc: true,
    expectAbcFirst: false,
    expectAt: true,
  },
  {
    id: 'anger_medium_abc',
    message:
      'Estoy enojado, 6/10. Reaccioné mal en la reunión y quiero entender qué pasó en mi cabeza.',
    allowedEmotions: ['enojo'],
    minIntensity: 5,
    maxIntensity: 7,
    expectAbc: true,
  },
  {
    id: 'guilt_medium_abc',
    message:
      'Siento mucha culpa por lo que dije ayer, 7/10. Repaso una y otra vez cómo reaccioné mal.',
    allowedEmotions: ['culpa', 'tristeza'],
    minIntensity: 6,
    maxIntensity: 7,
    expectAbc: true,
  },
  {
    id: 'sadness_high_no_abc',
    message:
      'Me siento devastado, tristeza 9/10, no puedo más. Necesito contención ahora.',
    allowedEmotions: ['tristeza', 'ansiedad'],
    minIntensity: 8,
    expectAbc: false,
  },
];

export const CHAT_ABC_SMOKE_CASES_EN = [
  {
    id: 'sadness_medium_abc_en',
    message:
      'I feel sad and low, 7/10. I keep thinking the worst after arguing with my partner.',
    allowedEmotions: ['tristeza'],
    minIntensity: 6,
    maxIntensity: 7,
    expectAbc: true,
    expectAbcFirst: false,
  },
];
