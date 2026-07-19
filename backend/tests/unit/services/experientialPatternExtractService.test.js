import {
  sanitizeExtractedCandidates,
  buildTranscriptSnapshotFromMessages,
  resolveMessagesForExperientialExtractJob,
} from '../../../services/experientialPatternExtractService.js';

describe('experientialPatternExtractService', () => {
  it('acepta candidatos de alta confianza', () => {
    const out = sanitizeExtractedCandidates(
      {
        patterns: [
          {
            statement: 'las mañanas eran las más difíciles',
            category: 'time_of_day',
            confidence: 0.9,
          },
        ],
      },
      'es',
    );
    expect(out).toHaveLength(1);
    expect(out[0].category).toBe('time_of_day');
  });

  it('rechaza confidence baja', () => {
    const out = sanitizeExtractedCandidates({
      patterns: [{ statement: 'algo leve', category: 'other', confidence: 0.4 }],
    });
    expect(out).toHaveLength(0);
  });

  it('rechaza contenido clínico', () => {
    const out = sanitizeExtractedCandidates({
      patterns: [
        {
          statement: 'quiero suicidarme mañana',
          category: 'emotion',
          confidence: 0.99,
        },
      ],
    });
    expect(out).toHaveLength(0);
  });

  it('tolera array vacío o parse inválido', () => {
    expect(sanitizeExtractedCandidates(null)).toEqual([]);
    expect(sanitizeExtractedCandidates({ patterns: [] })).toEqual([]);
  });

  it('limita a 2 patrones', () => {
    const out = sanitizeExtractedCandidates({
      patterns: [
        { statement: 'las mañanas eran difíciles', category: 'time_of_day', confidence: 0.9 },
        { statement: 'me cuesta poner límites en casa', category: 'relationship', confidence: 0.85 },
        { statement: 'tercero no debería entrar', category: 'other', confidence: 0.95 },
      ],
    });
    expect(out).toHaveLength(2);
  });

  it('buildTranscriptSnapshotFromMessages normaliza y trunca', () => {
    const snap = buildTranscriptSnapshotFromMessages([
      { role: 'user', content: 'hola mañanas', createdAt: new Date('2026-01-01') },
      { role: 'assistant', content: 'cuéntame más', metadata: { riskLevel: 'LOW' } },
      { role: 'tool', content: 'ignorar' },
    ]);
    expect(snap).toHaveLength(2);
    expect(snap[0].role).toBe('user');
    expect(snap[1].metadata).toEqual({ riskLevel: 'LOW' });
  });

  it('resolveMessagesForExperientialExtractJob prioriza snapshot sobre live', () => {
    const job = {
      transcriptSnapshot: [
        { role: 'user', content: 'desde snapshot sobre mañanas difíciles' },
        { role: 'assistant', content: 'ok' },
      ],
    };
    const liveNewestFirst = [
      { role: 'user', content: 'live' },
    ];
    const msgs = resolveMessagesForExperientialExtractJob(job, liveNewestFirst);
    expect(msgs[0].content).toMatch(/snapshot/);
    expect(msgs).toHaveLength(2);
  });

  it('resolveMessagesForExperientialExtractJob usa live si no hay snapshot', () => {
    const liveNewestFirst = [
      { role: 'assistant', content: 'b' },
      { role: 'user', content: 'a' },
    ];
    const msgs = resolveMessagesForExperientialExtractJob({}, liveNewestFirst);
    expect(msgs.map((m) => m.content)).toEqual(['a', 'b']);
  });
});
