import {
  buildEarlyConversationRetentionSnippet,
  isEarlyConversation,
  isHighSymptomDisclosure,
  isProductCapabilityQuestion,
  mentionsExistingProfessionalCare,
  resolveUserTurnIndex,
} from '../../../../services/chat/earlyConversationRetentionSnippet.js';
import {
  applyEmotionalThreadContinuity,
  collectRecentUserTexts,
} from '../../../../services/chat/emotionalThreadContinuity.js';

describe('earlyConversationRetentionSnippet', () => {
  it('detecta pregunta de capacidad de producto', () => {
    expect(
      isProductCapabilityQuestion(
        'Puede ser para ansiedad, estrés, angustia y apoyo emocional?',
      ),
    ).toBe(true);
    expect(isProductCapabilityQuestion('Tengo ataques de ansiedad')).toBe(false);
  });

  it('detecta síntoma fuerte y cuidado profesional', () => {
    expect(isHighSymptomDisclosure('Tengo ataques de ansiedad y angustia regularmente')).toBe(
      true,
    );
    expect(mentionsExistingProfessionalCare('Si tengo apoyo psicológico y medicamentos')).toBe(
      true,
    );
  });

  it('marca early con historial newest-first que ya incluye el mensaje', () => {
    const history = [
      { role: 'user', content: 'Puede ser para ansiedad?' },
      { role: 'assistant', content: 'Hola' },
    ];
    expect(resolveUserTurnIndex(history, 'Puede ser para ansiedad?')).toBe(1);
    expect(isEarlyConversation(history, 'Puede ser para ansiedad?')).toBe(true);
  });

  it('inyecta anclas ES para pregunta de producto', () => {
    const snip = buildEarlyConversationRetentionSnippet('es', {
      userMessage: 'Puede ser para ansiedad, estrés, angustia y apoyo emocional?',
      safetyHistory: [{ role: 'assistant', content: '¿Por dónde empezamos?' }],
    });
    expect(snip).toContain('### Retención en conversación temprana');
    expect(snip).toContain('Pregunta de capacidad');
    expect(snip).toContain('Sin catálogo de features');
  });

  it('inyecta oferta suave ante ataques regulares', () => {
    const snip = buildEarlyConversationRetentionSnippet('es', {
      userMessage: 'Tengo ataques de ansiedad y angustia regularmente',
      history: [
        { role: 'user', content: 'Puede ser para ansiedad?' },
        { role: 'assistant', content: 'Sí' },
      ],
    });
    expect(snip).toContain('Síntoma fuerte');
    expect(snip).toContain('como máximo una');
  });

  it('inyecta rol entre sesiones con terapia/meds', () => {
    const snip = buildEarlyConversationRetentionSnippet('es', {
      userMessage: 'Si tengo apoyo psicológico y medicamentos',
      history: [
        { role: 'user', content: 'Tengo ataques regularmente' },
        { role: 'assistant', content: '¿Qué suele pasar antes?' },
      ],
    });
    expect(snip).toContain('entre sesiones');
    expect(snip).toContain('aconsejes sobre su profesional');
    expect(snip).toContain('no** compitas');
  });
});

describe('emotionalThreadContinuity', () => {
  it('recoge textos recientes en historial newest-first', () => {
    const texts = collectRecentUserTexts(
      [
        { role: 'user', content: 'apoyo reciente' },
        { role: 'assistant', content: 'ok' },
        { role: 'user', content: 'Tengo ataques de ansiedad regularmente' },
      ],
      'apoyo reciente',
      { newestFirst: true },
    );
    expect(texts).toContain('Tengo ataques de ansiedad regularmente');
    expect(texts[texts.length - 1]).toBe('apoyo reciente');
  });

  it('sube ansiedad/intensidad si el hilo habla de ataques', () => {
    const out = applyEmotionalThreadContinuity(
      { mainEmotion: 'neutral', intensity: 4, category: 'neutral' },
      [
        'Tengo ataques de ansiedad y angustia regularmente',
        'Si tengo apoyo psicológico y medicamentos',
      ],
    );
    expect(out.mainEmotion).toBe('ansiedad');
    expect(out.intensity).toBeGreaterThanOrEqual(6);
    expect(out.threadContinuityApplied).toBe(true);
  });

  it('no altera si no hay carga de ansiedad en el hilo', () => {
    const base = { mainEmotion: 'neutral', intensity: 4 };
    expect(applyEmotionalThreadContinuity(base, ['Hola', 'Todo bien'])).toEqual(base);
  });
});
