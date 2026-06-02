/**
 * Claves de contenido vs metadato (#85). Mantener alineado con
 * frontend/src/screens/techniques/psychoeducationDisplay.js
 */

export const PSYCHOEDUCATION_META_KEYS = [
  'disclaimer',
  'sources',
  'topic',
  'title',
  'summary',
  'version',
  'interventionId',
  'mechanismLine',
  'clinicalReview',
  'tags',
  'estimatedMinutes',
  'cardVariant',
  'previewTitle',
  'previewSummary',
];

export const PSYCHOEDUCATION_CONTENT_KEYS = [
  'whatIs',
  'symptoms',
  'signs',
  'causes',
  'triggers',
  'whatHelps',
  'treatment',
  'management',
  'hygiene',
  'skills',
  'techniques',
  'benefits',
  'types',
  'whenToSeekHelp',
  'whenWorry',
];

export const PSYCHOEDUCATION_META_KEY_SET = new Set(PSYCHOEDUCATION_META_KEYS);
export const PSYCHOEDUCATION_CONTENT_KEY_SET = new Set(PSYCHOEDUCATION_CONTENT_KEYS);

export function psychoeducationBodyKeys(module) {
  if (!module || typeof module !== 'object') return [];
  return Object.keys(module).filter((key) => !PSYCHOEDUCATION_META_KEY_SET.has(key));
}
