/**
 * Auditoría i18n de correos de producto (es/en): paridad de claves y fugas de español en EN.
 */
import { getMailerStrings } from '../constants/emailMailerStrings.js';
import { isSpanishish } from './pushCopyEnAudit.mjs';

/** Frases que no deben aparecer en HTML/asunto renderizado en inglés */
const EN_RENDER_DENYLIST = [
  /Resumen semanal/i,
  /Abrir mi resumen/i,
  /Verifica tu email/i,
  /Código de verificación/i,
  /Restablecer contraseña/i,
  /Bienvenido,/i,
  /Hace tiempo que no abres/i,
  /Tu prueba en/i,
  /termina pronto/i,
  /modo orientativo/i,
  /aprox\.\s*\d+\s*d[ií]as/i,
  /pocas horas/i,
  /Pequeños pasos, grandes cambios/i,
  /comprobante de compra/i,
  /otro periodo contigo/i,
  /¿/,
  /¡/,
  /\bhábitos\b/i,
  /\btareas\b/i,
  /correo automático, por favor no respondas/i,
];

function missingKeysRecursive(esNode, enNode, path = '') {
  const missing = [];
  if (
    esNode &&
    typeof esNode === 'object' &&
    !Array.isArray(esNode) &&
    enNode &&
    typeof enNode === 'object' &&
    !Array.isArray(enNode)
  ) {
    for (const key of Object.keys(esNode)) {
      const p = path ? `${path}.${key}` : key;
      if (!(key in enNode)) {
        missing.push(p);
        continue;
      }
      missing.push(...missingKeysRecursive(esNode[key], enNode[key], p));
    }
  }
  return missing;
}

function collectStringLeaves(value, path, out) {
  if (typeof value === 'string') {
    out.push({ path, text: value });
    return;
  }
  if (typeof value === 'function') return;
  if (Array.isArray(value)) {
    value.forEach((item, i) => collectStringLeaves(item, `${path}[${i}]`, out));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      collectStringLeaves(v, path ? `${path}.${k}` : k, out);
    }
  }
}

function checkRenderedText(id, subject, html, out) {
  const combined = `${subject}\n${html}`;
  for (const re of EN_RENDER_DENYLIST) {
    if (re.test(combined)) {
      const m = combined.match(re);
      out.spanishInRender.push({ id, marker: re.toString(), sample: (m?.[0] || '').slice(0, 80) });
      break;
    }
  }
  if (isSpanishish(subject) && !/Anto|Verification|Password|Welcome|trial|subscription|Week/i.test(subject)) {
    out.spanishInRender.push({ id, marker: 'isSpanishish(subject)', sample: subject.slice(0, 80) });
  }
}

/**
 * @param {import('../config/mailer.js').default['emailTemplates']} templates
 * @param {typeof import('../utils/weeklySummaryEmailContext.js').buildWeeklySummaryEmailContext} buildWeeklySummaryEmailContext
 */
export function auditRenderedEnTemplates(templates, buildWeeklySummaryEmailContext) {
  const out = { spanishInRender: [], identicalToEs: [] };
  const periodEnd = new Date('2026-12-31T12:00:00.000Z');
  const trialEnd = new Date('2026-06-03T18:00:00.000Z');
  const isoParts = { isoWeekYear: 2026, isoWeek: 16, yearWeekKey: '2026-W16' };
  const summaryCtx = buildWeeklySummaryEmailContext(
    { username: 'alex', subscription: { status: 'trial' } },
    isoParts,
    'en',
  );

  const cases = [
    ['verificationCode', () => templates.verificationCode('123456', 'en')],
    ['emailVerificationCode', () => templates.emailVerificationCode('123456', 'ana', 'en')],
    ['resetPassword', () => templates.resetPassword('reset-token-abc', 'en')],
    ['welcomeEmail', () => templates.welcomeEmail('ana', 'en')],
    ['reEngagementEmail', () => templates.reEngagementEmail('ana', 7, 'en')],
    ['trialRetentionEmail', () => templates.trialRetentionEmail('ana', trialEnd, 'en')],
    ['weeklyTipsEmail', () => templates.weeklyTipsEmail('ana', 3, 'en')],
    ['weeklySummaryEmail', () => templates.weeklySummaryEmail(summaryCtx, 'en')],
    [
      'subscriptionThankYouEmail',
      () => templates.subscriptionThankYouEmail('ana', 'monthly', periodEnd, null, 'en'),
    ],
    [
      'subscriptionThankYouEmail+receipt',
      () =>
        templates.subscriptionThankYouEmail('ana', 'yearly', periodEnd, { reference: 'REF-1' }, 'en'),
    ],
    [
      'subscriptionRenewalEmail',
      () =>
        templates.subscriptionRenewalEmail(
          'ana',
          'monthly',
          periodEnd,
          { reference: 'REF-2' },
          'en',
        ),
    ],
  ];

  for (const [id, render] of cases) {
    const en = render();
    checkRenderedText(id, en.subject, en.html, out);

    const esTpl = (() => {
      switch (id) {
        case 'verificationCode':
          return templates.verificationCode('123456', 'es');
        case 'emailVerificationCode':
          return templates.emailVerificationCode('123456', 'ana', 'es');
        case 'resetPassword':
          return templates.resetPassword('reset-token-abc', 'es');
        case 'welcomeEmail':
          return templates.welcomeEmail('ana', 'es');
        case 'reEngagementEmail':
          return templates.reEngagementEmail('ana', 7, 'es');
        case 'trialRetentionEmail':
          return templates.trialRetentionEmail('ana', trialEnd, 'es');
        case 'weeklyTipsEmail':
          return templates.weeklyTipsEmail('ana', 3, 'es');
        case 'weeklySummaryEmail':
          return templates.weeklySummaryEmail(
            buildWeeklySummaryEmailContext(
              { username: 'alex', subscription: { status: 'trial' } },
              isoParts,
              'es',
            ),
            'es',
          );
        case 'subscriptionThankYouEmail':
          return templates.subscriptionThankYouEmail('ana', 'monthly', periodEnd, null, 'es');
        case 'subscriptionThankYouEmail+receipt':
          return templates.subscriptionThankYouEmail(
            'ana',
            'yearly',
            periodEnd,
            { reference: 'REF-1' },
            'es',
          );
        case 'subscriptionRenewalEmail':
          return templates.subscriptionRenewalEmail(
            'ana',
            'monthly',
            periodEnd,
            { reference: 'REF-2' },
            'es',
          );
        default:
          return en;
      }
    })();

    if (en.subject === esTpl.subject && en.html === esTpl.html) {
      out.identicalToEs.push(id);
    }
  }

  return out;
}

/**
 * @returns {Promise<{ ok: boolean, report: object }>}
 */
export async function runEmailEnAudit(mailer, buildWeeklySummaryEmailContext) {
  const out = {
    missingStringKeys: [],
    spanishInStringTable: [],
    spanishInRender: [],
    identicalToEs: [],
  };

  const stringsEs = getMailerStrings('es');
  const stringsEn = getMailerStrings('en');
  out.missingStringKeys = missingKeysRecursive(stringsEs, stringsEn);

  const leaves = [];
  collectStringLeaves(stringsEn, 'mailer.en', leaves);
  for (const { path, text } of leaves) {
    if (isSpanishish(text)) {
      out.spanishInStringTable.push({ path, text: text.slice(0, 100) });
    }
  }

  const rendered = auditRenderedEnTemplates(
    mailer.emailTemplates,
    buildWeeklySummaryEmailContext,
  );
  out.spanishInRender = rendered.spanishInRender;
  out.identicalToEs = rendered.identicalToEs;

  const issueCount =
    out.missingStringKeys.length +
    out.spanishInStringTable.length +
    out.spanishInRender.length +
    out.identicalToEs.length;

  return {
    ok: issueCount === 0,
    report: {
      ...out,
      issueCount,
      counts: {
        missingStringKeys: out.missingStringKeys.length,
        spanishInStringTable: out.spanishInStringTable.length,
        spanishInRender: out.spanishInRender.length,
        identicalToEs: out.identicalToEs.length,
      },
    },
  };
}
