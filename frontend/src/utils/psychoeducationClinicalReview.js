/**
 * Presentación del sello de revisión (#111).
 */

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
