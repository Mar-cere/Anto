/**
 * Mensajes canónicos para validar psicoed contextual en chat (#85 / #127).
 * Réplica de la guía de prueba en dispositivo.
 */
export const CHAT_PSYCHOEDUCATION_SMOKE_CASES = [
  {
    id: 'anxiety_explicit',
    message:
      'Me siento muy ansioso, corazón acelerado y no puedo dejar de anticipar lo peor. Diría un 8/10',
    expectedPsycho: ['psychoeducation_anxiety'],
    allowedEmotions: ['ansiedad'],
    minIntensity: 7,
    minSuggestions: 2,
  },
  {
    id: 'sleep_insomnia',
    message:
      'Llevo semanas con insomnio y me despierto a la noche sin poder volver a dormir. 7/10',
    expectedPsycho: ['psychoeducation_sleep'],
    allowedEmotions: ['ansiedad', 'neutral'],
    minIntensity: 5,
    minSuggestions: 2,
  },
  {
    id: 'stress_work',
    message:
      'El estrés del trabajo me tiene agotada, con demasiadas responsabilidades. 6/10',
    expectedPsycho: ['psychoeducation_stress'],
    allowedEmotions: ['ansiedad', 'neutral'],
    minIntensity: 5,
    minSuggestions: 2,
  },
  {
    id: 'emotion_regulation_overflow',
    message: 'Me desborda lo que siento y a veces exploto sin querer. 7/10',
    expectedPsycho: ['psychoeducation_emotion_regulation'],
    allowedEmotions: ['enojo', 'neutral'],
    minIntensity: 6,
    minSuggestions: 2,
  },
  {
    id: 'anger_explicit',
    message: 'Estoy muy enojado, siento que voy a explotar con mi pareja. 8/10',
    expectedPsycho: ['psychoeducation_anger'],
    allowedEmotions: ['enojo'],
    minIntensity: 7,
    minSuggestions: 2,
  },
  {
    id: 'low_mood',
    message: 'Me siento muy triste y sin energía, nada me motiva. 7/10',
    expectedPsycho: ['psychoeducation_depression'],
    allowedEmotions: ['tristeza'],
    minIntensity: 6,
    minSuggestions: 2,
  },
  {
    id: 'trauma_flashback',
    message: 'Tengo flashbacks de una experiencia muy difícil. 7/10',
    expectedPsycho: ['psychoeducation_trauma'],
    allowedEmotions: ['neutral', 'miedo', 'tristeza', 'ansiedad'],
    minIntensity: 5,
    minSuggestions: 1,
  },
  /** Validado en dispositivo (jun 2026): estrés 9/10 + crisis de pánico. */
  {
    id: 'device_stress_panic',
    message:
      'Ahora mismo me siento estreso 9/10, enfermo del estomago, crisis de panico',
    expectedPsycho: ['psychoeducation_anxiety'],
    allowedEmotions: ['ansiedad'],
    minIntensity: 8,
    minSuggestions: 2,
    expectPromptSnippet: true,
  },
];
