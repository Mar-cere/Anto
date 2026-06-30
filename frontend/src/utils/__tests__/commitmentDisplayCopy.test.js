import { describe, expect, it } from '@jest/globals';
import {
  buildCommitmentDisplayTitle,
  buildCommitmentFollowUpPrompt,
  isGenericCommitmentLabel,
} from '../commitmentDisplayCopy';

const DASH_ES = {
  FOCUS_COMMITMENT_FOLLOW_UP_NAMED: '¿Cómo te fue con «{label}»?',
  FOCUS_COMMITMENT_FOLLOW_UP_BA: '¿Pudiste hacer algún paso pequeño de activación conductual?',
  FOCUS_COMMITMENT_TITLE_BA: 'Tu paso de activación conductual',
};

describe('commitmentDisplayCopy', () => {
  it('detecta etiquetas genéricas de intervención', () => {
    expect(isGenericCommitmentLabel('Activación conductual')).toBe(true);
    expect(isGenericCommitmentLabel('Dar un paseo de 10 minutos')).toBe(false);
  });

  it('usa prompt específico para activación conductual', () => {
    const prompt = buildCommitmentFollowUpPrompt(
      { label: 'Activación conductual', sourceMeta: { interventionId: 'behavioral_activation' } },
      DASH_ES,
    );
    expect(prompt).toBe(DASH_ES.FOCUS_COMMITMENT_FOLLOW_UP_BA);
  });

  it('cita el compromiso cuando la etiqueta es concreta', () => {
    const prompt = buildCommitmentFollowUpPrompt(
      { label: 'Salir a caminar 15 minutos' },
      DASH_ES,
    );
    expect(prompt).toContain('Salir a caminar 15 minutos');
  });

  it('ajusta el título para compromisos genéricos', () => {
    const title = buildCommitmentDisplayTitle(
      { label: 'Activación conductual', sourceMeta: { interventionId: 'behavioral_activation' } },
      DASH_ES,
    );
    expect(title).toBe(DASH_ES.FOCUS_COMMITMENT_TITLE_BA);
  });
});
