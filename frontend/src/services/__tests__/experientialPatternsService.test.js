jest.mock('../../config/api', () => ({
  api: {
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  ENDPOINTS: {
    EXPERIENTIAL_PATTERNS: '/api/experiential-patterns',
    EXPERIENTIAL_PATTERNS_CONSENT: '/api/experiential-patterns/consent',
    EXPERIENTIAL_PATTERN_BY_ID: (id) => `/api/experiential-patterns/${id}`,
  },
}));

import { api } from '../../config/api';
import {
  archiveExperientialPattern,
  fetchExperientialPatterns,
  fetchExperientialPatternsConsent,
  setExperientialPatternsConsent,
  updateExperientialPattern,
} from '../experientialPatternsService';

describe('experientialPatternsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetchConsent', async () => {
    api.get.mockResolvedValue({ data: { consent: { enabled: true } } });
    const c = await fetchExperientialPatternsConsent();
    expect(c.enabled).toBe(true);
    expect(api.get).toHaveBeenCalledWith('/api/experiential-patterns/consent');
  });

  it('setConsent', async () => {
    api.patch.mockResolvedValue({ data: { consent: { enabled: true } } });
    const c = await setExperientialPatternsConsent(true);
    expect(c.enabled).toBe(true);
  });

  it('fetchPatterns', async () => {
    api.get.mockResolvedValue({
      data: { patterns: [{ id: '507f1f77bcf86cd799439011', statement: 'x' }] },
    });
    const list = await fetchExperientialPatterns();
    expect(list).toHaveLength(1);
  });

  it('update followUpStatus', async () => {
    api.patch.mockResolvedValue({
      data: { pattern: { id: '507f1f77bcf86cd799439011', followUpStatus: 'changed' } },
    });
    const p = await updateExperientialPattern('507f1f77bcf86cd799439011', {
      followUpStatus: 'changed',
    });
    expect(p.followUpStatus).toBe('changed');
  });

  it('archive', async () => {
    api.delete.mockResolvedValue({
      data: { pattern: { id: '507f1f77bcf86cd799439011', isActive: false } },
    });
    const p = await archiveExperientialPattern('507f1f77bcf86cd799439011');
    expect(p.isActive).toBe(false);
  });
});
