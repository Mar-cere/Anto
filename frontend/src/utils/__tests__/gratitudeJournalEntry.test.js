/**
 * Tests unitarios para helpers del diario de gratitud.
 */

/* global describe, expect, it */

import {
  getGratitudeEntryDisplayText,
  getGratitudeEntryPreviewLine,
  sanitizeGratitudeEntriesFromStorage,
} from '../gratitudeJournalEntry';

describe('gratitudeJournalEntry', () => {
  describe('getGratitudeEntryDisplayText', () => {
    it('debe retornar cadena vacía si no hay entrada', () => {
      expect(getGratitudeEntryDisplayText(null)).toBe('');
      expect(getGratitudeEntryDisplayText(undefined)).toBe('');
    });

    it('debe usar texto legado cuando no hay lines', () => {
      expect(getGratitudeEntryDisplayText({ text: 'Solo texto' })).toBe('Solo texto');
    });

    it('debe formatear lines no vacías con numeración', () => {
      expect(
        getGratitudeEntryDisplayText({
          lines: ['uno', 'dos', 'tres'],
          text: 'ignorado si hay lines',
        })
      ).toBe('1) uno\n2) dos\n3) tres');
    });

    it('debe omitir líneas vacías y renumerar', () => {
      expect(
        getGratitudeEntryDisplayText({
          lines: ['  a  ', '', '  c  '],
        })
      ).toBe('1) a\n2) c');
    });

    it('debe volver a text si lines queda vacío tras trim', () => {
      expect(
        getGratitudeEntryDisplayText({
          lines: ['', '  ', null],
          text: 'Respaldo',
        })
      ).toBe('Respaldo');
    });

    it('debe retornar cadena vacía si lines vacío y sin text', () => {
      expect(getGratitudeEntryDisplayText({ lines: ['', ''] })).toBe('');
    });
  });

  describe('sanitizeGratitudeEntriesFromStorage', () => {
    it('debe retornar array vacío si no es array', () => {
      expect(sanitizeGratitudeEntriesFromStorage(null)).toEqual([]);
      expect(sanitizeGratitudeEntriesFromStorage({})).toEqual([]);
    });

    it('debe conservar entradas válidas y descartar inválidas', () => {
      const raw = [
        { id: 1, date: '2026-05-05T12:00:00.000Z', text: 'ok' },
        { id: 2, date: '2026-05-05T12:00:00.000Z', lines: ['a'] },
        null,
        { id: 3 },
        { id: 'x', date: '2026-05-05T12:00:00.000Z', lines: [] },
      ];
      const out = sanitizeGratitudeEntriesFromStorage(raw);
      expect(out).toHaveLength(3);
      expect(out[0].id).toBe(1);
      expect(out[1].id).toBe(2);
      expect(out[2].id).toBe('x');
    });
  });

  describe('getGratitudeEntryPreviewLine', () => {
    it('debe unir saltos de línea con separador', () => {
      expect(
        getGratitudeEntryPreviewLine({
          lines: ['x', 'y'],
        })
      ).toBe('1) x · 2) y');
    });

    it('debe truncar con elipsis cuando supera maxLen', () => {
      const long = 'a'.repeat(50);
      const entry = { lines: [long, 'b'] };
      const preview = getGratitudeEntryPreviewLine(entry, 30);
      expect(preview.length).toBe(30);
      expect(preview.endsWith('…')).toBe(true);
    });
  });
});
