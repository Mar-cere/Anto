import { describe, expect, it } from '@jest/globals';
import {
  evaluateSuicideRisk,
  hasExplicitSuicidalOrSelfHarmLexicon,
  shouldAttachCrisisContextToPrompt,
  shouldSkipEmergencyPhoneNumbersInSafetyAppend,
  shouldUseCompactCrisisSafetyAppend
} from '../../../constants/crisis.js';

describe('shouldAttachCrisisContextToPrompt', () => {
  it('solo MEDIUM y HIGH inyectan prompt de crisis completo', () => {
    expect(shouldAttachCrisisContextToPrompt('HIGH')).toBe(true);
    expect(shouldAttachCrisisContextToPrompt('MEDIUM')).toBe(true);
    expect(shouldAttachCrisisContextToPrompt('WARNING')).toBe(false);
    expect(shouldAttachCrisisContextToPrompt('LOW')).toBe(false);
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
