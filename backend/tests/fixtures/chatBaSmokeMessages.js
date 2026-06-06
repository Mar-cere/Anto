/**
 * Mensajes canónicos para activación conductual en chat (#88 / #127).
 */
export const CHAT_BA_SMOKE_CASES = [
  {
    id: 'sadness_medium_apathy',
    message:
      'Me siento apagado y sin ganas de hacer nada, 6/10. Llevo días sin salir de casa.',
    minIntensity: 5,
    maxIntensity: 7,
    expectBa: true,
    expectBaFirst: true,
  },
  {
    id: 'sadness_medium_cognitive_abc',
    message:
      'Me siento triste y apagado, 7/10. Noto que siempre pienso lo peor después de discutir con mi pareja.',
    minIntensity: 6,
    maxIntensity: 7,
    expectBa: false,
    expectBaFirst: false,
    expectAbc: true,
    expectAbcFirst: false,
    expectAt: true,
    expectAtFirst: true,
  },
  {
    id: 'sadness_high_no_ba',
    message: 'Me siento muy mal, 9/10. Necesito contención.',
    minIntensity: 8,
    expectBa: false,
    expectAbc: false,
  },
];

export const CHAT_BA_SMOKE_CASES_EN = [
  {
    id: 'sadness_medium_apathy_en',
    message: 'I feel numb and have no motivation, 6/10. I have not left home in days.',
    minIntensity: 5,
    expectBa: true,
    expectBaFirst: true,
  },
];
