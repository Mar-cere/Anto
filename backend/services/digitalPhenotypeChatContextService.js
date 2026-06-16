/**
 * Snippet de contexto de salud digital para el chat (#216) — solo patrones claros.
 */
import {
  analyzePhenotypeTrends,
  fetchDigitalPhenotypeSeries,
} from './digitalPhenotypeService.js';
import { isDigitalHealthAllowed, getSignalConsentForUser } from './signalConsentService.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';

const LOOKBACK_DAYS = 7;

function buildSnippetFromTrends(trends, language) {
  const lang = language === 'en' ? 'en' : 'es';
  const lines = [];

  if (trends.prodromeSleepDelay) {
    lines.push(
      lang === 'en'
        ? 'Sleep has been shorter on recent days (aggregated from the phone). Worth noticing gently — not a diagnosis.'
        : 'El sueño ha sido más corto en días recientes (agregado del teléfono). Conviene notarlo con suavidad — no es un diagnóstico.',
    );
  }
  if (typeof trends.sleepTrend === 'number' && trends.sleepTrend < -0.4) {
    lines.push(
      lang === 'en'
        ? 'Sleep duration trended down this week compared to earlier in the window.'
        : 'La duración del sueño bajó esta semana respecto al inicio del periodo.',
    );
  }
  if (typeof trends.stepsTrend === 'number' && trends.stepsTrend < -500) {
    lines.push(
      lang === 'en'
        ? 'Less movement coincided with this period — a quiet-day pattern may be worth exploring.'
        : 'Hubo menos movimiento en este periodo — puede ser un patrón de día más quieto.',
    );
  }
  if (typeof trends.screenTrend === 'number' && trends.screenTrend > 30) {
    lines.push(
      lang === 'en'
        ? 'Screen time was higher than earlier in the week (aggregated).'
        : 'El tiempo en pantalla fue mayor que al inicio de la semana (agregado).',
    );
  }

  if (lines.length === 0) return null;

  const header =
    lang === 'en'
      ? '\n\n### Digital habits context (opt-in, observational)\n'
      : '\n\n### Contexto de hábitos digitales (opt-in, observacional)\n';
  const footer =
    lang === 'en'
      ? 'Mention only if relevant to the user\'s message. No diagnosis. Suggest one small behavioral tweak if appropriate.'
      : 'Menciona solo si encaja con el mensaje del usuario. Sin diagnóstico. Sugiere un micro-cambio conductual si encaja.';

  return `${header}${lines.map((l) => `- ${l}`).join('\n')}\n${footer}\n`;
}

export async function buildDigitalPhenotypeChatSnippet({ userId, language = 'es' } = {}) {
  if (!userId) return null;

  const consent = await getSignalConsentForUser(userId);
  if (!isDigitalHealthAllowed(consent)) return null;

  const lang = normalizeApiLanguage(language);
  const since = new Date();
  since.setDate(since.getDate() - LOOKBACK_DAYS);
  since.setHours(0, 0, 0, 0);

  const series = await fetchDigitalPhenotypeSeries({
    userId,
    since,
    limit: LOOKBACK_DAYS,
  });

  const withSignal = series.filter(
    (r) =>
      r?.sleepHours != null ||
      r?.steps != null ||
      r?.screenTimeMinutes != null ||
      r?.activeMinutes != null,
  );
  if (withSignal.length < 3) return null;

  const trends = analyzePhenotypeTrends(withSignal);
  const strong =
    trends.prodromeSleepDelay ||
    (typeof trends.sleepTrend === 'number' && Math.abs(trends.sleepTrend) >= 0.4) ||
    (typeof trends.stepsTrend === 'number' && Math.abs(trends.stepsTrend) >= 500) ||
    (typeof trends.screenTrend === 'number' && Math.abs(trends.screenTrend) >= 30);

  if (!strong) return null;

  return buildSnippetFromTrends(trends, lang);
}

export default {
  buildDigitalPhenotypeChatSnippet,
};
