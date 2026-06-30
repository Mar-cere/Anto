/**
 * Tests para utilidades del panel de recursos de crisis.
 */
import {
  buildTelUri,
  findLatestCrisisContextFromMessages,
  normalizeCrisisResourcesPayload,
  shouldShowCrisisResourcesPanel,
} from '../crisisResources';

describe('crisisResources utils', () => {
  it('normalizeCrisisResourcesPayload filtra ítems inválidos', () => {
    const out = normalizeCrisisResourcesPayload({
      countryLabel: 'Chile',
      items: [
        { id: 'emergency', label: 'Emergencias', value: '133', dial: '133' },
        { id: 'bad', label: '', value: '' },
      ],
      disclaimer: 'Test',
      transparency: [
        { id: 'why', text: 'Por qué' },
        { id: 'bad', text: '' },
      ],
    });
    expect(out.items).toHaveLength(1);
    expect(out.items[0].dial).toBe('133');
    expect(out.transparency).toHaveLength(1);
    expect(out.transparency[0].id).toBe('why');
  });

  it('shouldShowCrisisResourcesPanel alinea con backend (#19)', () => {
    expect(shouldShowCrisisResourcesPanel({ riskLevel: 'MEDIUM' })).toBe(true);
    expect(shouldShowCrisisResourcesPanel({ riskLevel: 'WARNING' })).toBe(false);
    expect(
      shouldShowCrisisResourcesPanel({ riskLevel: 'WARNING', hasBatterySignal: true }),
    ).toBe(true);
    expect(shouldShowCrisisResourcesPanel({ riskLevel: 'LOW' })).toBe(false);
  });

  it('findLatestCrisisContextFromMessages solo hidrata MEDIUM/HIGH o hard-stop en último assistant', () => {
    const ctx = findLatestCrisisContextFromMessages([
      { role: 'user', content: 'hola' },
      { role: 'assistant', content: '...', metadata: { crisis: { riskLevel: 'HIGH', hardStop: true } } },
    ]);
    expect(ctx).toEqual({ riskLevel: 'HIGH', hardStop: true });

    expect(
      findLatestCrisisContextFromMessages([
        { role: 'assistant', content: 'a', metadata: { crisis: { riskLevel: 'WARNING' } } },
      ]),
    ).toBeNull();

    expect(
      findLatestCrisisContextFromMessages([
        { role: 'assistant', content: 'viejo', metadata: { crisis: { riskLevel: 'HIGH' } } },
        { role: 'user', content: 'gracias' },
        { role: 'assistant', content: 'de nada', metadata: { crisis: { riskLevel: 'LOW' } } },
      ]),
    ).toBeNull();
  });

  it('buildTelUri genera enlace tel', () => {
    expect(buildTelUri('133')).toBe('tel:133');
    expect(buildTelUri('ab')).toBeNull();
    expect(buildTelUri('1'.repeat(20))).toBeNull();
  });

  it('normalizeCrisisResourcesPayload recorta textos largos y descarta dial inválido', () => {
    const long = 'x'.repeat(400);
    const out = normalizeCrisisResourcesPayload({
      items: [{ id: 'a', label: long, value: '112', dial: '1'.repeat(30) }],
      disclaimer: long,
    });
    expect(out.items[0].label.length).toBeLessThanOrEqual(120);
    expect(out.items[0].dial).toBeUndefined();
    expect(out.disclaimer.length).toBeLessThanOrEqual(500);
  });
});
