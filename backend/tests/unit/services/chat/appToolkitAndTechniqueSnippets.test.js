import { buildAppToolkitMapSnippet } from '../../../../services/chat/appToolkitMapSnippet.js';
import { buildProductActionProposalPolicySnippet } from '../../../../services/chat/productActionProposalPolicySnippet.js';
import {
  buildGratitudeJournalPromptSnippet,
  buildTechniqueSuggestionPromptSnippet,
} from '../../../../services/chat/techniqueSuggestionPromptSnippet.js';
import { buildSoftCrisisCheckInPromptSnippet } from '../../../../services/chat/softCrisisCheckInPromptSnippet.js';

describe('app toolkit + technique + soft19 snippets', () => {
  it('mapa ES/EN', () => {
    expect(buildAppToolkitMapSnippet('es')).toContain('### Mapa de herramientas de la app');
    expect(buildAppToolkitMapSnippet('en')).toContain('### App toolkit map');
    expect(buildAppToolkitMapSnippet('es')).toContain('Pomodoro');
  });

  it('policy tool on/off', () => {
    expect(buildProductActionProposalPolicySnippet('es', { toolEnabled: false })).toContain(
      'no** está disponible',
    );
    expect(buildProductActionProposalPolicySnippet('es', { toolEnabled: true })).toContain(
      'tool disponible',
    );
  });

  it('técnicas y gratitud', () => {
    const tech = buildTechniqueSuggestionPromptSnippet(
      ['breathing_exercise', 'psychoeducation_sleep'],
      'es',
    );
    expect(tech).toContain('respiración');
    expect(tech).not.toContain('psychoeducation_sleep');
    expect(
      buildGratitudeJournalPromptSnippet(['gratitude_journal'], 'en'),
    ).toContain('gratitude');
  });

  it('soft check-in solo si active', () => {
    expect(buildSoftCrisisCheckInPromptSnippet('es', { active: false })).toBe('');
    expect(buildSoftCrisisCheckInPromptSnippet('es', { active: true })).toContain('#19');
  });
});
