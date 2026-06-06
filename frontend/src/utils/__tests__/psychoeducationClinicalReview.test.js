import { resolveClinicalReviewSeal } from '../psychoeducationClinicalReview';

const TEXTS_ES = {
  REVIEW_SEAL_HEADLINE: 'v{version} · {status} · {date}',
  REVIEW_SEAL_SHORT: 'v{version} · {status}',
  REVIEW_STATUS_EDITORIAL: 'Revisión editorial',
  REVIEW_STATUS_CLINICAL: 'Revisión clínica',
};

describe('psychoeducationClinicalReview (#111)', () => {
  it('construye headline y nota', () => {
    const seal = resolveClinicalReviewSeal(
      {
        status: 'editorial_review',
        version: '1.0.0',
        reviewedAt: '2026-06-01',
        statusLabel: 'Revisión editorial',
        note: 'Nota de prueba.',
      },
      TEXTS_ES,
    );
    expect(seal.headline).toContain('v1.0.0');
    expect(seal.headline).toContain('Revisión editorial');
    expect(seal.shortLabel).toBe('v1.0.0 · Revisión editorial');
    expect(seal.note).toBe('Nota de prueba.');
  });

  it('devuelve null sin clinicalReview', () => {
    expect(resolveClinicalReviewSeal(null, TEXTS_ES)).toBeNull();
  });
});
