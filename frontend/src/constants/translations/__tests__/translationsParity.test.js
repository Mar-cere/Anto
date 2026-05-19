import en from '../en';
import es from '../es';

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function flattenLeaves(source, prefix = '', output = {}) {
  Object.keys(source || {}).forEach((key) => {
    const value = source[key];
    const nextPath = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(value)) {
      flattenLeaves(value, nextPath, output);
      return;
    }
    output[nextPath] = value;
  });
  return output;
}

describe('translations parity', () => {
  const flatEs = flattenLeaves(es);
  const flatEn = flattenLeaves(en);

  it('es and en have the same translation keys', () => {
    const esKeys = Object.keys(flatEs).sort();
    const enKeys = Object.keys(flatEn).sort();
    expect(enKeys).toEqual(esKeys);
  });

  it('translations do not contain empty string values', () => {
    const allEntries = [...Object.entries(flatEs), ...Object.entries(flatEn)];
    const emptyEntries = allEntries.filter(([, value]) => typeof value === 'string' && value.trim() === '');
    expect(emptyEntries).toEqual([]);
  });
});
