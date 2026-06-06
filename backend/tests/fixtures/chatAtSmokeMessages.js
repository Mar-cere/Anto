/** Mensajes canónicos para smoke tests #89 (dispositivo). */
export const CHAT_AT_SMOKE_CASES = [
  {
    id: 'distorsion-lectura-mente',
    message:
      'Me siento ansioso, 6/10. Sé que van a pensar mal de mí y nunca va a salir bien.',
    allowedEmotions: ['ansiedad', 'miedo', 'tristeza', 'neutral'],
    minIntensity: 5,
    maxIntensity: 8,
    expectAt: true,
    expectAtFirst: true,
    expectAbc: false,
  },
  {
    id: 'cognitivo-sin-distorsion-clara',
    message:
      'Me siento enojado, 6/10. Noto que reaccioné mal y no paro de darle vueltas a lo que dije.',
    allowedEmotions: ['enojo', 'ansiedad', 'tristeza'],
    minIntensity: 5,
    maxIntensity: 8,
    expectAt: true,
    expectAtFirst: false,
    expectAbc: true,
    expectAbcFirst: true,
  },
  {
    id: 'apatia-sin-cognicion',
    message: 'Me siento apagado y sin ganas de hacer nada, 6/10. Llevo días sin salir de casa.',
    allowedEmotions: ['tristeza'],
    minIntensity: 5,
    maxIntensity: 8,
    expectAt: false,
    expectBa: true,
  },
];

export const CHAT_AT_SMOKE_CASES_EN = [
  {
    id: 'cognitive-en',
    message:
      'I feel anxious, 6/10. I keep thinking the worst will happen and nothing will work out.',
    minIntensity: 5,
    expectAt: true,
    expectAtFirst: false,
  },
];
