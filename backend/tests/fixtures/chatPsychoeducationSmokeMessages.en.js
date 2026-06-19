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
    message: 'Work stress has me overwhelmed, too many responsibilities. 6/10',
    expectedPsycho: ['psychoeducation_work_stress'],
    allowedEmotions: ['ansiedad', 'neutral'],
    minIntensity: 5,
    minSuggestions: 2,
    primaryPsycho: 'psychoeducation_work_stress',
    language: 'en',
  },
  {
    id: 'en_depression_advanced',
    message:
      'I keep ruminating with harsh self-criticism and feel nothing will get better. 7/10',
    expectedPsycho: ['psychoeducation_depression_advanced'],
    allowedEmotions: ['tristeza', 'neutral'],
    minIntensity: 6,
    minSuggestions: 2,
    primaryPsycho: 'psychoeducation_depression_advanced',
    language: 'en',
  },
  {
    id: 'en_anxiety_advanced',
    message:
      'I have constant worry, cannot stop thinking, and keep seeking reassurance. 7/10',
    expectedPsycho: ['psychoeducation_anxiety_advanced'],
    allowedEmotions: ['ansiedad', 'neutral'],
    minIntensity: 6,
    minSuggestions: 2,
    primaryPsycho: 'psychoeducation_anxiety_advanced',
    language: 'en',
  },
  {
    id: 'en_grief',
    message: 'I lost my dad and I miss him so much. 8/10',
    expectedPsycho: ['psychoeducation_grief'],
    allowedEmotions: ['tristeza', 'neutral'],
    minIntensity: 6,
    minSuggestions: 1,
    language: 'en',
  },
  {
    id: 'en_burnout',
    message: 'I am burned out from work and have no energy left. 7/10',
    expectedPsycho: ['psychoeducation_burnout'],
    allowedEmotions: ['neutral', 'tristeza', 'ansiedad'],
    minIntensity: 5,
    minSuggestions: 1,
    language: 'en',
  },
];
