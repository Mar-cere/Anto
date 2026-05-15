import { describe, it, expect } from '@jest/globals';
import mailer from '../../../config/mailer.js';

describe('reEngagementEmail plantilla', () => {
  it('asunto; preheader oculto; tip determinista para 7 días (snapshot mínimo)', () => {
    const t = mailer.emailTemplates.reEngagementEmail('ana', 7);

    expect(t.subject).toMatchSnapshot();

    expect({
      preheaderOculto: t.html.includes('display:none') && t.html.includes('max-height:0'),
      mencionaSieteDias: t.html.includes('7') && t.html.includes('día'),
      tipIndice2: t.html.includes('Reflexiona con calma sobre emociones'),
    }).toMatchSnapshot();
  });

  it('normaliza días inválidos a 1 y rota tip (índice 1)', () => {
    const t = mailer.emailTemplates.reEngagementEmail('bob', NaN);

    expect({
      subject: t.subject,
      tipIndice1: t.html.includes('mindfulness'),
      unDiaEnCuerpo: t.html.includes('>1<') || t.html.includes('1 día'),
    }).toMatchSnapshot();
  });
});
