import {
  copyGroupFromSeed,
  getQuickReplies,
  hashSeed,
} from '../quickReplyChipsHelper';

describe('hashSeed', () => {
  it('es determinista', () => {
    expect(hashSeed('hola')).toBe(hashSeed('hola'));
    expect(hashSeed('hola')).not.toBe(hashSeed('adiós'));
  });
});

describe('copyGroupFromSeed', () => {
  it('alterna A/B según paridad', () => {
    expect(copyGroupFromSeed(0)).toBe('A');
    expect(copyGroupFromSeed(1)).toBe('B');
  });
});

describe('getQuickReplies', () => {
  it('misma semilla + mismos textos => misma salida (determinista)', () => {
    const a = getQuickReplies('Hola.', 'Algo genérico', { rotationSeed: 42 });
    const b = getQuickReplies('Hola.', 'Algo genérico', { rotationSeed: 42 });
    expect(a).toEqual(b);
  });

  it('semilla distinta puede cambiar el set por defecto', () => {
    const a = getQuickReplies('Neutro.', 'Genérico', { rotationSeed: 10 });
    const b = getQuickReplies('Neutro.', 'Genérico', { rotationSeed: 99 });
    const sameLabels = a.every((chip, i) => chip.label === b[i]?.label);
    expect(sameLabels).toBe(false);
  });

  it('respeta copyGroup explícito', () => {
    const ga = getQuickReplies('Neutro.', 'Genérico', { rotationSeed: 100, copyGroup: 'A' });
    const gb = getQuickReplies('Neutro.', 'Genérico', { rotationSeed: 100, copyGroup: 'B' });
    expect(ga[0].text).not.toBe(gb[0].text);
  });

  it('modo compact: 2 chips', () => {
    const r = getQuickReplies('Ok.', 'test', { compact: true, rotationSeed: 5 });
    expect(r).toHaveLength(2);
  });

  it('pregunta: 3 chips', () => {
    const r = getQuickReplies('¿Te parece?', '', { rotationSeed: 3 });
    expect(r).toHaveLength(3);
  });

  it('contexto laboral', () => {
    const r = getQuickReplies('Entiendo.', 'Estoy estresado en el trabajo', {
      rotationSeed: 7,
    });
    expect(r.some((x) => x.id.includes('w'))).toBe(true);
  });

  it('contexto sueño', () => {
    const r = getQuickReplies('.', 'No puedo dormir', { rotationSeed: 2 });
    expect(r.some((x) => x.id.includes('s'))).toBe(true);
  });

  it('sin rotationSeed usa hash del contenido', () => {
    const r1 = getQuickReplies('A', 'B');
    const r2 = getQuickReplies('A', 'B');
    expect(r1).toEqual(r2);
  });
});
