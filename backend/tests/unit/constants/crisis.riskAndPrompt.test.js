import { describe, expect, it } from '@jest/globals';
import {
  evaluateSuicideRisk,
  shouldAttachCrisisContextToPrompt,
  shouldSkipEmergencyPhoneNumbersInSafetyAppend
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
