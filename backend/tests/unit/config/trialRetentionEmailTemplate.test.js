import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mailer from '../../../config/mailer.js';

describe('trialRetentionEmail plantilla', () => {
  beforeAll(() => {
    jest.useFakeTimers({ now: new Date('2026-06-01T12:00:00.000Z') });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('asunto; preheader oculto; aprox. días si quedan ≥24 h (snapshot mínimo)', () => {
    const trialEnd = new Date('2026-06-03T18:00:00.000Z');
    const t = mailer.emailTemplates.trialRetentionEmail('ana', trialEnd);

    expect(t.subject).toMatchSnapshot();

    expect({
      preheaderOculto: t.html.includes('display:none') && t.html.includes('max-height:0'),
      preheaderMencionaAprox2Dias: t.html.includes('aprox. 2 días'),
      preheaderMenciona54Horas: t.html.includes('54'),
      cuerpoMencionaDiasOrientativos: t.html.includes('modo orientativo')
    }).toMatchSnapshot();
  });

  it('pocas horas si quedan &lt;6 h; sin cifra exacta de horas en cuerpo ni preheader', () => {
    const trialEnd = new Date('2026-06-01T17:00:00.000Z');
    const t = mailer.emailTemplates.trialRetentionEmail('ana', trialEnd);

    expect({
      subject: t.subject,
      preheaderOculto: t.html.includes('display:none') && t.html.includes('max-height:0'),
      sinParrafoDiasOrientativos: !t.html.includes('modo orientativo'),
      pocasHorasEnPreheader: t.html.includes('pocas horas'),
      pocasHorasEnCuerpo: t.html.includes('pocas horas'),
      sinCincoHorasTexto: !t.html.includes('5 horas') && !t.html.includes('5 hora'),
    }).toMatchSnapshot();
  });
});
