/**
 * Tests — guards de eventos #127
 */
import {
  sanitizeInterventionEventMeta,
  sanitizeInterventionSource,
  sanitizeInterventionTopicFree,
  sanitizeInterventionTopicTag,
} from '../../../utils/interventionEventGuards.js';

describe('interventionEventGuards', () => {
  it('sanitizeInterventionTopicTag normaliza y trunca', () => {
    expect(sanitizeInterventionTopicTag('  Trabajo  ')).toBe('trabajo');
    expect(sanitizeInterventionTopicTag('', 'library')).toBe('library');
  });

  it('sanitizeInterventionTopicFree rechaza texto vacío', () => {
    expect(sanitizeInterventionTopicFree('   ')).toBeNull();
    expect(sanitizeInterventionTopicFree('Me siento agotado del trabajo')).toContain('agotado');
  });

  it('sanitizeInterventionSource solo acepta snake_case', () => {
    expect(sanitizeInterventionSource('library_v1')).toBe('library_v1');
    expect(sanitizeInterventionSource('DROP TABLE')).toBe('library_v1');
  });

  it('sanitizeInterventionEventMeta filtra claves desconocidas', () => {
    const out = sanitizeInterventionEventMeta({
      surface: 'library',
      evil: 'payload',
      label: 'x'.repeat(300),
      tags: ['ansiedad', 42, 'x'.repeat(80)],
    });
    expect(out.surface).toBe('library');
    expect(out.evil).toBeUndefined();
    expect(out.label.length).toBeLessThanOrEqual(200);
    expect(out.tags).toHaveLength(2);
    expect(out.tags[0]).toBe('ansiedad');
    expect(out.tags[1].length).toBeLessThanOrEqual(40);
  });
});
