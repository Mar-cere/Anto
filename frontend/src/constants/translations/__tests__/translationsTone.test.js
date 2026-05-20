/**
 * Tono neutro (ES) y naturalidad básica (EN) en traducciones de producto.
 */
import en from '../en';
import es from '../es';

function flattenStrings(source, prefix = '', output = []) {
  Object.keys(source || {}).forEach((key) => {
    const value = source[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (value != null && typeof value === 'object' && !Array.isArray(value)) {
      flattenStrings(value, path, output);
      return;
    }
    if (typeof value === 'string') {
      output.push({ path, value });
    }
  });
  return output;
}

/** Solo formas con marca de voseo (acento en la vocal final), no imperativos neutros "mira/deja". */
const ES_VOSEO =
  /\b(podés|querés|tenés|sabés|andá|dejá|contame|seguí|abrí|mirá|vení|decí|sentí|recordá)\b/i;

const EN_AWKWARD = [
  { re: /\bToday streak\b/, label: 'use "Today\'s streak"' },
  { re: /task tracked time/i, label: 'awkward phrasing' },
  { re: /\bshall we\b/i, label: 'overly formal' },
  { re: /\byou are arriving\b/i, label: 'unnatural phrasing' },
  { re: /\brecover password\b/i, label: 'prefer "reset password"' },
  { re: /the other person feelings/i, label: 'grammar: other person\'s feelings' },
  { re: /^Error (loading|sending|creating|updating|deleting|fetching)/i, label: 'prefer "Could not …"' },
];

const SPANISH_CHARS = /[áéíóúñÁÉÍÓÚÑ]/;

describe('translations tone', () => {
  const esStrings = flattenStrings(es);
  const enStrings = flattenStrings(en);

  it('es: sin voseo en cadenas de producto', () => {
    const hits = esStrings.filter(({ value }) => ES_VOSEO.test(value));
    expect(hits).toEqual([]);
  });

  it('es: confirmaciones con "de que" (no "que deseas")', () => {
    const hits = esStrings.filter(({ value }) =>
      /¿Estás seguro que deseas/i.test(value),
    );
    expect(hits).toEqual([]);
  });

  it('en: sin frases marcadas como poco naturales', () => {
    const hits = [];
    for (const { path, value } of enStrings) {
      for (const { re, label } of EN_AWKWARD) {
        if (re.test(value)) hits.push({ path, label, sample: value.slice(0, 80) });
      }
    }
    expect(hits).toEqual([]);
  });

  it('en: sin español residual (excepto claves _ES para preload)', () => {
    const hits = enStrings.filter(
      ({ path, value }) =>
        !/_ES$|_ES_/.test(path) && SPANISH_CHARS.test(value),
    );
    expect(hits).toEqual([]);
  });
});
