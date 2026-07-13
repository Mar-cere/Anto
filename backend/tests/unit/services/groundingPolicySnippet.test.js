/**
 * Tests para el snippet de política de grounding.
 * Valida que la política se genere correctamente en ES/EN y que el snippet de hechos sea válido.
 */

import { buildGroundingPolicySnippet, buildKnownFactsSnippet } from '../../../services/chat/groundingPolicySnippet.js';

describe('groundingPolicySnippet', () => {
  describe('buildGroundingPolicySnippet', () => {
    it('debe generar política en español por defecto', () => {
      const snippet = buildGroundingPolicySnippet();
      
      expect(snippet).toContain('POLÍTICA DE GROUNDING');
      expect(snippet).toContain('NUNCA inventes');
      expect(snippet).toContain('EJEMPLOS DE VIOLACIONES');
      expect(snippet).toContain('ENFOQUE CORRECTO');
      expect(snippet).toContain('síndrome del falso terapeuta');
    });

    it('debe generar política en español explícito', () => {
      const snippet = buildGroundingPolicySnippet('es');
      
      expect(snippet).toContain('POLÍTICA DE GROUNDING');
      expect(snippet).toContain('NUNCA inventes');
      expect(snippet).toContain('hechos biográficos');
    });

    it('debe generar política en inglés', () => {
      const snippet = buildGroundingPolicySnippet('en');
      
      expect(snippet).toContain('GROUNDING POLICY');
      expect(snippet).toContain('NEVER invent');
      expect(snippet).toContain('EXAMPLES OF VIOLATIONS');
      expect(snippet).toContain('CORRECT APPROACH');
      expect(snippet).toContain('false therapist syndrome');
    });

    it('debe incluir ejemplos concretos en español', () => {
      const snippet = buildGroundingPolicySnippet('es');
      
      expect(snippet).toContain('Estoy estresado');
      expect(snippet).toContain('problemas laborales');
      expect(snippet).toContain('Me siento solo');
      expect(snippet).toContain('ruptura');
      expect(snippet).toContain('¿Qué ha estado causando ese estrés?');
    });

    it('debe incluir ejemplos concretos en inglés', () => {
      const snippet = buildGroundingPolicySnippet('en');
      
      expect(snippet).toContain("I'm stressed");
      expect(snippet).toContain('work issues');
      expect(snippet).toContain('I feel alone');
      expect(snippet).toContain('breakup');
      expect(snippet).toContain("What's been causing that stress?");
    });
  });

  describe('buildKnownFactsSnippet', () => {
    it('debe retornar string vacío si no hay hechos', () => {
      expect(buildKnownFactsSnippet([])).toBe('');
      expect(buildKnownFactsSnippet(null)).toBe('');
      expect(buildKnownFactsSnippet(undefined)).toBe('');
    });

    it('debe generar snippet de hechos en español', () => {
      const facts = [
        { fact: 'Trabaja como diseñador', category: 'work', context: '12/07/2026' },
        { fact: 'Tiene 2 hijos', category: 'family', context: '10/07/2026' },
      ];

      const snippet = buildKnownFactsSnippet(facts, 'es');

      expect(snippet).toContain('HECHOS CONOCIDOS');
      expect(snippet).toContain('Trabaja como diseñador');
      expect(snippet).toContain('mencionado: 12/07/2026');
      expect(snippet).toContain('Tiene 2 hijos');
      expect(snippet).toContain('mencionado: 10/07/2026');
      expect(snippet).toContain('NO está aquí listado');
    });

    it('debe generar snippet de hechos en inglés', () => {
      const facts = [
        { fact: 'Works as a designer', category: 'work', context: '12/07/2026' },
      ];

      const snippet = buildKnownFactsSnippet(facts, 'en');

      expect(snippet).toContain('KNOWN FACTS');
      expect(snippet).toContain('Works as a designer');
      expect(snippet).toContain('mentioned: 12/07/2026');
      expect(snippet).toContain('NOT listed here');
    });

    it('debe listar múltiples hechos correctamente', () => {
      const facts = [
        { fact: 'Trabaja como profesor', category: 'work', context: '01/07/2026' },
        { fact: 'Estudia psicología', category: 'study', context: '05/07/2026' },
        { fact: 'Tiene una hermana', category: 'family', context: '08/07/2026' },
      ];

      const snippet = buildKnownFactsSnippet(facts, 'es');

      expect(snippet).toContain('Trabaja como profesor');
      expect(snippet).toContain('Estudia psicología');
      expect(snippet).toContain('Tiene una hermana');
      expect((snippet.match(/mencionado:/g) || []).length).toBe(3);
    });

    it('debe manejar hechos con caracteres especiales', () => {
      const facts = [
        { fact: 'Trabaja en TI (tecnología)', category: 'work', context: '12/07/2026' },
      ];

      const snippet = buildKnownFactsSnippet(facts, 'es');
      expect(snippet).toContain('Trabaja en TI (tecnología)');
    });
  });
});
