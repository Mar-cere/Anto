/**
 * Governance de revisión por módulo (#111).
 */
export const PSYCHOEDUCATION_CLINICAL_REVIEW = {
  status: 'editorial_review',
  version: '1.0.0',
  reviewedAt: '2026-06-01',
  noteEs: 'Revisión editorial de contenido; no constituye validación clínica individual.',
  noteEn: 'Editorial content review; not individual clinical validation.',
};

const STATUS_LABELS = {
  editorial_review: {
    es: 'Revisión editorial',
    en: 'Editorial review',
  },
  clinical_review: {
    es: 'Revisión clínica',
    en: 'Clinical review',
  },
};

export function normalizeClinicalReview(language = 'es') {
  const lang = String(language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
  const status = PSYCHOEDUCATION_CLINICAL_REVIEW.status || 'editorial_review';
  const labels = STATUS_LABELS[status] || STATUS_LABELS.editorial_review;
  return {
    status,
    version: PSYCHOEDUCATION_CLINICAL_REVIEW.version,
    reviewedAt: PSYCHOEDUCATION_CLINICAL_REVIEW.reviewedAt,
    note: lang === 'en' ? PSYCHOEDUCATION_CLINICAL_REVIEW.noteEn : PSYCHOEDUCATION_CLINICAL_REVIEW.noteEs,
    statusLabel: labels[lang],
  };
}
