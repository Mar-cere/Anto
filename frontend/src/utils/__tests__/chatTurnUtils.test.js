import { countNonemptyUserTurns } from '../chatTurnUtils';

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
});
