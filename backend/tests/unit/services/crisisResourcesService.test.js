/**
 * Tests unitarios para crisisResourcesService.
 */
import {
  buildCrisisResourcesClientPayload,
  crisisResourcesForTurn,
  extractDialableNumber,
  parseCrisisResourcesCountryQuery,
  resolveCrisisResourceDial,
  sanitizeDialableNumber,
  shouldExposeCrisisResourcesPanel,
} from '../../../services/crisisResourcesService.js';

describe('crisisResourcesService', () => {
  it('shouldExposeCrisisResourcesPanel en WARNING/MEDIUM/HIGH y hard-stop', () => {
    expect(shouldExposeCrisisResourcesPanel({ riskLevel: 'LOW' })).toBe(false);
    expect(shouldExposeCrisisResourcesPanel({ riskLevel: 'WARNING' })).toBe(false);
    expect(
      shouldExposeCrisisResourcesPanel({
        riskLevel: 'WARNING',
        hasBatterySignal: true,
      }),
    ).toBe(true);
    expect(
      shouldExposeCrisisResourcesPanel({
        riskLevel: 'WARNING',
        crisisProtocolActive: true,
      }),
    ).toBe(true);
    expect(shouldExposeCrisisResourcesPanel({ riskLevel: 'HIGH' })).toBe(true);
    expect(shouldExposeCrisisResourcesPanel({ riskLevel: 'LOW', hardStop: true })).toBe(true);
  });

  it('resolveCrisisResourceDial conserva códigos cortos con asterisco', () => {
    expect(resolveCrisisResourceDial('*4141')).toBe('*4141');
    expect(resolveCrisisResourceDial('*4141', null)).toBe('*4141');
  });

  it('extractDialableNumber obtiene dígitos marcables', () => {
    expect(extractDialableNumber('600 360 7777')).toBe('6003607777');
    expect(extractDialableNumber('112')).toBe('112');
    expect(extractDialableNumber('sin número')).toBeNull();
  });

  it('buildCrisisResourcesClientPayload incluye Chile con preferencia CL', () => {
    const payload = buildCrisisResourcesClientPayload({
      preferences: { country: 'CL' },
      language: 'es',
      riskLevel: 'HIGH',
      hardStop: true,
    });
    expect(payload.countryIso).toBe('CL');
    expect(payload.items.some((i) => i.id === 'emergency' && i.dial === '133')).toBe(true);
    expect(payload.items.some((i) => i.id === 'suicide_prevention' && i.dial === '*4141')).toBe(true);
    expect(payload.items.some((i) => i.id === 'suicide_prevention' && i.value === '*4141')).toBe(true);
    expect(payload.disclaimer).toMatch(/no es un servicio de emergencias/i);
  });

  it('buildCrisisResourcesClientPayload incluye transparencia T1–T5', () => {
    const base = buildCrisisResourcesClientPayload({
      preferences: { country: 'ES' },
      language: 'es',
      riskLevel: 'MEDIUM',
    });
    expect(base.transparency.length).toBe(4);
    expect(base.transparency.some((b) => b.id === 'why')).toBe(true);

    const withAlert = buildCrisisResourcesClientPayload({
      preferences: { country: 'ES' },
      language: 'es',
      riskLevel: 'HIGH',
      showContactAlertNotice: true,
    });
    expect(withAlert.transparency.some((b) => b.id === 'contact_alert')).toBe(true);
  });

  it('crisisResourcesForTurn retorna null en LOW sin hard-stop', () => {
    expect(crisisResourcesForTurn({ riskLevel: 'LOW' })).toBeNull();
    expect(crisisResourcesForTurn({ riskLevel: 'WARNING' })).toBeNull();
    expect(crisisResourcesForTurn({ riskLevel: 'MEDIUM', preferences: { country: 'ES' } })).not.toBeNull();
  });

  it('parseCrisisResourcesCountryQuery valida ISO conocido', () => {
    expect(parseCrisisResourcesCountryQuery('CL')).toBe('CL');
    expect(parseCrisisResourcesCountryQuery('xx')).toBeNull();
    expect(parseCrisisResourcesCountryQuery('<script>')).toBeNull();
  });

  it('sanitizeDialableNumber rechaza números demasiado largos', () => {
    expect(sanitizeDialableNumber('123')).toBe('123');
    expect(sanitizeDialableNumber('1'.repeat(20))).toBeNull();
  });
});
