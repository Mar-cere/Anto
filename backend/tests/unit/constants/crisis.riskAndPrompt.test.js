import { describe, expect, it } from '@jest/globals';
import {
  buildCrisisActionDecision,
  buildOpenaiCrisisContext,
  evaluateSuicideRisk,
  generateCrisisSystemPrompt,
  generateCrisisMediumResponseConstraints,
  generateCrisisWarningContextMessage,
  getStructuredCrisisProtocolCopy,
  hasStructuredCrisisProtocolElement,
  buildCrisisSafetyAppendText,
  getCrisisWarningPromptHeader,
  hasExplicitSuicidalOrSelfHarmLexicon,
  normalizeStoredCrisisRiskLevel,
  shouldAttachCrisisContextToPrompt,
  shouldAttachCrisisWarningContextToPrompt,
  shouldIncludeCrisisInOpenaiContext,
  shouldSkipEmergencyPhoneNumbersInSafetyAppend,
  shouldUseCompactCrisisSafetyAppend,
} from '../../../constants/crisis.js';

describe('normalizeStoredCrisisRiskLevel', () => {
  it('acepta variantes y rechaza valores raros', () => {
    expect(normalizeStoredCrisisRiskLevel('high')).toBe('HIGH');
    expect(normalizeStoredCrisisRiskLevel('  WARNING  ')).toBe('WARNING');
    expect(normalizeStoredCrisisRiskLevel('not-a-level')).toBe('LOW');
    expect(normalizeStoredCrisisRiskLevel(null)).toBe('LOW');
  });
});

describe('shouldAttachCrisisContextToPrompt', () => {
  it('solo MEDIUM y HIGH inyectan prompt de crisis completo', () => {
    expect(shouldAttachCrisisContextToPrompt('HIGH')).toBe(true);
    expect(shouldAttachCrisisContextToPrompt('MEDIUM')).toBe(true);
    expect(shouldAttachCrisisContextToPrompt('WARNING')).toBe(false);
    expect(shouldAttachCrisisContextToPrompt('LOW')).toBe(false);
  });
});

describe('shouldIncludeCrisisInOpenaiContext', () => {
  it('incluye WARNING aunque no haya prompt completo MEDIUM/HIGH', () => {
    expect(shouldIncludeCrisisInOpenaiContext('WARNING', { isCrisis: false })).toBe(true);
    expect(shouldIncludeCrisisInOpenaiContext('LOW', { isCrisis: false })).toBe(false);
    expect(
      shouldIncludeCrisisInOpenaiContext('LOW', { userMessage: 'quiero morir' }),
    ).toBe(true);
  });

  it('buildOpenaiCrisisContext devuelve objeto en WARNING', () => {
    const ctx = buildOpenaiCrisisContext({
      riskLevel: 'WARNING',
      userMessage: 'no aguanto más',
      country: 'GENERAL',
    });
    expect(ctx?.riskLevel).toBe('WARNING');
  });
});

describe('shouldAttachCrisisWarningContextToPrompt', () => {
  it('activa en WARNING con malestar alto sin léxico explícito', () => {
    expect(
      shouldAttachCrisisWarningContextToPrompt('WARNING', {
        emotional: { intensity: 8 },
        contextual: { intencion: { tipo: 'CRISIS' } },
        userMessage: 'no aguanto más',
      }),
    ).toBe(true);
    expect(
      shouldAttachCrisisWarningContextToPrompt('WARNING', {
        emotional: { intensity: 4 },
        contextual: {},
        userMessage: 'estoy cansado',
      }),
    ).toBe(false);
    expect(
      shouldAttachCrisisWarningContextToPrompt('WARNING', {
        emotional: { intensity: 8 },
        contextual: {},
        userMessage: 'quiero morir',
      }),
    ).toBe(false);
  });

  it('generateCrisisWarningContextMessage no menciona plan de seguridad', () => {
    const msg = generateCrisisWarningContextMessage('GENERAL');
    expect(msg).toContain('¿Te sientes a salvo');
    expect(msg).not.toMatch(/plan de seguridad/i);
  });

  it('generateCrisisWarningContextMessage respeta idioma EN', () => {
    const msg = generateCrisisWarningContextMessage('GENERAL', 'en');
    expect(msg).toMatch(/Are you safe right now/i);
    expect(msg).not.toMatch(/¿Te sientes a salvo/);
    expect(getCrisisWarningPromptHeader('en')).toMatch(/ELEVATED DISTRESS/);
  });
});

describe('generateCrisisMediumResponseConstraints', () => {
  it('define formato obligatorio y prohibiciones para MEDIUM', () => {
    const constraints = generateCrisisMediumResponseConstraints('es');
    expect(constraints).toMatch(/FORMATO DE RESPUESTA OBLIGATORIO \(MEDIUM\)/);
    expect(constraints).toMatch(/¿Te sientes a salvo en este momento\?/);
    expect(constraints).toMatch(/PROHIBIDO/);
    expect(constraints).toMatch(/plan de seguridad co-creado/i);
  });

  it('generateCrisisSystemPrompt anexa constraints solo en MEDIUM', () => {
    const medium = generateCrisisSystemPrompt('MEDIUM', 'GENERAL');
    const high = generateCrisisSystemPrompt('HIGH', 'GENERAL');
    expect(medium).toMatch(/FORMATO DE RESPUESTA OBLIGATORIO \(MEDIUM\)/);
    expect(high).not.toMatch(/FORMATO DE RESPUESTA OBLIGATORIO \(MEDIUM\)/);
  });

  it('generateCrisisSystemPrompt MEDIUM respeta idioma EN', () => {
    const mediumEn = generateCrisisSystemPrompt('MEDIUM', 'GENERAL', 'en');
    expect(mediumEn).toMatch(/MANDATORY RESPONSE FORMAT \(MEDIUM\)/);
    expect(mediumEn).not.toMatch(/FORMATO DE RESPUESTA OBLIGATORIO/);
  });
});

describe('getStructuredCrisisProtocolCopy', () => {
  it('devuelve copy en español e inglés', () => {
    expect(getStructuredCrisisProtocolCopy('es').safetyQuestion).toMatch(/¿Estás a salvo/);
    expect(getStructuredCrisisProtocolCopy('en').safetyQuestion).toMatch(/Are you safe/i);
  });

  it('hasStructuredCrisisProtocolElement detecta en ambos idiomas', () => {
    expect(hasStructuredCrisisProtocolElement('Are you safe right now?', 'safety')).toBe(true);
    expect(hasStructuredCrisisProtocolElement('¿Estás a salvo en este momento?', 'safety')).toBe(
      true,
    );
    expect(hasStructuredCrisisProtocolElement('Cuéntame más', 'safety')).toBe(false);
  });

  it('buildCrisisSafetyAppendText genera bloque en inglés', () => {
    const text = buildCrisisSafetyAppendText({
      language: 'en',
      intensity: 8,
      compact: false,
      skipHeavyPhones: true,
      emergencyLines: '',
    });
    expect(text).toMatch(/About this chat/i);
    expect(text).toMatch(/Are you safe right now/i);
    expect(text).not.toMatch(/¿Estás a salvo/);
  });
});

describe('shouldSkipEmergencyPhoneNumbersInSafetyAppend', () => {
  it('detecta conflicto de pareja sin léxico de autolesión', () => {
    const msg =
      'hace varios días estoy confusa con mi ex, intentamos volver pero hay peleas y me enojo mucho';
    expect(shouldSkipEmergencyPhoneNumbersInSafetyAppend(msg)).toBe(true);
  });

  it('no omite si hay ideación explícita', () => {
    expect(shouldSkipEmergencyPhoneNumbersInSafetyAppend('quiero morir, peleas con mi ex')).toBe(
      false
    );
  });
});

describe('hasExplicitSuicidalOrSelfHarmLexicon', () => {
  it('detecta autolesión en español', () => {
    expect(hasExplicitSuicidalOrSelfHarmLexicon('A veces me autolesiono cuando tengo ansiedad')).toBe(true);
  });
});

describe('shouldUseCompactCrisisSafetyAppend', () => {
  const historyNewestFirst = [
    { role: 'user', content: 'Estoy bien solo tengo un poco de ansiedad', createdAt: new Date() },
    { role: 'assistant', content: 'Ok', createdAt: new Date() }
  ];

  it('activa modo compacto tras calma y mensaje de patrón histórico con autolesión', () => {
    const cur =
      'Mira, a veces desde hace mucho tiempo me autolesiono cuando siento mucha ansiedad; ahora no tan mal';
    expect(shouldUseCompactCrisisSafetyAppend(cur, historyNewestFirst)).toBe(true);
  });

  it('no activa si el usuario expresa inmediatez', () => {
    const cur = 'A veces me autolesiono pero ahora mismo voy a hacerlo';
    expect(shouldUseCompactCrisisSafetyAppend(cur, historyNewestFirst)).toBe(false);
  });
});

describe('evaluateSuicideRisk — peso de intención CRISIS en conflicto interpersonal', () => {
  const baseEmotional = { mainEmotion: 'tristeza', intensity: 7 };
  const crisisIntentHigh = {
    intencion: { tipo: 'CRISIS', confianza: 0.92 }
  };

  it('reduce puntaje cuando el texto es típico de pareja/ex sin autolesión', () => {
    const interpersonal =
      'La verdad es que con mi ex estamos intentando volver pero hay peleas todos los días y me enojo';
    const scoreInterpersonal = evaluateSuicideRisk(
      baseEmotional,
      crisisIntentHigh,
      interpersonal,
      { trendAnalysis: null, crisisHistory: null, conversationContext: {} }
    );

    const explicit =
      'Ya no quiero vivir, pienso en suicidarme cada noche por lo de mi ex';
    const scoreExplicit = evaluateSuicideRisk(
      baseEmotional,
      crisisIntentHigh,
      explicit,
      { trendAnalysis: null, crisisHistory: null, conversationContext: {} }
    );

    const order = { LOW: 0, WARNING: 1, MEDIUM: 2, HIGH: 3 };
    expect(order[scoreExplicit]).toBeGreaterThanOrEqual(order[scoreInterpersonal]);
  });
});

describe('buildCrisisActionDecision', () => {
  it('mantiene VERIFY en HIGH cuando no hay evidencia suficiente para alertar contactos', () => {
    const decision = buildCrisisActionDecision({
      riskLevel: 'HIGH',
      messageContent: 'me siento mal y triste, no se que hacer',
      contextualAnalysis: { intencion: { tipo: 'CRISIS', confianza: 0.82 } },
      trendAnalysis: { trends: { rapidDecline: false, escalation: false, sustainedLow: false } },
      crisisHistory: { recentCrises: 0 },
      conversationContext: { helpRejected: false, silenceAfterNegative: false, abruptToneChange: false }
    });

    expect(decision.actionLevel).toBe('VERIFY');
    expect(decision.shouldAlertContacts).toBe(false);
  });

  it('escala a ALERT_CONTACTS en HIGH con planificacion y deterioro', () => {
    const decision = buildCrisisActionDecision({
      riskLevel: 'HIGH',
      messageContent:
        'ya se como hacerlo, tengo un plan y me quiero despedir, esta sera la ultima vez',
      contextualAnalysis: { intencion: { tipo: 'CRISIS', confianza: 0.96 } },
      trendAnalysis: { trends: { rapidDecline: true, escalation: true, sustainedLow: true } },
      crisisHistory: { recentCrises: 1 },
      conversationContext: { helpRejected: true, silenceAfterNegative: true, abruptToneChange: false }
    });

    expect(decision.actionLevel).toBe('ALERT_CONTACTS');
    expect(decision.shouldAlertContacts).toBe(true);
    expect(decision.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('en MEDIUM ambiguo mantiene VERIFY sin alertar contactos', () => {
    const decision = buildCrisisActionDecision({
      riskLevel: 'MEDIUM',
      messageContent: 'estoy solo y preocupado desde hace dias',
      contextualAnalysis: { intencion: { tipo: 'CRISIS', confianza: 0.84 } },
      trendAnalysis: { trends: { rapidDecline: false, escalation: false, sustainedLow: true } },
      crisisHistory: { recentCrises: 0 },
      conversationContext: { helpRejected: false, silenceAfterNegative: false, abruptToneChange: false }
    });

    expect(decision.actionLevel).toBe('VERIFY');
    expect(decision.shouldAlertContacts).toBe(false);
  });

  it('para WARNING usa SUPPORT_USER', () => {
    const decision = buildCrisisActionDecision({
      riskLevel: 'WARNING',
      messageContent: 'me siento algo aislado, pero quiero hablar',
      contextualAnalysis: { intencion: { tipo: 'CRISIS', confianza: 0.8 } },
      trendAnalysis: { trends: { rapidDecline: false, escalation: false, sustainedLow: false } },
      crisisHistory: { recentCrises: 0 },
      conversationContext: { helpRejected: false, silenceAfterNegative: false, abruptToneChange: false }
    });

    expect(decision.actionLevel).toBe('SUPPORT_USER');
    expect(decision.shouldAlertContacts).toBe(false);
  });
});
