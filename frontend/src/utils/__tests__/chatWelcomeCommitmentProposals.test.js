import {
  finalizeLoadedChatMessages,
  reconstructPersistedCommitmentProposals,
} from '../chatWelcomeGreeting';

describe('reconstructPersistedCommitmentProposals', () => {
  it('reconstruye tarjeta desde metadata del último asistente', () => {
    const messages = [
      { _id: 'a1', role: 'assistant', content: 'ok' },
      {
        _id: 'a2',
        role: 'assistant',
        content: 'quedamos en retomar',
        metadata: {
          proposedCommitments: [{ id: 'p1', label: 'Retomar respiración' }],
        },
      },
    ];
    const out = reconstructPersistedCommitmentProposals(messages);
    expect(out).toHaveLength(3);
    expect(out[2].type).toBe('commitment_proposals');
    expect(out[2].proposedCommitments[0].label).toBe('Retomar respiración');
    expect(out[2].metadata.assistantMessageId).toBe('a2');
  });

  it('no duplica si ya hay commitment_proposals en vivo', () => {
    const messages = [
      { type: 'commitment_proposals', proposedCommitments: [{ id: 'x', label: 'Ya' }] },
      {
        _id: 'a2',
        metadata: { proposedCommitments: [{ id: 'p1', label: 'Otro' }] },
      },
    ];
    expect(reconstructPersistedCommitmentProposals(messages)).toHaveLength(2);
  });

  it('finalizeLoadedChatMessages encadena sugerencias y compromisos', () => {
    const messages = [
      {
        _id: 'a1',
        role: 'assistant',
        metadata: {
          suggestions: [{ id: 'breathing_exercise', screen: 'BreathingExercise' }],
          proposedCommitments: [{ id: 'c1', label: 'Retomar' }],
        },
      },
    ];
    const out = finalizeLoadedChatMessages(messages, 'es');
    expect(out.some((m) => m.type === 'suggestions')).toBe(true);
    expect(out.some((m) => m.type === 'commitment_proposals')).toBe(true);
  });
});
