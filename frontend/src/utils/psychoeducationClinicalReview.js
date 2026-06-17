/**
 * Presentación del sello de revisión (#111).
 */

const DEFAULT_REVIEW = {
  status: 'editorial_review',
  version: '1.0.0',
  reviewedAt: '2026-06-01',
  noteEs: 'Revisión editorial de contenido; no constituye validación clínica individual.',
  noteEn: 'Editorial content review; not individual clinical validation.',
};

export function getDefaultClinicalReview(language = 'es') {
  const lang = String(language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
  const statusLabel =
    lang === 'en' ? 'Editorial review' : 'Revisión editorial';
  return {
    status: DEFAULT_REVIEW.status,
    version: DEFAULT_REVIEW.version,
    reviewedAt: DEFAULT_REVIEW.reviewedAt,
    note: lang === 'en' ? DEFAULT_REVIEW.noteEn : DEFAULT_REVIEW.noteEs,
    statusLabel,
  };
}

export function resolveClinicalReviewSeal(clinicalReview, texts) {
  if (!clinicalReview || typeof clinicalReview !== 'object') return null;
  const version = String(clinicalReview.version || '1.0.0').trim();
  const reviewedAt = String(clinicalReview.reviewedAt || '').trim();
  const statusLabel =
    String(clinicalReview.statusLabel || '').trim() ||
    (clinicalReview.status === 'clinical_review'
      ? texts.REVIEW_STATUS_CLINICAL
      : texts.REVIEW_STATUS_EDITORIAL);
  const note = String(clinicalReview.note || '').trim();

  const headline = texts.REVIEW_SEAL_HEADLINE.replace('{version}', version)
    .replace('{status}', statusLabel)
    .replace('{date}', reviewedAt);

  const shortLabel = texts.REVIEW_SEAL_SHORT.replace('{version}', version).replace(
    '{status}',
    statusLabel,
  );

  return {
    status: clinicalReview.status || 'editorial_review',
    version,
    reviewedAt,
    statusLabel,
    headline,
    shortLabel,
    note,
  };
}
