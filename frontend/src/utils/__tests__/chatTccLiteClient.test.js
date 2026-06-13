import {
  resolveTccLiteAtHandoffFromPayload,
  shouldClearTccLiteHandoff,
} from '../chatTccLiteClient';

describe('chatTccLiteClient', () => {
  const handoff = { screen: 'AutomaticThoughtRecord', params: { fromTccLite: true } };

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
