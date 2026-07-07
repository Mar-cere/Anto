import { countNonemptyUserTurns, hasNonemptyUserTurns } from '../chatTurnUtils';

describe('chatTurnUtils', () => {
  it('countNonemptyUserTurns ignora mensajes vacíos y del asistente', () => {
    expect(
      countNonemptyUserTurns([
        { role: 'user', content: 'hola' },
        { role: 'user', content: '   ' },
        { role: 'assistant', content: 'respuesta' },
        { role: 'user', content: 'otro' },
      ]),
    ).toBe(2);
  });

  it('hasNonemptyUserTurns exige contenido y excluye quickReplies', () => {
    expect(
      hasNonemptyUserTurns([
        { role: 'assistant', content: 'hola' },
        { role: 'user', content: '   ' },
        { role: 'user', type: 'quickReplies', content: 'Sí' },
      ]),
    ).toBe(false);
    expect(hasNonemptyUserTurns([{ role: 'user', content: 'hola' }])).toBe(true);
  });
});
