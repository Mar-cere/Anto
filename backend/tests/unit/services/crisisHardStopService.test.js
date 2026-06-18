import { jest } from '@jest/globals';

const {
  shouldHardStopCrisisLlm,
  buildHardStopCrisisAssistantContent,
  buildCrisisHardStopClientPayload,
} = await import('../../../services/crisisHardStopService.js');

describe('crisisHardStopService', () => {
  it('hard-stop con léxico explícito en WARNING, MEDIUM o HIGH', () => {
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
        riskLevel: 'WARNING',
        messageContent: 'a veces quiero morir',
      }),
    ).toBe(true);
    expect(
      shouldHardStopCrisisLlm({
        enabled: true,
        riskLevel: 'MEDIUM',
        messageContent: 'quiero morir',
      }),
    ).toBe(true);
    expect(
      shouldHardStopCrisisLlm({
        enabled: true,
        riskLevel: 'LOW',
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

  it('buildHardStopCrisisAssistantContent es legible y sin plan de seguridad engañoso', () => {
    const out = buildHardStopCrisisAssistantContent({ riskLevel: 'HIGH', country: 'GENERAL' });
    expect(out).toMatch(/seguridad/i);
    expect(out).not.toMatch(/decírmelo|podés|querés/i);
    expect(out).toMatch(/¿Te sientes a salvo/i);
    expect(out).toMatch(/112|España|emergencias/i);
    expect(out).toMatch(/no puedo llamar/i);
    expect(out).not.toMatch(/plan de seguridad/i);
    expect(out.split('\n\n').length).toBeGreaterThanOrEqual(4);
    expect(out.length).toBeGreaterThan(120);
  });

  it('buildHardStopCrisisAssistantContent usa regionCountry del dispositivo', () => {
    const out = buildHardStopCrisisAssistantContent({
      riskLevel: 'HIGH',
      preferences: { regionCountry: 'CL' },
      language: 'es',
    });
    expect(out).toContain('133');
    expect(out).toContain('600 360 7777');
  });

  it('buildHardStopCrisisAssistantContent usa líneas de España', () => {
    const out = buildHardStopCrisisAssistantContent({
      riskLevel: 'HIGH',
      country: 'ESPANA',
      language: 'es',
    });
    expect(out).toContain('112');
    expect(out).toContain('024');
  });

  it('buildHardStopCrisisAssistantContent respeta idioma en apertura', () => {
    const en = buildHardStopCrisisAssistantContent({ riskLevel: 'HIGH', language: 'en' });
    expect(en).toMatch(/your safety/i);
    expect(en).toContain('Do you feel safe');
    const es = buildHardStopCrisisAssistantContent({ riskLevel: 'HIGH', language: 'es' });
    expect(es).toContain('seguridad');
  });

  it('resuelve país por alias ISO en preferencias', () => {
    expect(buildHardStopCrisisAssistantContent({
      riskLevel: 'HIGH',
      country: 'ES',
      language: 'es',
    })).toContain('112');
  });

  it('buildCrisisHardStopClientPayload no expone sugerencias ni TCC', () => {
    const payload = buildCrisisHardStopClientPayload('es');
    expect(payload.suggestions).toEqual([]);
    expect(payload.suggestionsPersonalized).toBe(false);
    expect(payload.tccLite.active).toBe(false);
  });
});
