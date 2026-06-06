import { normalizeClinicalReview } from '../../../constants/psychoeducationClinicalReview.js';

describe('psychoeducationClinicalReview (#111)', () => {
  it('normaliza revisión editorial en español', () => {
    const review = normalizeClinicalReview('es');
    expect(review.status).toBe('editorial_review');
    expect(review.statusLabel).toMatch(/editorial/i);
    expect(review.note).toMatch(/editorial/i);
    expect(review.version).toBe('1.0.0');
    expect(review.reviewedAt).toBeTruthy();
  });

  it('normaliza revisión editorial en inglés', () => {
    const review = normalizeClinicalReview('en');
    expect(review.statusLabel).toMatch(/Editorial review/i);
    expect(review.note).toMatch(/Editorial content review/i);
    expect(review.note).not.toMatch(/Revisión editorial de contenido/);
  });
});
