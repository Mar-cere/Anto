import {
  buildAssistantMetadataFromTurnPayload,
  resolveTccLiteAtHandoffFromPayload,
  shouldClearTccLiteHandoff,
} from '../chatTccLiteClient';

describe('chatTccLiteClient', () => {
  const handoff = { screen: 'AutomaticThoughtRecord', params: { fromTccLite: true } };

  it('buildAssistantMetadataFromTurnPayload adjunta tccLite activo al metadata', () => {
    const meta = buildAssistantMetadataFromTurnPayload(
      {
        tccLite: {
          active: true,
          step: 'check_evidence',
          stepIndex: 1,
          stepTotal: 4,
          stepShort: 'Revisar hechos',
          kicker: 'Explorando tu pensamiento',
          distortionLabel: 'Catastrofización',
        },
      },
      { timestamp: '2026-06-01T00:00:00.000Z' },
    );
    expect(meta.timestamp).toBe('2026-06-01T00:00:00.000Z');
    expect(meta.tccLite.step).toBe('check_evidence');
    expect(meta.tccLite.frameLabel).toBe('Explorando tu pensamiento');
    expect(meta.tccLite.distortionLabel).toBe('Catastrofización');
  });

  it('buildAssistantMetadataFromTurnPayload no añade tccLite si el marco está inactivo', () => {
    const meta = buildAssistantMetadataFromTurnPayload({
      tccLite: { active: false, completed: false },
    });
    expect(meta.tccLite).toBeUndefined();
  });

  it('expone handoff solo cuando el marco está completado e inactivo', () => {
    expect(
      resolveTccLiteAtHandoffFromPayload({
        tccLite: { active: false, completed: true, atHandoff: handoff },
      }),
    ).toEqual(handoff);
  });

  it('no expone handoff mientras wrap_up sigue activo', () => {
    expect(
      resolveTccLiteAtHandoffFromPayload({
        tccLite: { active: true, completed: false, step: 'wrap_up', atHandoff: handoff },
      }),
    ).toBeNull();
  });

  it('no expone handoff sin flag completed', () => {
    expect(
      resolveTccLiteAtHandoffFromPayload({
        tccLite: { active: false, completed: false, atHandoff: handoff },
      }),
    ).toBeNull();
  });

  it('shouldClearTccLiteHandoff cuando reinicia marco activo', () => {
    expect(shouldClearTccLiteHandoff({ tccLite: { active: true } })).toBe(true);
    expect(shouldClearTccLiteHandoff({ tccLite: { active: false, completed: true } })).toBe(false);
  });
});
