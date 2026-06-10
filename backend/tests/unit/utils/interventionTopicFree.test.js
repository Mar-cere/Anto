/**
 * Tests — buildTopicFreeFromUserContent (#127 fase 2)
 */
import { buildTopicFreeFromUserContent } from '../../../utils/interventionTopicFree.js';

describe('buildTopicFreeFromUserContent', () => {
  it('devuelve null si el texto es demasiado corto', () => {
    expect(buildTopicFreeFromUserContent('hola')).toBeNull();
    expect(buildTopicFreeFromUserContent('   ')).toBeNull();
    expect(buildTopicFreeFromUserContent(null)).toBeNull();
  });

  it('normaliza espacios y conserva el mensaje', () => {
    const msg = 'Me siento muy ansioso por una reunión con mi jefe mañana';
    expect(buildTopicFreeFromUserContent(msg)).toBe(msg);
    expect(buildTopicFreeFromUserContent('  Me   siento   ansioso  ')).toBe('Me siento ansioso');
  });

  it('trunca mensajes largos en límite de palabra', () => {
    const long =
      'Estoy agotado del trabajo y no tengo ganas de nada, cada día es más difícil levantarme y enfrentar las reuniones con mi equipo porque siento que no valgo lo suficiente para el puesto';
    const out = buildTopicFreeFromUserContent(long, { maxLength: 80 });
    expect(out.length).toBeLessThanOrEqual(81);
    expect(out.endsWith('…')).toBe(true);
  });

  it('elimina caracteres de control', () => {
    expect(
      buildTopicFreeFromUserContent('Me siento\n\nansioso\tpor\tmañana'),
    ).toBe('Me siento ansioso por mañana');
  });
});
