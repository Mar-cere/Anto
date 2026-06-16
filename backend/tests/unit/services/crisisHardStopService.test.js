import { jest } from '@jest/globals';

const { shouldHardStopCrisisLlm, buildHardStopCrisisAssistantContent, buildCrisisHardStopClientPayload } =
  await import('../../../services/crisisHardStopService.js');

describe('crisisHardStopService', () => {
  it('hard-stop solo en HIGH con léxico explícito', () => {
    expect(
      shouldHardStopCrisisLlm({
        enabled: true,
        riskLevel: 'HIGH',
        messageContent: 'quiero morir y no aguanto más',
      }),
    ).toBe(true);
    expect(
      shouldHardStopCrisisLlm({
        enabled: true,
        riskLevel: 'MEDIUM',
        messageContent: 'quiero morir',
      }),
    ).toBe(false);
    expect(
      shouldHardStopCrisisLlm({
        enabled: true,
        riskLevel: 'HIGH',
        messageContent: 'estoy muy mal con mi pareja',
      }),
    ).toBe(false);
    expect(
      shouldHardStopCrisisLlm({
        enabled: false,
        riskLevel: 'HIGH',
        messageContent: 'quiero morir',
      }),
    ).toBe(false);
  });

  it('buildHardStopCrisisAssistantContent incluye bloque de crisis', () => {
    const out = buildHardStopCrisisAssistantContent({ riskLevel: 'HIGH', country: 'GENERAL' });
    expect(out).toContain('seguridad');
    expect(out.length).toBeGreaterThan(80);
  });

  it('buildHardStopCrisisAssistantContent respeta idioma en apertura', () => {
    const en = buildHardStopCrisisAssistantContent({ riskLevel: 'HIGH', language: 'en' });
    expect(en).toContain('Your safety');
    const es = buildHardStopCrisisAssistantContent({ riskLevel: 'HIGH', language: 'es' });
    expect(es).toContain('seguridad');
  });

  it('buildCrisisHardStopClientPayload no expone sugerencias ni TCC', () => {
    const payload = buildCrisisHardStopClientPayload('es');
    expect(payload.suggestions).toEqual([]);
    expect(payload.suggestionsPersonalized).toBe(false);
    expect(payload.tccLite.active).toBe(false);
  });
});
