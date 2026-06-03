/**
 * Casos canónicos EN (#85 / #78 / tiers).
 */
export const CHAT_PSYCHOEDUCATION_SMOKE_CASES_EN = [
  {
    id: 'en_stress_panic',
    message:
      'I am so stressed, 9/10, nervous, I think it is a panic attack',
    expectedPsycho: ['psychoeducation_stress', 'psychoeducation_anxiety'],
    allowedEmotions: ['ansiedad', 'neutral'],
    minIntensity: 7,
    minSuggestions: 2,
    expectPromptSnippet: true,
    primaryPsycho: 'psychoeducation_anxiety',
    language: 'en',
  },
  {
    id: 'en_sleep',
    message: 'I have had insomnia for weeks and wake up at night. 7/10',
    expectedPsycho: ['psychoeducation_sleep'],
    allowedEmotions: ['ansiedad', 'neutral'],
    minIntensity: 5,
    minSuggestions: 1,
    language: 'en',
  },
  {
    id: 'en_work_stress',
    message: 'Work stress has me burned out, too many responsibilities. 6/10',
    expectedPsycho: ['psychoeducation_stress'],
    allowedEmotions: ['ansiedad', 'neutral'],
    minIntensity: 5,
    minSuggestions: 2,
    primaryPsycho: 'psychoeducation_stress',
    language: 'en',
  },
];
